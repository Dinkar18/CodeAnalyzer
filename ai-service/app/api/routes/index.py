from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from uuid import UUID
from typing import List, Dict, Any
from app.models.schemas import IndexRepositoryRequest, IndexStatusResponse, RepositoryStatus
from app.services.ingestion.indexer import repository_indexer
from app.services.ingestion.git_service import git_service
from app.core.redis_client import redis_manager
from app.core.database import db

router = APIRouter(prefix="/index", tags=["Indexing & Git"])

@router.post("", response_model=IndexStatusResponse)
async def trigger_indexing(request: IndexRepositoryRequest, background_tasks: BackgroundTasks):
    job_id = str(request.repository_id)
    
    # Check if already running
    current_status = await redis_manager.get_job_status(job_id)
    if current_status and current_status.get("status") == RepositoryStatus.INDEXING.value and not request.force_reindex:
        return IndexStatusResponse(**current_status)

    # Launch indexing in background task
    background_tasks.add_task(
        repository_indexer.index_repository,
        request.repository_id,
        request.url,
        request.branch or "main",
        request.force_reindex
    )

    initial_response = IndexStatusResponse(
        repository_id=request.repository_id,
        status=RepositoryStatus.INDEXING,
        progress_percentage=0,
        current_step="Indexing task scheduled."
    )
    await redis_manager.set_job_status(job_id, initial_response.model_dump(mode='json'))
    return initial_response

@router.get("/status/{repository_id}", response_model=IndexStatusResponse)
async def get_index_status(repository_id: UUID):
    job_id = str(repository_id)
    status_data = await redis_manager.get_job_status(job_id)
    
    if status_data:
        return IndexStatusResponse(**status_data)

    # Fallback check database
    conn = await db.get_connection()
    try:
        row = await conn.fetchrow(
            """
            SELECT r.status, rv.file_count, rv.symbol_count, rv.chunk_count 
            FROM repositories r
            LEFT JOIN repository_versions rv ON r.id = rv.repository_id
            WHERE r.id = $1
            ORDER BY rv.indexed_at DESC LIMIT 1
            """,
            repository_id
        )
        if not row:
            raise HTTPException(status_code=404, detail="Repository not found")

        return IndexStatusResponse(
            repository_id=repository_id,
            status=RepositoryStatus(row["status"]),
            progress_percentage=100 if row["status"] == "READY" else 0,
            current_step="Ready" if row["status"] == "READY" else row["status"],
            file_count=row["file_count"] or 0,
            symbol_count=row["symbol_count"] or 0,
            chunk_count=row["chunk_count"] or 0
        )
    finally:
        await db.release_connection(conn)

@router.get("/{repository_id}/branches", response_model=List[str])
async def get_repository_branches(repository_id: UUID):
    branches = git_service.list_branches(repository_id)
    return branches

@router.get("/{repository_id}/diff", response_model=Dict[str, Any])
async def get_repository_diff(
    repository_id: UUID,
    base: str = Query("main", description="Base branch"),
    target: str = Query("HEAD", description="Target branch or commit")
):
    diff_data = git_service.get_diff(repository_id, base, target)
    return diff_data
