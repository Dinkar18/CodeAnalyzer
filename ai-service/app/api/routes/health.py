from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
async def health_check():
    return {
        "status": "HEALTHY",
        "app": settings.APP_NAME,
        "default_llm_provider": settings.DEFAULT_LLM_PROVIDER,
        "embedding_provider": settings.EMBEDDING_PROVIDER
    }
