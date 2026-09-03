from pydantic import BaseModel, Field, HttpUrl, ConfigDict
from typing import List, Optional, Dict, Any
from enum import Enum
from uuid import UUID
from datetime import datetime

class RepositoryStatus(str, Enum):
    PENDING = "PENDING"
    INDEXING = "INDEXING"
    READY = "READY"
    FAILED = "FAILED"

class SymbolType(str, Enum):
    CLASS = "CLASS"
    INTERFACE = "INTERFACE"
    METHOD = "METHOD"
    FUNCTION = "FUNCTION"
    VARIABLE = "VARIABLE"
    ENUM = "ENUM"
    ANNOTATION = "ANNOTATION"

class ChunkType(str, Enum):
    CODE_BLOCK = "CODE_BLOCK"
    CLASS = "CLASS"
    METHOD = "METHOD"
    DOC_SECTION = "DOC_SECTION"
    CONFIG = "CONFIG"

class FindingCategory(str, Enum):
    ARCHITECTURE = "ARCHITECTURE"
    SECURITY = "SECURITY"
    PERFORMANCE = "PERFORMANCE"
    TESTING = "TESTING"

class FindingSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

# Request Models
class IndexRepositoryRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")
    repository_id: UUID
    url: str
    branch: Optional[str] = "main"
    force_reindex: bool = False

class SearchRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")
    repository_id: UUID
    query: str
    limit: int = 10
    version_id: Optional[UUID] = None

class SymbolSearchRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")
    repository_id: UUID
    symbol_name: str
    symbol_type: Optional[SymbolType] = None
    limit: int = 10

class ChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")
    repository_id: UUID
    message: str
    conversation_id: Optional[UUID] = None
    provider: Optional[str] = None # gemini, openai, anthropic, groq, deepseek, ollama
    custom_api_key: Optional[str] = None
    custom_model: Optional[str] = None
    custom_base_url: Optional[str] = None

class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")
    repository_id: UUID
    categories: List[FindingCategory] = Field(default_factory=lambda: [
        FindingCategory.ARCHITECTURE,
        FindingCategory.SECURITY,
        FindingCategory.PERFORMANCE,
        FindingCategory.TESTING
    ])

# Response Models
class IndexStatusResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")
    repository_id: UUID
    status: RepositoryStatus
    progress_percentage: int = 0
    current_step: str = ""
    error_message: Optional[str] = None
    file_count: int = 0
    symbol_count: int = 0
    chunk_count: int = 0

class CodeEvidence(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")
    file_path: str
    start_line: int
    end_line: int
    snippet: str
    relevance_score: Optional[float] = None

class CodeSymbolResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")
    id: UUID
    name: str
    symbol_type: SymbolType
    file_path: str
    start_line: int
    end_line: int
    signature: Optional[str] = None
    docstring: Optional[str] = None
    container_name: Optional[str] = None

class FindingResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")
    category: FindingCategory
    severity: FindingSeverity
    title: str
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    finding: str
    evidence: Optional[str] = None
    recommendation: str

class ChatResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")
    conversation_id: UUID
    response: str
    evidence: List[CodeEvidence] = Field(default_factory=list)
    provider_used: str
