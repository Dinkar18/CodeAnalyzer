import logging
import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from app.models.schemas import SymbolType

logger = logging.getLogger(__name__)

@dataclass
class ExtractedSymbol:
    name: str
    symbol_type: SymbolType
    start_line: int
    end_line: int
    container_name: Optional[str] = None
    signature: Optional[str] = None
    docstring: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ASTParser:
    def __init__(self):
        self._languages = {}
        self._init_tree_sitter()

    def _init_tree_sitter(self):
        try:
            from tree_sitter import Language, Parser
            try:
                import tree_sitter_java as tsjava
                self._languages['java'] = Language(tsjava.language())
            except ImportError:
                pass

            try:
                import tree_sitter_python as tspython
                self._languages['python'] = Language(tspython.language())
            except ImportError:
                pass

            try:
                import tree_sitter_javascript as tsjs
                self._languages['javascript'] = Language(tsjs.language())
            except ImportError:
                pass

            try:
                import tree_sitter_typescript as tsts
                self._languages['typescript'] = Language(tsts.language_typescript())
            except ImportError:
                pass

        except Exception as e:
            logger.warning(f"Tree-sitter initialization note: {e}")

    def parse_file(self, content: str, language: str) -> List[ExtractedSymbol]:
        lang_key = language.lower()
        if lang_key in self._languages:
            try:
                return self._parse_with_tree_sitter(content, lang_key)
            except Exception as e:
                logger.warning(f"Tree-sitter parse failed for {language}: {e}. Using regex fallback.")
                return self._parse_with_fallback(content, lang_key)
        else:
            return self._parse_with_fallback(content, lang_key)

    def _parse_with_tree_sitter(self, content: str, lang_key: str) -> List[ExtractedSymbol]:
        from tree_sitter import Parser
        parser = Parser()
        parser.set_language(self._languages[lang_key])
        tree = parser.parse(bytes(content, "utf8"))
        symbols: List[ExtractedSymbol] = []
        lines = content.splitlines()

        def traverse(node, current_container=None):
            if lang_key == 'java':
                if node.type == 'class_declaration':
                    name_node = node.child_by_field_name('name')
                    if name_node:
                        name = content[name_node.start_byte:name_node.end_byte]
                        start_line = node.start_point[0] + 1
                        end_line = node.end_point[0] + 1
                        sig = lines[start_line - 1].strip() if start_line - 1 < len(lines) else ""
                        symbols.append(ExtractedSymbol(
                            name=name,
                            symbol_type=SymbolType.CLASS,
                            start_line=start_line,
                            end_line=end_line,
                            container_name=current_container,
                            signature=sig
                        ))
                        for child in node.children:
                            traverse(child, name)
                        return

                elif node.type == 'interface_declaration':
                    name_node = node.child_by_field_name('name')
                    if name_node:
                        name = content[name_node.start_byte:name_node.end_byte]
                        start_line = node.start_point[0] + 1
                        end_line = node.end_point[0] + 1
                        symbols.append(ExtractedSymbol(
                            name=name,
                            symbol_type=SymbolType.INTERFACE,
                            start_line=start_line,
                            end_line=end_line,
                            container_name=current_container
                        ))
                        for child in node.children:
                            traverse(child, name)
                        return

                elif node.type in ('method_declaration', 'constructor_declaration'):
                    name_node = node.child_by_field_name('name')
                    if name_node:
                        name = content[name_node.start_byte:name_node.end_byte]
                        start_line = node.start_point[0] + 1
                        end_line = node.end_point[0] + 1
                        sig = lines[start_line - 1].strip() if start_line - 1 < len(lines) else ""
                        symbols.append(ExtractedSymbol(
                            name=name,
                            symbol_type=SymbolType.METHOD,
                            start_line=start_line,
                            end_line=end_line,
                            container_name=current_container,
                            signature=sig
                        ))

            elif lang_key == 'python':
                if node.type == 'class_definition':
                    name_node = node.child_by_field_name('name')
                    if name_node:
                        name = content[name_node.start_byte:name_node.end_byte]
                        start_line = node.start_point[0] + 1
                        end_line = node.end_point[0] + 1
                        symbols.append(ExtractedSymbol(
                            name=name,
                            symbol_type=SymbolType.CLASS,
                            start_line=start_line,
                            end_line=end_line,
                            container_name=current_container
                        ))
                        for child in node.children:
                            traverse(child, name)
                        return

                elif node.type == 'function_definition':
                    name_node = node.child_by_field_name('name')
                    if name_node:
                        name = content[name_node.start_byte:name_node.end_byte]
                        start_line = node.start_point[0] + 1
                        end_line = node.end_point[0] + 1
                        stype = SymbolType.METHOD if current_container else SymbolType.FUNCTION
                        sig = lines[start_line - 1].strip() if start_line - 1 < len(lines) else ""
                        symbols.append(ExtractedSymbol(
                            name=name,
                            symbol_type=stype,
                            start_line=start_line,
                            end_line=end_line,
                            container_name=current_container,
                            signature=sig
                        ))

            for child in node.children:
                traverse(child, current_container)

        traverse(tree.root_node)
        return symbols

    def _parse_with_fallback(self, content: str, lang_key: str) -> List[ExtractedSymbol]:
        symbols = []
        lines = content.splitlines()
        current_class = None

        if lang_key in ('java', 'typescript', 'javascript', 'csharp', 'c#'):
            class_pattern = re.compile(r'^\s*(?:public|private|protected|internal)?\s*(?:abstract|sealed|static|partial|final)?\s*(class|interface|enum|record|struct)\s+([A-Za-z0-9_]+)')
            method_pattern = re.compile(r'^\s*(?:public|private|protected|internal)?\s*(?:static|async|virtual|override)?\s*(?:[\w<>\[\],?]+)\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*[{;=]')

            for idx, line in enumerate(lines, start=1):
                c_match = class_pattern.search(line)
                if c_match:
                    kind, name = c_match.group(1), c_match.group(2)
                    stype = SymbolType.CLASS if kind in ('class', 'record', 'struct') else (SymbolType.INTERFACE if kind == 'interface' else SymbolType.ENUM)
                    current_class = name
                    symbols.append(ExtractedSymbol(
                        name=name,
                        symbol_type=stype,
                        start_line=idx,
                        end_line=min(idx + 60, len(lines)),
                        signature=line.strip()
                    ))
                    continue

                m_match = method_pattern.search(line)
                if m_match and not line.strip().startswith("//") and not line.strip().startswith("/*"):
                    m_name = m_match.group(1)
                    if m_name not in ('if', 'for', 'foreach', 'while', 'switch', 'catch', 'lock', 'using', 'return', 'throw'):
                        symbols.append(ExtractedSymbol(
                            name=m_name,
                            symbol_type=SymbolType.METHOD,
                            start_line=idx,
                            end_line=min(idx + 30, len(lines)),
                            container_name=current_class,
                            signature=line.strip()
                        ))

        elif lang_key == 'python':
            class_pattern = re.compile(r'^\s*class\s+([A-Za-z0-9_]+)')
            def_pattern = re.compile(r'^\s*def\s+([A-Za-z0-9_]+)\s*\(')

            for idx, line in enumerate(lines, start=1):
                c_match = class_pattern.search(line)
                if c_match:
                    name = c_match.group(1)
                    current_class = name
                    symbols.append(ExtractedSymbol(
                        name=name,
                        symbol_type=SymbolType.CLASS,
                        start_line=idx,
                        end_line=min(idx + 50, len(lines)),
                        signature=line.strip()
                    ))
                    continue

                d_match = def_pattern.search(line)
                if d_match:
                    name = d_match.group(1)
                    stype = SymbolType.METHOD if (current_class and line.startswith('    ')) else SymbolType.FUNCTION
                    symbols.append(ExtractedSymbol(
                        name=name,
                        symbol_type=stype,
                        start_line=idx,
                        end_line=min(idx + 30, len(lines)),
                        container_name=current_class if stype == SymbolType.METHOD else None,
                        signature=line.strip()
                    ))

        elif lang_key in ('go', 'golang'):
            func_pattern = re.compile(r'^\s*func\s+(?:\((?:[^)]+)\)\s+)?([A-Za-z0-9_]+)\s*\(')
            type_pattern = re.compile(r'^\s*type\s+([A-Za-z0-9_]+)\s+(struct|interface)')
            for idx, line in enumerate(lines, start=1):
                t_match = type_pattern.search(line)
                if t_match:
                    name, kind = t_match.group(1), t_match.group(2)
                    stype = SymbolType.INTERFACE if kind == 'interface' else SymbolType.CLASS
                    symbols.append(ExtractedSymbol(name=name, symbol_type=stype, start_line=idx, end_line=min(idx+40, len(lines)), signature=line.strip()))
                f_match = func_pattern.search(line)
                if f_match:
                    symbols.append(ExtractedSymbol(name=f_match.group(1), symbol_type=SymbolType.FUNCTION, start_line=idx, end_line=min(idx+30, len(lines)), signature=line.strip()))

        return symbols

ast_parser = ASTParser()
