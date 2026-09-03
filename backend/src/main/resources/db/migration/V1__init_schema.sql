-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Repositories
CREATE TABLE IF NOT EXISTS repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    url VARCHAR(512) NOT NULL UNIQUE,
    default_branch VARCHAR(100) DEFAULT 'main',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    technology_stack JSONB DEFAULT '[]'::jsonb,
    application_type VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Repository Versions (tracked by commit SHA for idempotency)
CREATE TABLE IF NOT EXISTS repository_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    commit_sha VARCHAR(64) NOT NULL,
    indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    file_count INT DEFAULT 0,
    symbol_count INT DEFAULT 0,
    chunk_count INT DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'INDEXING',
    CONSTRAINT uq_repo_commit UNIQUE(repository_id, commit_sha)
);

-- 3. Repository Files
CREATE TABLE IF NOT EXISTS repository_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID NOT NULL REFERENCES repository_versions(id) ON DELETE CASCADE,
    path VARCHAR(1024) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    extension VARCHAR(50),
    language VARCHAR(50),
    size_bytes BIGINT DEFAULT 0,
    line_count INT DEFAULT 0,
    content TEXT,
    is_binary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_version_file_path UNIQUE(version_id, path)
);

-- 4. Code Symbols (AST extracted classes, methods, functions, interfaces)
CREATE TABLE IF NOT EXISTS code_symbols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID NOT NULL REFERENCES repository_versions(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES repository_files(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    symbol_type VARCHAR(50) NOT NULL,
    container_name VARCHAR(255),
    start_line INT NOT NULL,
    end_line INT NOT NULL,
    signature TEXT,
    docstring TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Code Chunks (Semantic code & document chunks with vector embeddings)
CREATE TABLE IF NOT EXISTS code_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID NOT NULL REFERENCES repository_versions(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES repository_files(id) ON DELETE CASCADE,
    chunk_type VARCHAR(50) NOT NULL,
    start_line INT NOT NULL,
    end_line INT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    embedding vector(768),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Dependency Graph Edges
CREATE TABLE IF NOT EXISTS dependency_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID NOT NULL REFERENCES repository_versions(id) ON DELETE CASCADE,
    source_symbol_id UUID REFERENCES code_symbols(id) ON DELETE CASCADE,
    target_symbol_id UUID REFERENCES code_symbols(id) ON DELETE CASCADE,
    source_file_id UUID REFERENCES repository_files(id) ON DELETE CASCADE,
    target_file_id UUID REFERENCES repository_files(id) ON DELETE CASCADE,
    edge_type VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    evidence JSONB DEFAULT '[]'::jsonb,
    tokens_used INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Agent Runs
CREATE TABLE IF NOT EXISTS agent_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    agent_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    input_prompt TEXT,
    output_result TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 10. Structured Findings (Architecture, Security, Performance, Testing)
CREATE TABLE IF NOT EXISTS findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID NOT NULL REFERENCES repository_versions(id) ON DELETE CASCADE,
    agent_run_id UUID REFERENCES agent_runs(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(1024),
    line_number INT,
    finding TEXT NOT NULL,
    evidence TEXT,
    recommendation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_repo_url ON repositories(url);
CREATE INDEX IF NOT EXISTS idx_repo_status ON repositories(status);
CREATE INDEX IF NOT EXISTS idx_versions_repo ON repository_versions(repository_id);
CREATE INDEX IF NOT EXISTS idx_files_version_path ON repository_files(version_id, path);
CREATE INDEX IF NOT EXISTS idx_symbols_version_name ON code_symbols(version_id, name);
CREATE INDEX IF NOT EXISTS idx_symbols_type ON code_symbols(version_id, symbol_type);
CREATE INDEX IF NOT EXISTS idx_chunks_version ON code_chunks(version_id);
CREATE INDEX IF NOT EXISTS idx_dep_edges_version ON dependency_edges(version_id);
CREATE INDEX IF NOT EXISTS idx_dep_edges_type ON dependency_edges(version_id, edge_type);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_findings_version_category ON findings(version_id, category, severity);

-- Vector Index (HNSW) for fast cosine similarity search
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw ON code_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
