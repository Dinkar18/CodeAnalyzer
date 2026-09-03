import os
import logging
from uuid import UUID, uuid4
from typing import Dict, Any
from app.core.database import db
from app.core.redis_client import redis_manager
from app.services.ingestion.git_service import git_service
from app.services.ingestion.technology_detector import technology_detector
from app.services.ingestion.app_type_detector import app_type_detector
from app.services.parser.ast_parser import ast_parser
from app.services.parser.chunker import code_chunker
from app.services.embedding.embedding_service import embedding_service
from app.models.schemas import RepositoryStatus

logger = logging.getLogger(__name__)

# Supported code and doc extensions
SUPPORTED_EXTENSIONS = {
    '.cs': 'csharp',
    '.java': 'java',
    '.py': 'python',
    '.js': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.jsx': 'javascript',
    '.go': 'go',
    '.rs': 'rust',
    '.cpp': 'cpp',
    '.c': 'c',
    '.h': 'c',
    '.kt': 'kotlin',
    '.swift': 'swift',
    '.md': 'markdown',
    '.xml': 'xml',
    '.json': 'json',
    '.yml': 'yaml',
    '.yaml': 'yaml',
    '.csproj': 'xml',
    '.sln': 'text',
    '.properties': 'properties',
    '.sql': 'sql',
    '.txt': 'text'
}

# Ignore noisy lockfiles, build artifacts, and compiler generated files
IGNORED_FILENAMES = {
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'poetry.lock', 
    'cargo.lock', 'composer.lock', 'pipfile.lock', 'bundle.js',
    'project.assets.json'
}

EXCLUDED_DIR_NAMES = {
    'node_modules', 'target', 'build', 'dist', '__pycache__', 'venv', '.venv',
    'bin', 'obj', 'out', 'coverage', '.gradle', '.next', '.nuxt', '.turbo', '.vs', '.idea'
}

