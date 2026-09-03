from fastapi import APIRouter, Header
from fastapi.responses import StreamingResponse
from uuid import uuid4
from typing import Optional
from app.models.schemas import ChatRequest, ChatResponse
from app.services.agent.graph import codebase_agent

router = APIRouter(prefix="/chat", tags=["Agent Chat"])

@router.post("", response_model=ChatResponse)
async def chat_with_codebase(
    request: ChatRequest,
    x_llm_provider: Optional[str] = Header(None, alias="X-LLM-Provider"),
    x_llm_api_key: Optional[str] = Header(None, alias="X-LLM-API-Key"),
    x_llm_model: Optional[str] = Header(None, alias="X-LLM-Model"),
    x_llm_base_url: Optional[str] = Header(None, alias="X-LLM-Base-URL"),
):
    conversation_id = request.conversation_id or uuid4()
    provider = x_llm_provider or request.provider
    custom_api_key = x_llm_api_key or request.custom_api_key
    custom_model = x_llm_model or request.custom_model
    custom_base_url = x_llm_base_url or request.custom_base_url

    response = await codebase_agent.run(
        repository_id=request.repository_id,
        conversation_id=conversation_id,
        user_message=request.message,
        provider=provider,
        custom_api_key=custom_api_key,
        custom_model=custom_model,
        custom_base_url=custom_base_url
    )
    return response

@router.post("/stream")
async def stream_chat_with_codebase(
    request: ChatRequest,
    x_llm_provider: Optional[str] = Header(None, alias="X-LLM-Provider"),
    x_llm_api_key: Optional[str] = Header(None, alias="X-LLM-API-Key"),
    x_llm_model: Optional[str] = Header(None, alias="X-LLM-Model"),
    x_llm_base_url: Optional[str] = Header(None, alias="X-LLM-Base-URL"),
):
    conversation_id = request.conversation_id or uuid4()
    provider = x_llm_provider or request.provider
    custom_api_key = x_llm_api_key or request.custom_api_key
    custom_model = x_llm_model or request.custom_model
    custom_base_url = x_llm_base_url or request.custom_base_url

    return StreamingResponse(
        codebase_agent.astream_run(
            repository_id=request.repository_id,
            conversation_id=conversation_id,
            user_message=request.message,
            provider=provider,
            custom_api_key=custom_api_key,
            custom_model=custom_model,
            custom_base_url=custom_base_url
        ),
        media_type="text/event-stream"
    )
