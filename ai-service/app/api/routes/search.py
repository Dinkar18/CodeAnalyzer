from fastapi import APIRouter
from app.models.schemas import SearchRequest, SymbolSearchRequest, CodeEvidence, CodeSymbolResponse
from app.services.agent.tools import repo_tools

router = APIRouter(prefix="/search", tags=["Search"])

@router.post("/semantic")
async def semantic_search(request: SearchRequest):
    results = await repo_tools.semantic_search(request.repository_id, request.query, request.limit)
    return {
        "repository_id": request.repository_id,
        "query": request.query,
        "results": results
    }

@router.post("/symbols")
async def search_symbols(request: SymbolSearchRequest):
    stype = request.symbol_type.value if request.symbol_type else None
    results = await repo_tools.search_symbol(request.repository_id, request.symbol_name, stype)
    return {
        "repository_id": request.repository_id,
        "symbol_name": request.symbol_name,
        "results": results
    }

@router.get("/files/{repository_id}")
async def list_files(repository_id, prefix: str = ""):
    files = await repo_tools.list_files(repository_id, prefix)
    return {
        "repository_id": repository_id,
        "count": len(files),
        "files": files
    }

@router.get("/file/{repository_id}")
async def read_file(repository_id, path: str, start_line: int = None, end_line: int = None):
    return await repo_tools.read_file(repository_id, path, start_line, end_line)
