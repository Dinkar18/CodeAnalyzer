from fastapi import APIRouter
from uuid import UUID
from typing import Dict, Any, List
from app.core.database import db

router = APIRouter(prefix="/graph", tags=["Codebase Graph"])

@router.get("/{repository_id}")
async def get_repository_graph(repository_id: UUID) -> Dict[str, Any]:
    """
    Constructs an interactive AST-based dependency graph and call hierarchy for the repository.
    Includes modules, classes, interfaces, method lists, and inter-class dependencies.
    """
    conn = await db.get_connection()
    try:
        # 1. Fetch latest version
        ver = await conn.fetchrow(
            "SELECT id FROM repository_versions WHERE repository_id = $1 ORDER BY indexed_at DESC LIMIT 1",
            repository_id
        )
        if not ver:
            return {"nodes": [], "edges": []}

        version_id = ver["id"]

        # 2. Fetch all repository files
        file_rows = await conn.fetch(
            "SELECT id, path, filename, language, line_count FROM repository_files WHERE version_id = $1 ORDER BY path ASC LIMIT 120",
            version_id
        )

        # 3. Fetch all code symbols (Classes, Interfaces, Functions, Methods)
        symbol_rows = await conn.fetch(
            """
            SELECT cs.id, cs.file_id, cs.name, cs.symbol_type, cs.container_name, cs.start_line, cs.end_line, cs.signature, cs.docstring, rf.path as file_path
            FROM code_symbols cs
            JOIN repository_files rf ON cs.file_id = rf.id
            WHERE cs.version_id = $1
            ORDER BY cs.start_line ASC
            LIMIT 300
            """,
            version_id
        )

        nodes: List[Dict[str, Any]] = []
        edges: List[Dict[str, Any]] = []
        node_ids = set()

        # Group symbols by container (Class -> Methods)
        class_methods: Dict[str, List[Dict[str, Any]]] = {}
        for sym in symbol_rows:
            container = sym["container_name"]
            if container:
                if container not in class_methods:
                    class_methods[container] = []
                class_methods[container].append({
                    "name": sym["name"],
                    "symbol_type": sym["symbol_type"],
                    "start_line": sym["start_line"],
                    "end_line": sym["end_line"],
                    "signature": sym["signature"] or f"{sym['name']}()",
                    "docstring": sym["docstring"] or ""
                })

        # Add Module Nodes
        modules = {}
        for f in file_rows:
            parts = f["path"].split('/')
            mod_name = parts[0] if len(parts) > 1 else "root"
            if mod_name not in modules:
                modules[mod_name] = f"mod_{mod_name}"
                nodes.append({
                    "id": f"mod_{mod_name}",
                    "label": mod_name,
                    "type": "MODULE",
                    "color": "#6366F1",
                    "file_count": 1
                })
                node_ids.add(f"mod_{mod_name}")
            else:
                for n in nodes:
                    if n["id"] == f"mod_{mod_name}":
                        n["file_count"] = n.get("file_count", 0) + 1

            # Add File Node
            file_node_id = f"file_{f['id']}"
            nodes.append({
                "id": file_node_id,
                "label": f["filename"],
                "full_path": f["path"],
                "type": "FILE",
                "language": f["language"],
                "line_count": f["line_count"],
                "color": "#10B981"
            })
            node_ids.add(file_node_id)

            edges.append({
                "source": modules[mod_name],
                "target": file_node_id,
                "type": "CONTAINS"
            })

        # Add Class & Interface Nodes with embedded methods
        for sym in symbol_rows:
            if sym["symbol_type"] in ("CLASS", "INTERFACE"):
                sym_node_id = f"sym_{sym['id']}"
                file_node_id = f"file_{sym['file_id']}"
                methods = class_methods.get(sym["name"], [])

                nodes.append({
                    "id": sym_node_id,
                    "label": sym["name"],
                    "symbol_type": sym["symbol_type"],
                    "full_path": sym["file_path"],
                    "start_line": sym["start_line"],
                    "end_line": sym["end_line"],
                    "signature": sym["signature"] or f"class {sym['name']}",
                    "methods": methods,
                    "method_count": len(methods),
                    "type": "CLASS" if sym["symbol_type"] == "CLASS" else "INTERFACE",
                    "color": "#F59E0B" if sym["symbol_type"] == "CLASS" else "#8B5CF6"
                })
                node_ids.add(sym_node_id)

                if file_node_id in node_ids:
                    edges.append({
                        "source": file_node_id,
                        "target": sym_node_id,
                        "type": "DEFINES"
                    })

        # Build Inter-Class Dependencies (Call Hierarchy)
        classes_by_name = {n["label"].lower(): n["id"] for n in nodes if n["type"] in ("CLASS", "INTERFACE")}
        for n in nodes:
            if n["type"] in ("CLASS", "INTERFACE"):
                # Check methods signature & names for references to other classes
                for m in n.get("methods", []):
                    sig = (m.get("signature") or "").lower()
                    for target_name, target_id in classes_by_name.items():
                        if target_id != n["id"] and len(target_name) > 3 and target_name in sig:
                            edges.append({
                                "source": n["id"],
                                "target": target_id,
                                "type": "CALLS_METHOD",
                                "method_caller": m["name"]
                            })

        return {
            "repository_id": repository_id,
            "node_count": len(nodes),
            "edge_count": len(edges),
            "nodes": nodes,
            "edges": edges
        }
    finally:
        await db.release_connection(conn)
