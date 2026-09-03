# 🧠 AI Codebase Architect

> **Production-grade AI Software Engineering Workspace** capable of understanding entire repositories, extracting AST symbols, performing semantic vector retrieval via `pgvector`, running stateful LangGraph agent workflows, and conducting deep architecture, security, performance, and testing audits.

---

## 🏗️ Architecture Overview

```text
                             USER
                              │
                              ▼
                React 18 + Tailwind CSS Frontend
                              │
                              ▼
            Spring Boot 3 (Java 21) REST Backend
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
  PostgreSQL 16 + pgvector  Redis 7             FastAPI AI Service
  (Relational & Vectors)   (Caching & Status)  (Python 3.11+)
                                                    │
                                                    ▼
                                            LangGraph Agent
                                                    │
                                     ┌──────────────┴──────────────┐
                                     ▼                             ▼
                            Repository Tools               Specialist Agents
                      (Read, Symbol, Search, Graph)    (Arch, Security, Perf, Test)
                                     │
                                     ▼
                            LLM Provider Layer
                       (Gemini / Groq / Ollama)
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- [Docker & Docker Compose](https://www.docker.com/) (v20+ / Compose v2+)
- (Optional) Python 3.11+, Java 21, Node.js 20+ if running services individually outside Docker.

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your API keys in `.env`:
```ini
DEFAULT_LLM_PROVIDER=gemini
GEMINI_API_KEY=your_google_gemini_api_key_here
# Or use Groq / Ollama:
# GROQ_API_KEY=your_groq_api_key_here
```

### 3. Launch All Services with Docker Compose
```bash
docker compose up --build -d
```

### 4. Access the Workspace
- 🌐 **Frontend Workspace**: [http://localhost:3000](http://localhost:3000)
- ⚙️ **Spring Boot REST API**: [http://localhost:8080](http://localhost:8080)
- 🤖 **FastAPI AI Service & Swagger Docs**: [http://localhost:8001/docs](http://localhost:8001/docs)

---

## 📂 Repository Structure

```text
AICodebaseArchitect/
├── docker-compose.yml              # Local multi-service orchestrator
├── .env.example                    # Environment configuration template
│
├── backend/                        # Java 21 + Spring Boot 3 Backend
│   ├── src/main/java/.../
│   │   ├── config/                 # Security, Redis, WebClient configs
│   │   ├── controller/             # REST API Controllers (/api/repositories, /api/chat, /api/analysis, /api/files)
│   │   ├── dto/                    # Request/Response records & validation
│   │   ├── exception/              # Global REST Exception Handler
│   │   ├── model/entity/           # JPA Entities (Repositories, Versions, Files, Symbols, Findings)
│   │   ├── repository/             # Spring Data JPA interfaces
│   │   └── service/                # Business logic & AI Service HTTP Client
│   └── src/main/resources/
│       ├── application.yml         # Spring configuration
│       └── db/migration/           # Flyway PostgreSQL + pgvector DDL schema
│
├── ai-service/                     # Python 3.11+ FastAPI + LangGraph AI Service
│   ├── app/
│   │   ├── api/routes/             # Indexing, Semantic Search, Chat, and Analysis endpoints
│   │   ├── core/                   # Database pool (asyncpg + pgvector), Redis, Settings
│   │   ├── models/                 # Pydantic schemas
│   │   └── services/
│   │       ├── agent/              # LangGraph stateful graph, Provider factory (Gemini/Groq/Ollama), Tools, Specialists
│   │       ├── embedding/          # Gemini / Ollama / Fallback embedding generator
│   │       ├── ingestion/          # Git cloning, Tech stack detector, App type classifier
│   │       └── parser/             # Tree-sitter AST parser, Semantic code chunker
│   └── requirements.txt
│
└── frontend/                       # React 18 + Vite + Tailwind CSS Workspace UI
    ├── src/
    │   ├── components/             # Header, FileExplorer, CodeViewer, ChatPanel, FindingsPanel, RepositoryModal
    │   └── services/               # Axios API client
    └── package.json
```

---

## 💡 Core Capabilities

1. **Repository Ingestion & Idempotent Indexing**: Clones Git repos, tracks Git commit SHAs, and automatically detects technology stacks and application types.
2. **Structural AST Intelligence**: Extracts classes, interfaces, methods, functions, and signatures via Tree-sitter.
3. **Semantic & Vector Retrieval**: Chunks code along class/method boundaries and indexes embeddings into PostgreSQL with `pgvector` HNSW indexes.
4. **Stateful LangGraph Workflows**: Conversational repository exploration backed by direct file reads, symbol lookups, and semantic search.
5. **Specialist Engineering Audits**: Automated Architecture, Security, Performance, and Testing analysis with structured finding cards.
6. **Zero-Credit-Card Free Cloud Deployment**: Compatible with Hugging Face Spaces (16GB RAM Docker Space) and Supabase + Render.
