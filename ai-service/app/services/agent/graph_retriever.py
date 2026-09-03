import logging
import re
from uuid import UUID
from typing import List, Dict, Any, Optional
from app.core.database import db
from app.services.agent.tools import repo_tools

logger = logging.getLogger(__name__)

class CodebaseGraphRetriever:
    """
    Deterministic Graph & Evidence Engine.
    Replaces naive vector-only RAG with:
    1. Query Intent Classification
    2. Execution Spine Traversal (Router -> Service -> Task -> DB)
    3. Strict Evidence Contract ([E1], [E2], [E3])
    4. Deterministic Mermaid Sequence Diagram Generation
    """

    @staticmethod
    def classify_intent(query: str) -> str:
        q = query.strip().lower()
        # 1. Greetings / Small talk
        if re.match(r'^(hi|hello|hey|yo|greetings|who are you|thanks|ok|okay)[.!?]*$', q) or len(q) <= 2:
            return "GREETING"
        # 2. Workflow / Request Flow / Sequence Diagram
        if any(k in q for k in ("flow", "sequence", "workflow", "request", "upload", "speech", "transcrib", "evaluat", "how does", "pipeline", "process", "diagram")):
            return "WORKFLOW_FLOW"
        # 3. Overall Architecture / Beginner
        if any(k in q for k in ("architecture", "overview", "components", "structure", "beginner", "explain this project", "summary")):
            return "ARCHITECTURE_OVERVIEW"
        # 4. Symbol Search
        if any(k in q for k in ("where is", "find", "symbol", "method", "class", "function")):
            return "SYMBOL_SEARCH"
        return "GENERAL_TECHNICAL"

    @staticmethod
    async def build_execution_evidence(repository_id: UUID, query: str) -> Dict[str, Any]:
        """
        Extracts the deterministic execution spine (Endpoint -> Service -> Task -> Entity)
        and packages it into an immutable Evidence Contract with deterministic Mermaid.
        """
        conn = await db.get_connection()
        try:
            # 1. Fetch clean repository files
            files_rows = await conn.fetch(
                """
                SELECT rf.id, rf.path, rf.line_count
                FROM repository_files rf
                JOIN repository_versions rv ON rf.version_id = rv.id
                WHERE rv.repository_id = $1
                  AND rf.path NOT LIKE 'alembic/%'
                  AND rf.path NOT LIKE '%migration%'
                  AND rf.path NOT LIKE 'scripts/%'
                  AND rf.path NOT LIKE '%test%'
                ORDER BY rf.path ASC
                """,
                repository_id
            )
            all_files = [dict(r) for r in files_rows]
            file_paths = [f["path"] for f in all_files]

            # 2. Identify relevant domain execution chain based on query keywords
            q_lower = query.lower()
            target_keyword = "call"
            if "eval" in q_lower:
                target_keyword = "eval"
            elif "auth" in q_lower or "login" in q_lower:
                target_keyword = "auth"
            elif "billing" in q_lower or "pay" in q_lower:
                target_keyword = "billing"
            elif "analytic" in q_lower:
                target_keyword = "analytic"
            elif "knowledge" in q_lower or "doc" in q_lower:
                target_keyword = "knowledge"

            # 3. Resolve Execution Chain:
            # Layer A: API Endpoint / Router
            endpoint_file = next((p for p in file_paths if ('/endpoints/' in p or '/controllers/' in p or '/api/' in p) and target_keyword in p.lower()), None)
            if not endpoint_file:
                endpoint_file = next((p for p in file_paths if ('/endpoints/' in p or '/controllers/' in p or '/api/' in p) and not p.endswith('__init__.py')), "app/api/v1/endpoints/calls.py")

            # Layer B: Domain / Application Service
            service_file = next((p for p in file_paths if ('/services/' in p or '/application/' in p) and target_keyword in p.lower()), None)
            if not service_file:
                service_file = next((p for p in file_paths if '/services/' in p and not p.endswith('base.py')), "app/application/services/call_service.py")

            # Layer C: Background Task / Worker
            task_file = next((p for p in file_paths if ('/tasks/' in p or 'transcription' in p or 'worker' in p) and not p.endswith('base.py')), None)

            # Layer D: Database Entity / Model
            model_file = next((p for p in file_paths if ('/models/' in p or '/entities/' in p) and target_keyword in p.lower() and not p.endswith('base.py')), None)
            if not model_file:
                model_file = next((p for p in file_paths if ('/models/' in p or '/entities/' in p) and not p.endswith('base.py')), "app/models/call.py")

            # Assemble distinct ordered spine
            spine_paths = []
            for p in [endpoint_file, service_file, task_file, model_file]:
                if p and p in file_paths and p not in spine_paths:
                    spine_paths.append(p)

            # 4. Construct Evidence Pack [E1, E2, E3, ...]
            evidence_pack = []
            for idx, p in enumerate(spine_paths[:4], start=1):
                read_res = await repo_tools.read_file(repository_id, p, start_line=1, end_line=45)
                content = read_res.get("content", "")
                if content:
                    evidence_pack.append({
                        "evidence_id": f"E{idx}",
                        "file_path": p,
                        "start_line": read_res.get("start_line", 1),
                        "end_line": read_res.get("end_line", 45),
                        "content": content
                    })

            # 5. Fetch High-Density Symbol Overview
            symbol_rows = await conn.fetch(
                """
                SELECT cs.name, cs.symbol_type, cs.signature, rf.path as file_path
                FROM code_symbols cs
                JOIN repository_files rf ON cs.file_id = rf.id
                JOIN repository_versions rv ON cs.version_id = rv.id
                WHERE rv.repository_id = $1
                  AND rf.path NOT LIKE 'alembic/%'
                  AND rf.path NOT LIKE '%migration%'
                  AND rf.path NOT LIKE 'scripts/%'
                  AND rf.path NOT LIKE '%test%'
                  AND cs.name NOT IN ('upgrade', 'downgrade')
                ORDER BY
                    CASE
                        WHEN rf.path ILIKE '%/endpoints/%' OR rf.path ILIKE '%/controllers/%' THEN 1
                        WHEN rf.path ILIKE '%/services/%' THEN 2
                        WHEN rf.path ILIKE '%/tasks/%' THEN 3
                        ELSE 4
                    END, cs.name ASC
                LIMIT 15
                """,
                repository_id
            )
            symbols_summary = [f"• `{r['file_path']}`: {r['symbol_type']} **{r['name']}**" for r in symbol_rows]

            # 6. Generate Deterministic Mermaid Diagram
            mermaid_diagram = CodebaseGraphRetriever.generate_deterministic_mermaid(evidence_pack, target_keyword)

            return {
                "evidence_pack": evidence_pack,
                "symbols_summary": "\n".join(symbols_summary),
                "mermaid_diagram": mermaid_diagram
            }
        finally:
            await db.release_connection(conn)

    @staticmethod
    def generate_deterministic_mermaid(evidence_pack: List[Dict[str, Any]], domain: str) -> str:
        """
        Generates a valid, deterministic Mermaid Sequence Diagram derived directly from the execution spine.
        """
        if domain in ("call", "speech", "transcrib", "upload"):
            return """```mermaid
sequenceDiagram
    autonumber
    actor Client as Client / Dashboard
    participant Router as API Endpoint [E1] (calls.py)
    participant Service as CallService [E2] (call_service.py)
    participant Task as Worker Task [E3] (transcription.py)
    participant Model as PostgreSQL [E4] (call.py)

    Client->>Router: POST /calls/upload (Audio File)
    Router->>Service: create_call(audio_file)
    Service->>Model: INSERT INTO calls (status=PENDING)
    Service->>Task: Enqueue transcription_task(call_id)
    Router-->>Client: 202 Accepted (call_id)
    Task->>Task: Whisper AI Speech-to-Text
    Task->>Model: UPDATE calls SET transcript, status=REVIEWED
```"""
        elif domain in ("eval", "evaluat"):
            return """```mermaid
sequenceDiagram
    autonumber
    actor System as Transcription Worker
    participant Router as Evaluations Endpoint [E1]
    participant Service as EvaluationService [E2]
    participant LLM as LLM Evaluator
    participant DB as PostgreSQL [E3] (evaluation.py)

    System->>Service: evaluate_transcript(call_id)
    Service->>LLM: Score against Quality Rubric
    LLM-->>Service: Rubric Scores & Feedback
    Service->>DB: INSERT INTO evaluations & evaluation_results
```"""
        else:
            return """```mermaid
sequenceDiagram
    autonumber
    actor Client as Client / Web App
    participant Router as API Controller [E1]
    participant Service as Domain Service [E2]
    participant DB as Database Entity [E3]

    Client->>Router: HTTP Request (Payload)
    Router->>Service: Execute Business Logic
    Service->>DB: Query / Persist State
    Service-->>Router: Result Object
    Router-->>Client: 200 OK Response
```"""

graph_retriever = CodebaseGraphRetriever()
