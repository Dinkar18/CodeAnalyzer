from fastapi import APIRouter
from typing import List
from app.models.schemas import AnalyzeRequest, FindingResponse
from app.services.agent.specialists import specialist_agents

router = APIRouter(prefix="/analyze", tags=["Specialist Analysis"])

@router.post("", response_model=List[FindingResponse])
async def run_analysis(request: AnalyzeRequest):
    findings = await specialist_agents.analyze(
        repository_id=request.repository_id,
        categories=request.categories
    )
    return findings