class RepositoryIndexer:
    async def index_repository(self, repository_id: UUID, repo_url: str, branch: str = "main", force_reindex: bool = False):
        job_id = str(repository_id)
        await self._update_status(job_id, repository_id, RepositoryStatus.INDEXING, 5, "Cloning repository...")

        try:
            # 1. Clone repository
            repo_dir, commit_sha = git_service.clone_or_fetch(repository_id, repo_url, branch)
            await self._update_status(job_id, repository_id, RepositoryStatus.INDEXING, 20, "Detecting technologies...")

            # 2. Technology & App Type Detection
            tech_stack = technology_detector.detect(repo_dir)
            app_type = app_type_detector.detect(repo_dir, tech_stack)

            # 3. Database: Check version idempotency
            conn = await db.get_connection()
            try:
                import json
                await conn.execute(
                    """
                    UPDATE repositories 
                    SET technology_stack = $1::jsonb, application_type = $2, status = 'INDEXING', updated_at = NOW()
                    WHERE id = $3
                    """,
                    json.dumps(tech_stack), app_type, repository_id
                )

                # Check if already indexed for this commit
                existing_ver = await conn.fetchrow(
                    "SELECT id, status FROM repository_versions WHERE repository_id = $1 AND commit_sha = $2",
                    repository_id, commit_sha
                )

                if existing_ver and not force_reindex and existing_ver["status"] == "READY":
                    logger.info(f"Repository {repository_id} commit {commit_sha} already indexed. Skipping.")
                    await self._update_status(job_id, repository_id, RepositoryStatus.READY, 100, "Repository up to date.")
                    return

                # Create or reuse version record
                if existing_ver:
                    version_id = existing_ver["id"]
                    await conn.execute("DELETE FROM repository_files WHERE version_id = $1", version_id)
                else:
                    version_id = uuid4()
                    await conn.execute(
                        """
                        INSERT INTO repository_versions (id, repository_id, commit_sha, status)
                        VALUES ($1, $2, $3, 'INDEXING')
                        """,
                        version_id, repository_id, commit_sha
                    )
            finally:
                await db.release_connection(conn)

            await self._update_status(job_id, repository_id, RepositoryStatus.INDEXING, 35, "Scanning and parsing code files...")

            # 4. Scan and Parse Files
            file_count = 0
            symbol_count = 0
            chunk_count = 0

            file_entries = []
            for root, dirs, files in os.walk(repo_dir):
                # Filter out excluded compiler & build output directories
                dirs[:] = [d for d in dirs if not d.startswith('.') and d.lower() not in EXCLUDED_DIR_NAMES]
                for f in files:
                    f_lower = f.lower()
                    if f_lower in IGNORED_FILENAMES or f_lower.endswith(('.min.js', '.min.css', '.deps.json', '.runtimeconfig.json', '.g.cs', '.generated.cs', '.dll', '.exe', '.pdb')):
                        continue
                    ext = os.path.splitext(f)[1].lower()
                    if ext in SUPPORTED_EXTENSIONS:
                        rel_path = os.path.relpath(os.path.join(root, f), repo_dir).replace('\\', '/')
                        file_entries.append((os.path.join(root, f), rel_path, ext, SUPPORTED_EXTENSIONS[ext]))

            total_files = len(file_entries)
            conn = await db.get_connection()
            try:
                for idx, (abs_path, rel_path, ext, lang) in enumerate(file_entries):
                    try:
                        with open(abs_path, 'r', encoding='utf-8', errors='ignore') as src_file:
                            content = src_file.read()
                    except Exception:
                        continue

                    lines = content.splitlines()
                    file_id = uuid4()

                    # Save file record
                    await conn.execute(
                        """
                        INSERT INTO repository_files (id, version_id, path, filename, extension, language, size_bytes, line_count, content)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                        """,
                        file_id, version_id, rel_path, os.path.basename(rel_path), ext, lang, len(content.encode('utf-8')), len(lines), content
                    )
                    file_count += 1

                    # Extract AST Symbols
                    symbols = ast_parser.parse_file(content, lang)
                    for sym in symbols:
                        sym_id = uuid4()
                        await conn.execute(
                            """
                            INSERT INTO code_symbols (id, version_id, file_id, name, symbol_type, container_name, start_line, end_line, signature, docstring)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                            """,
                            sym_id, version_id, file_id, sym.name, sym.symbol_type.value, sym.container_name, sym.start_line, sym.end_line, sym.signature, sym.docstring
                        )
                        symbol_count += 1

                    # Semantic Chunks & Embeddings
                    chunks = code_chunker.chunk_file(content, rel_path, lang, symbols)
                    for chk in chunks:
                        chunk_id = uuid4()
                        embedding = await embedding_service.generate_embedding(chk.content)
                        await conn.execute(
                            """
                            INSERT INTO code_chunks (id, version_id, file_id, chunk_type, start_line, end_line, content, summary, embedding)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                            """,
                            chunk_id, version_id, file_id, chk.chunk_type.value, chk.start_line, chk.end_line, chk.content, chk.summary, embedding
                        )
                        chunk_count += 1

                    if idx % 10 == 0:
                        progress = 35 + int((idx / max(1, total_files)) * 60)
                        await self._update_status(job_id, repository_id, RepositoryStatus.INDEXING, progress, f"Indexed {idx}/{total_files} files...")

                # Update Version & Repo Status to READY
                await conn.execute(
                    """
                    UPDATE repository_versions 
                    SET file_count = $1, symbol_count = $2, chunk_count = $3, status = 'READY', indexed_at = NOW()
                    WHERE id = $4
                    """,
                    file_count, symbol_count, chunk_count, version_id
                )

                await conn.execute(
                    "UPDATE repositories SET status = 'READY', updated_at = NOW() WHERE id = $1",
                    repository_id
                )

            finally:
                await db.release_connection(conn)

            await self._update_status(job_id, repository_id, RepositoryStatus.READY, 100, "Indexing completed successfully.", file_count, symbol_count, chunk_count)
            logger.info(f"Indexing completed for repository {repository_id}: {file_count} files, {symbol_count} symbols, {chunk_count} chunks.")

        except Exception as e:
            logger.error(f"Repository indexing failed for {repository_id}: {e}")
            conn = await db.get_connection()
            try:
                await conn.execute("UPDATE repositories SET status = 'FAILED' WHERE id = $1", repository_id)
            finally:
                await db.release_connection(conn)
            await self._update_status(job_id, repository_id, RepositoryStatus.FAILED, 0, f"Indexing failed: {str(e)}", error_message=str(e))

    async def _update_status(self, job_id: str, repo_id: UUID, status: RepositoryStatus, progress: int, step: str, files: int = 0, symbols: int = 0, chunks: int = 0, error_message: str = None):
        data = {
            "repository_id": str(repo_id),
            "status": status.value,
            "progress_percentage": progress,
            "current_step": step,
            "error_message": error_message,
            "file_count": files,
            "symbol_count": symbols,
            "chunk_count": chunks
        }
        await redis_manager.set_job_status(job_id, data)

repository_indexer = RepositoryIndexer()
