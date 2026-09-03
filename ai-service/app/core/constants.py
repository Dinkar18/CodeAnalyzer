"""
Centralized API route prefixes and application constants for the AI Service.
"""

class ApiRoutes:
    BASE = "/api"
    HEALTH = "/api/health"
    INDEX = "/api/index"
    INDEX_STATUS = "/api/index/status/{repository_id}"
    SEARCH = "/api/search"
    CHAT = "/api/chat"
    ANALYZE = "/api/analyze"
    GRAPH = "/api/graph"
    GRAPH_BY_REPO = "/api/graph/{repository_id}"

class LLMProviders:
    GEMINI = "gemini"
    GROQ = "groq"
    OLLAMA = "ollama"

class SymbolTypes:
    CLASS = "CLASS"
    INTERFACE = "INTERFACE"
    FUNCTION = "FUNCTION"
    METHOD = "METHOD"
    ENUM = "ENUM"

class GraphNodeTypes:
    MODULE = "MODULE"
    FILE = "FILE"
    SYMBOL = "SYMBOL"

class GraphEdgeTypes:
    CONTAINS = "CONTAINS"
    DEFINES = "DEFINES"
    DEPENDS_ON = "DEPENDS_ON"
