import logging
from uuid import UUID
from typing import List, Dict, Any, Optional
from app.core.database import db
from app.services.embedding.embedding_service import embedding_service

logger = logging.getLogger(__name__)

class RepositoryTools:
    @staticmethod
    async def read_file(repository_id: UUID, file_path: str, start_line: Optional[int] = None, end_line: Optional[int] = None) -> Dict[str, Any]:
        """
        Reads a file's content from the indexed repository, optionally slicing a line range.
        """
        conn = await db.get_connection()
        try:
            row = await conn.fetchrow(
                """
                SELECT rf.path, rf.language, rf.content, rf.line_count
                FROM repository_files rf
                JOIN repository_versions rv ON rf.version_id = rv.id
                WHERE rv.repository_id = $1 AND rf.path = $2
                ORDER BY rv.indexed_at DESC LIMIT 1
                """,
                repository_id, file_path
            )
            if not row:
                return {"error": f"File '{file_path}' not found in repository {repository_id}"}

            content = row["content"] or ""
            lines = content.splitlines()
            total_lines = len(lines)

            if start_line is not None and end_line is not None:
                s_idx = max(0, start_line - 1)
                e_idx = min(total_lines, end_line)
                sliced_lines = lines[s_idx:e_idx]
                content = "\n".join(sliced_lines)

            return {
                "file_path": row["path"],
                "language": row["language"],
                "line_count": total_lines,
                "start_line": start_line or 1,
                "end_line": end_line or total_lines,
                "content": content
            }
        finally:
            await db.release_connection(conn)

    @staticmethod
    async def list_files(repository_id: UUID, directory_prefix: str = "") -> List[Dict[str, Any]]:
        """
        Lists files in the repository matching an optional directory prefix.
        """
        conn = await db.get_connection()
        try:
            pattern = f"{directory_prefix}%" if directory_prefix else "%"
            rows = await conn.fetch(
                """
                SELECT rf.path, rf.filename, rf.extension, rf.language, rf.size_bytes, rf.line_count
                FROM repository_files rf
                JOIN repository_versions rv ON rf.version_id = rv.id
                WHERE rv.repository_id = $1 AND rf.path LIKE $2
                ORDER BY rf.path ASC LIMIT 200
                """,
                repository_id, pattern
            )
            return [dict(r) for r in rows]
        finally:
            await db.release_connection(conn)

    @staticmethod
    async def code_search(repository_id: UUID, search_term: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Direct keyword search with file diversity (max 1 match per unique file).
        """
        conn = await db.get_connection()
        try:
            rows = await conn.fetch(
                """
                SELECT rf.path as file_path, rf.language, rf.content, rf.line_count
                FROM repository_files rf
                JOIN repository_versions rv ON rf.version_id = rv.id
                WHERE rv.repository_id = $1 AND rf.content ILIKE $2
                ORDER BY length(rf.content) ASC
                LIMIT 20
                """,
                repository_id, f"%{search_term}%"
            )
            results = []
            seen_files = set()
            for r in rows:
                p = r["file_path"]
                if p in seen_files:
                    continue
                seen_files.add(p)

                content = r["content"] or ""
                lines = content.splitlines()
                matching_indices = [i for i, l in enumerate(lines) if search_term.lower() in l.lower()]
                if matching_indices:
                    first_line = max(1, matching_indices[0] - 2)
                    last_line = min(len(lines), matching_indices[0] + 30)
                    snippet = "\n".join(lines[first_line-1:last_line])
                    results.append({
                        "file_path": p,
                        "start_line": first_line,
                        "end_line": last_line,
                        "content": snippet
                    })
                    if len(results) >= limit:
                        break
            return results
        finally:
            await db.release_connection(conn)

    @staticmethod
    async def search_symbol(repository_id: UUID, symbol_name: str, symbol_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Searches for AST code symbols (classes, interfaces, methods, functions).
        """
        conn = await db.get_connection()
        try:
            query = """
                SELECT cs.name, cs.symbol_type, cs.container_name, cs.start_line, cs.end_line,
                       cs.signature, cs.docstring, rf.path as file_path
                FROM code_symbols cs
                JOIN repository_files rf ON cs.file_id = rf.id
                JOIN repository_versions rv ON cs.version_id = rv.id
                WHERE rv.repository_id = $1 AND cs.name ILIKE $2
            """
            params = [repository_id, f"%{symbol_name}%"]
            if symbol_type:
                query += " AND cs.symbol_type = $3"
                params.append(symbol_type)

            query += " ORDER BY cs.name ASC LIMIT 15"
            rows = await conn.fetch(query, *params)
            return [dict(r) for r in rows]
        finally:
            await db.release_connection(conn)

    @staticmethod
    async def get_architecture_symbol_map(repository_id: UUID, limit: int = 25) -> List[Dict[str, Any]]:
        """
        Fetches a high-density architectural skeleton (classes, endpoints, services) from code_symbols.
        """
        conn = await db.get_connection()
        try:
            rows = await conn.fetch(
                """
                SELECT cs.name, cs.symbol_type, cs.container_name, cs.signature, cs.start_line,
                       rf.path as file_path
                FROM code_symbols cs
                JOIN repository_files rf ON cs.file_id = rf.id
                JOIN repository_versions rv ON cs.version_id = rv.id
                WHERE rv.repository_id = $1
                  AND (cs.symbol_type IN ('class', 'interface', 'controller', 'function', 'endpoint', 'method')
                       OR rf.path ILIKE '%/api/%' OR rf.path ILIKE '%/endpoints/%' OR rf.path ILIKE '%/services/%' OR rf.path ILIKE '%/models/%')
                ORDER BY
                    CASE
                        WHEN rf.path ILIKE '%main%' OR rf.path ILIKE '%app%' THEN 1
                        WHEN rf.path ILIKE '%/api/%' OR rf.path ILIKE '%/endpoints/%' THEN 2
                        WHEN rf.path ILIKE '%/services/%' THEN 3
                        ELSE 4
                    END, cs.name ASC
                LIMIT $2
                """,
                repository_id, limit
            )
            return [dict(r) for r in rows]
        finally:
            await db.release_connection(conn)

    @staticmethod
    async def semantic_search(repository_id: UUID, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Searches code chunks using pgvector with MMR file diversity (max 1 best chunk per unique file).
        """
        query_vector = await embedding_service.generate_query_embedding(query)
        conn = await db.get_connection()
        try:
            rows = await conn.fetch(
                """
                SELECT cc.id, cc.chunk_type, cc.start_line, cc.end_line, cc.content, cc.summary,
                       rf.path as file_path,
                       1 - (cc.embedding <=> $1::vector) as similarity
                FROM code_chunks cc
                JOIN repository_files rf ON cc.file_id = rf.id
                JOIN repository_versions rv ON cc.version_id = rv.id
                WHERE rv.repository_id = $2
                  AND (1 - (cc.embedding <=> $1::vector)) >= 0.55
                ORDER BY cc.embedding <=> $1::vector ASC
                LIMIT 25
                """,
                query_vector, repository_id
            )
            # Enforce strict file diversity: 1 chunk per unique file
            results = []
            seen_files = set()
            for r in rows:
                p = r["file_path"]
                if p in seen_files:
                    continue
                seen_files.add(p)
                results.append(dict(r))
                if len(results) >= limit:
                    break
            return results
        finally:
            await db.release_connection(conn)

    @staticmethod
    async def get_dependencies(repository_id: UUID, entity_name: str) -> List[Dict[str, Any]]:
        """
        Finds dependency relationships (calls, imports, extends, implements) for a given class or method.
        """
        conn = await db.get_connection()
        try:
            rows = await conn.fetch(
                """
                SELECT de.edge_type,
                       src_sym.name as source_symbol, src_file.path as source_file,
                       tgt_sym.name as target_symbol, tgt_file.path as target_file
                FROM dependency_edges de
                JOIN repository_versions rv ON de.version_id = rv.id
                LEFT JOIN code_symbols src_sym ON de.source_symbol_id = src_sym.id
                LEFT JOIN repository_files src_file ON de.source_file_id = src_file.id
                LEFT JOIN code_symbols tgt_sym ON de.target_symbol_id = tgt_sym.id
                LEFT JOIN repository_files tgt_file ON de.target_file_id = tgt_file.id
                WHERE rv.repository_id = $1 AND (src_sym.name ILIKE $2 OR tgt_sym.name ILIKE $2)
                LIMIT 20
                """,
                repository_id, f"%{entity_name}%"
            )
            return [dict(r) for r in rows]
        finally:
            await db.release_connection(conn)

repo_tools = RepositoryTools()
