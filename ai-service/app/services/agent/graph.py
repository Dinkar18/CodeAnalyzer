import logging
import json
from uuid import UUID, uuid4
from typing import TypedDict, List, Dict, Any, Optional, AsyncGenerator
from langgraph.graph import StateGraph, END
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage
from app.services.agent.llm_provider import llm_factory
from app.services.agent.graph_retriever import graph_retriever
from app.models.schemas import CodeEvidence, ChatResponse

logger = logging.getLogger(__name__)

class AgentState(TypedDict):
    repository_id: UUID
    conversation_id: UUID
    messages: List[BaseMessage]
    provider: Optional[str]
    custom_api_key: Optional[str]
    custom_model: Optional[str]
    custom_base_url: Optional[str]
    intent: str
    symbol_map_summary: str
    evidence_pack: List[Dict[str, Any]]
    mermaid_diagram: str
    evidence: List[CodeEvidence]
    final_response: str

class CodebaseAgentGraph:
    def __init__(self):
        self.workflow = self._build_workflow()

    def _build_workflow(self) -> StateGraph:
        graph = StateGraph(AgentState)

        graph.add_node("retrieve_context", self._retrieve_context)
        graph.add_node("synthesize_response", self._synthesize_response)

        graph.set_entry_point("retrieve_context")
        graph.add_edge("retrieve_context", "synthesize_response")
        graph.add_edge("synthesize_response", END)

        return graph.compile()

    async def _retrieve_context(self, state: AgentState) -> Dict[str, Any]:
        repository_id = state["repository_id"]
        last_message = state["messages"][-1].content
        intent = graph_retriever.classify_intent(last_message)

        if intent == "GREETING":
            return {
                "intent": "GREETING",
                "symbol_map_summary": "",
                "evidence_pack": [],
                "mermaid_diagram": "",
                "evidence": []
            }

        execution_data = await graph_retriever.build_execution_evidence(repository_id, last_message)
        evidence_pack = execution_data["evidence_pack"]
        symbols_summary = execution_data["symbols_summary"]
        mermaid_diagram = execution_data["mermaid_diagram"]

        evidence_list = [
            CodeEvidence(
                file_path=e["file_path"],
                start_line=e["start_line"],
                end_line=e["end_line"],
                snippet=e["content"][:300]
            )
            for e in evidence_pack
        ]

        return {
            "intent": intent,
            "symbol_map_summary": symbols_summary,
            "evidence_pack": evidence_pack,
            "mermaid_diagram": mermaid_diagram,
            "evidence": evidence_list
        }

    def _build_system_prompt(self, evidence_pack: List[Dict[str, Any]], symbol_map: str, mermaid_diagram: str, intent: str) -> str:
        if intent == "GREETING":
            return """You are the Senior AI Codebase Architect & Mentor.
Greet the developer warmly and let them know you are ready to analyze the loaded codebase, explain request flows, generate Mermaid UML/architecture diagrams, or audit security."""

        evidence_text = "\n\n".join([
            f"[{e['evidence_id']}] File: `{e['file_path']}` (Lines {e['start_line']}-{e['end_line']})\n```\n{e['content']}\n```"
            for e in evidence_pack
        ])

        return f"""You are a Principal Software Architect and Systems Engineer.
Deliver a clear, production-grade architectural analysis strictly grounded in the verified code evidence below.

Format your response using these exact markdown sections:

## 1. Executive Overview
A concise 2-3 sentence overview explaining how this feature/system is designed and what it accomplishes.

## 2. Core Request Flow
{mermaid_diagram}

## 3. Component Responsibility Breakdown
A standard Markdown table mapping each layer to its file and responsibility:
| Layer | File Path | Primary Responsibility | Evidence |
| :--- | :--- | :--- | :--- |
(Fill rows based on [E1], [E2], [E3], [E4] without repeating rows)

## 4. Key Implementation Citations
• Bullet points referencing exact Evidence IDs (e.g. `[E1] app/api/v1/endpoints/calls.py:L20-L45`).

Rules:
- Cite ONLY Evidence IDs [E1], [E2], [E3], [E4].
- Do not invent fake libraries, packages, or unreferenced imports.
- Do not repeat table rows or introductory phrases.

Verified Code Evidence:
{evidence_text if evidence_text else "Repository structure loaded."}
"""

    async def _synthesize_response(self, state: AgentState) -> Dict[str, Any]:
        llm = llm_factory.get_llm(
            provider_name=state.get("provider"),
            custom_api_key=state.get("custom_api_key"),
            custom_model=state.get("custom_model"),
            custom_base_url=state.get("custom_base_url")
        )
        evidence_pack = state.get("evidence_pack", [])
        symbol_map = state.get("symbol_map_summary", "")
        mermaid_diagram = state.get("mermaid_diagram", "")
        intent = state.get("intent", "GENERAL_TECHNICAL")

        system_prompt = self._build_system_prompt(evidence_pack, symbol_map, mermaid_diagram, intent)
        recent_history = state["messages"][-4:]
        messages = [SystemMessage(content=system_prompt)] + recent_history

        try:
            response = await llm.ainvoke(messages)
            if hasattr(response, 'content'):
                if isinstance(response.content, list):
                    content = "".join([part.get("text", "") if isinstance(part, dict) else str(part) for part in response.content])
                else:
                    content = str(response.content)
            else:
                content = str(response)
        except Exception as e:
            logger.warning(f"LLM generation notice: {e}")
            content = f"⚠️ Notice: {str(e)}"

        return {"final_response": content}

    async def run(
        self,
        repository_id: UUID,
        conversation_id: UUID,
        user_message: str,
        provider: Optional[str] = None,
        custom_api_key: Optional[str] = None,
        custom_model: Optional[str] = None,
        custom_base_url: Optional[str] = None
    ) -> ChatResponse:
        initial_state: AgentState = {
            "repository_id": repository_id,
            "conversation_id": conversation_id,
            "messages": [HumanMessage(content=user_message)],
            "provider": provider,
            "custom_api_key": custom_api_key,
            "custom_model": custom_model,
            "custom_base_url": custom_base_url,
            "intent": "GENERAL_TECHNICAL",
            "symbol_map_summary": "",
            "evidence_pack": [],
            "mermaid_diagram": "",
            "evidence": [],
            "final_response": ""
        }

        result = await self.workflow.ainvoke(initial_state)

        return ChatResponse(
            conversation_id=conversation_id,
            response=result["final_response"],
            evidence=result.get("evidence", []),
            provider_used=provider or "default"
        )

    async def astream_run(
        self,
        repository_id: UUID,
        conversation_id: UUID,
        user_message: str,
        provider: Optional[str] = None,
        custom_api_key: Optional[str] = None,
        custom_model: Optional[str] = None,
        custom_base_url: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        initial_state: AgentState = {
            "repository_id": repository_id,
            "conversation_id": conversation_id,
            "messages": [HumanMessage(content=user_message)],
            "provider": provider,
            "custom_api_key": custom_api_key,
            "custom_model": custom_model,
            "custom_base_url": custom_base_url,
            "intent": "GENERAL_TECHNICAL",
            "symbol_map_summary": "",
            "evidence_pack": [],
            "mermaid_diagram": "",
            "evidence": [],
            "final_response": ""
        }

        retrieved_data = await self._retrieve_context(initial_state)
        evidence_pack = retrieved_data["evidence_pack"]
        symbol_map = retrieved_data.get("symbol_map_summary", "")
        mermaid_diagram = retrieved_data.get("mermaid_diagram", "")
        intent = retrieved_data.get("intent", "GENERAL_TECHNICAL")
        evidence_list = retrieved_data["evidence"]

        llm = llm_factory.get_llm(
            provider_name=provider,
            custom_api_key=custom_api_key,
            custom_model=custom_model,
            custom_base_url=custom_base_url
        )
        system_prompt = self._build_system_prompt(evidence_pack, symbol_map, mermaid_diagram, intent)
        messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_message)]

        yield f"data: {json.dumps({'type': 'start', 'conversation_id': str(conversation_id)})}\n\n"

        full_content = ""
        try:
            async for chunk in llm.astream(messages):
                raw_token = chunk.content if hasattr(chunk, 'content') else str(chunk)
                if isinstance(raw_token, list):
                    token = "".join([part.get("text", "") if isinstance(part, dict) else str(part) for part in raw_token])
                else:
                    token = str(raw_token)
                
                if token:
                    full_content += token
                    yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
        except Exception as e:
            logger.warning(f"Streaming fallback notice: {e}")
            fallback_text = f"\n\n*Notice: Provider error: {str(e)}.*"
            yield f"data: {json.dumps({'type': 'token', 'content': fallback_text})}\n\n"

        yield f"data: {json.dumps({'type': 'done', 'conversation_id': str(conversation_id), 'evidence': [e.model_dump() for e in evidence_list]})}\n\n"

codebase_agent = CodebaseAgentGraph()
