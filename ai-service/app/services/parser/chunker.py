import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from app.models.schemas import ChunkType
from app.services.parser.ast_parser import ExtractedSymbol

logger = logging.getLogger(__name__)

@dataclass
class ExtractedChunk:
    chunk_type: ChunkType
    start_line: int
    end_line: int
    content: str
    summary: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class CodeChunker:
    def chunk_file(self, content: str, path: str, language: str, symbols: List[ExtractedSymbol]) -> List[ExtractedChunk]:
        chunks: List[ExtractedChunk] = []
        lines = content.splitlines()

        if not lines:
            return chunks

        # If it's a documentation file (Markdown, text, README)
        if language in ('markdown', 'text', 'asciidoc') or path.lower().endswith(('.md', '.txt', '.rst')):
            return self._chunk_markdown(lines, path)

        # If we have extracted symbols from AST, chunk along method/class boundaries
        if symbols:
            # Sort symbols by start_line
            sorted_symbols = sorted(symbols, key=lambda s: s.start_line)
            
            # File header / imports chunk (from line 1 to first symbol)
            first_sym_start = sorted_symbols[0].start_line
            if first_sym_start > 1:
                header_lines = lines[:first_sym_start - 1]
                header_content = "\n".join(header_lines).strip()
                if header_content:
                    chunks.append(ExtractedChunk(
                        chunk_type=ChunkType.CONFIG if language in ('yaml', 'properties', 'json') else ChunkType.CODE_BLOCK,
                        start_line=1,
                        end_line=first_sym_start - 1,
                        content=header_content,
                        summary=f"File header & imports for {path}",
                        metadata={"file_path": path, "type": "header"}
                    ))

            for sym in sorted_symbols:
                s_idx = max(0, sym.start_line - 1)
                e_idx = min(len(lines), sym.end_line)
                sym_lines = lines[s_idx:e_idx]
                chunk_content = "\n".join(sym_lines).strip()

                if chunk_content:
                    c_type = ChunkType.METHOD if sym.symbol_type.value in ('METHOD', 'FUNCTION') else ChunkType.CLASS
                    summary = f"{sym.symbol_type.value} `{sym.name}`"
                    if sym.container_name:
                        summary += f" in `{sym.container_name}`"

                    chunks.append(ExtractedChunk(
                        chunk_type=c_type,
                        start_line=sym.start_line,
                        end_line=sym.end_line,
                        content=chunk_content,
                        summary=summary,
                        metadata={
                            "file_path": path,
                            "symbol_name": sym.name,
                            "symbol_type": sym.symbol_type.value,
                            "container": sym.container_name
                        }
                    ))
            return chunks

        # Fallback: Sliding window semantic chunking (50 lines with 10 line overlap)
        return self._chunk_lines_fallback(lines, path, language)

    def _chunk_markdown(self, lines: List[str], path: str) -> List[ExtractedChunk]:
        chunks = []
        current_section = []
        section_start = 1
        current_header = "Introduction"

        for idx, line in enumerate(lines, start=1):
            if line.startswith("#"):
                if current_section:
                    content = "\n".join(current_section).strip()
                    if content:
                        chunks.append(ExtractedChunk(
                            chunk_type=ChunkType.DOC_SECTION,
                            start_line=section_start,
                            end_line=idx - 1,
                            content=content,
                            summary=f"Section '{current_header}' in {path}",
                            metadata={"file_path": path, "section": current_header}
                        ))
                    current_section = []
                current_header = line.lstrip("#").strip()
                section_start = idx

            current_section.append(line)

        if current_section:
            content = "\n".join(current_section).strip()
            if content:
                chunks.append(ExtractedChunk(
                    chunk_type=ChunkType.DOC_SECTION,
                    start_line=section_start,
                    end_line=len(lines),
                    content=content,
                    summary=f"Section '{current_header}' in {path}",
                    metadata={"file_path": path, "section": current_header}
                ))

        return chunks

    def _chunk_lines_fallback(self, lines: List[str], path: str, language: str, window_size: int = 50, overlap: int = 10) -> List[ExtractedChunk]:
        chunks = []
        total_lines = len(lines)
        start = 0

        while start < total_lines:
            end = min(start + window_size, total_lines)
            chunk_content = "\n".join(lines[start:end]).strip()
            if chunk_content:
                chunks.append(ExtractedChunk(
                    chunk_type=ChunkType.CODE_BLOCK,
                    start_line=start + 1,
                    end_line=end,
                    content=chunk_content,
                    summary=f"Lines {start + 1}-{end} of {path}",
                    metadata={"file_path": path, "language": language}
                ))
            if end >= total_lines:
                break
            start += (window_size - overlap)

        return chunks

code_chunker = CodeChunker()
