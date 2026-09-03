import React, { useState, useEffect, useRef } from 'react';
import { Network, ZoomIn, ZoomOut, RotateCcw, Filter, FileCode, Layers, ArrowUpRight, Loader2, Code, Box, ChevronRight, X, Sparkles, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { FileAPI } from '../services/api';

export default function GraphViewer({ repository, onOpenFileWithLines, onStartContextChat }) {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'CLASS' | 'INTERFACE' | 'FILE' | 'MODULE'
  const [zoom, setZoom] = useState(1);
  const [search, setSearch] = useState('');
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStartCanvas, setDragStartCanvas] = useState({ x: 0, y: 0 });

  const fetchGraph = async () => {
    if (!repository) return;
    setLoading(true);
    try {
      const res = await FileAPI.getGraph(repository.id);
      setGraphData(res.data || { nodes: [], edges: [] });
    } catch (err) {
      console.error("Failed to load graph:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [repository]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    setIsInspectorOpen(true);
  };

  const handleNodeDoubleClick = (node) => {
    if (node.full_path) {
      onOpenFileWithLines(node.full_path, node.start_line || 1, node.end_line || 35);
    }
  };

  // Find neighbor node IDs for the selected node
  const neighborIds = React.useMemo(() => {
    if (!selectedNode) return new Set();
    const set = new Set([selectedNode.id]);
    graphData.edges.forEach(e => {
      if (e.source === selectedNode.id) set.add(e.target);
      if (e.target === selectedNode.id) set.add(e.source);
    });
    return set;
  }, [selectedNode, graphData.edges]);

  // Filter nodes based on user search, type, and focus mode
  const filteredNodes = graphData.nodes.filter(n => {
    if (focusMode && selectedNode && !neighborIds.has(n.id)) return false;
    const matchesType = filterType === 'ALL' || n.type === filterType;
    const matchesSearch = !search || n.label.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const nodeMap = new Map(graphData.nodes.map(n => [n.id, n]));

  // Calculate non-overlapping clustered layout
  const positionedNodes = React.useMemo(() => {
    // Group nodes by type
    const byType = { MODULE: [], FILE: [], CLASS: [], INTERFACE: [] };
    filteredNodes.forEach(n => {
      if (byType[n.type]) byType[n.type].push(n);
      else byType.FILE.push(n);
    });

    const positioned = [];

    // Modules in center ring (Radius 120)
    byType.MODULE.forEach((node, i) => {
      const total = byType.MODULE.length || 1;
      const angle = (i / total) * 2 * Math.PI;
      positioned.push({ ...node, x: 500 + 120 * Math.cos(angle), y: 400 + 120 * Math.sin(angle) });
    });

    // Files in middle ring (Radius 280)
    byType.FILE.forEach((node, i) => {
      const total = byType.FILE.length || 1;
      const angle = (i / total) * 2 * Math.PI + 0.1;
      positioned.push({ ...node, x: 500 + 280 * Math.cos(angle), y: 400 + 280 * Math.sin(angle) });
    });

    // Classes in outer ring (Radius 440)
    byType.CLASS.forEach((node, i) => {
      const total = byType.CLASS.length || 1;
      const angle = (i / total) * 2 * Math.PI + 0.2;
      positioned.push({ ...node, x: 500 + 440 * Math.cos(angle), y: 400 + 440 * Math.sin(angle) });
    });

    // Interfaces in far outer ring (Radius 560)
    byType.INTERFACE.forEach((node, i) => {
      const total = byType.INTERFACE.length || 1;
      const angle = (i / total) * 2 * Math.PI + 0.3;
      positioned.push({ ...node, x: 500 + 560 * Math.cos(angle), y: 400 + 560 * Math.sin(angle) });
    });

    return positioned;
  }, [filteredNodes]);

  const posMap = new Map(positionedNodes.map(n => [n.id, n]));
  const visibleEdges = graphData.edges.filter(e => posMap.has(e.source) && posMap.has(e.target));

  // Relationships for selected node
  const outgoingRelations = selectedNode ? graphData.edges.filter(e => e.source === selectedNode.id).map(e => ({ edge: e, node: nodeMap.get(e.target) })) : [];
  const incomingRelations = selectedNode ? graphData.edges.filter(e => e.target === selectedNode.id).map(e => ({ edge: e, node: nodeMap.get(e.source) })) : [];

  const handleCanvasMouseDown = (e) => {
    if (e.target.closest('.node-element') || e.target.closest('.drawer-element')) return;
    setIsDraggingCanvas(true);
    setDragStartCanvas({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDraggingCanvas) return;
    setPan({ x: e.clientX - dragStartCanvas.x, y: e.clientY - dragStartCanvas.y });
  };

  const handleCanvasMouseUp = () => setIsDraggingCanvas(false);

  return (
    <div className="flex-1 bg-[#050812] flex flex-col h-full min-h-0 overflow-hidden border-r border-surfaceBorder relative select-none">
      {/* Top Toolbar */}
      <div className="h-12 bg-surface/90 backdrop-blur-md border-b border-surfaceBorder flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center space-x-2.5 text-xs">
          <div className="p-1.5 rounded-lg bg-primary-600/20 border border-primary-500/30 text-primary-400">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center space-x-2">
              <span>Codebase Dependency & Call Hierarchy</span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-surfaceLight border border-surfaceBorder text-primary-400 font-semibold">
                {positionedNodes.length} Visible
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Double-click a node to view code • Click for method call hierarchy
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-2 text-xs">
          <input
            type="text"
            placeholder="Filter classes, files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-surfaceLight border border-surfaceBorder rounded-lg px-3 py-1 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 w-44"
          />
          {['ALL', 'CLASS', 'INTERFACE', 'FILE', 'MODULE'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition font-medium ${
                filterType === type
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-surfaceLight'
              }`}
            >
              {type}
            </button>
          ))}

          {selectedNode && (
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium transition ${
                focusMode
                  ? 'bg-accent/20 text-accent border border-accent/40'
                  : 'text-slate-400 hover:text-white hover:bg-surfaceLight'
              }`}
              title="Isolate selected node and its direct relations"
            >
              {focusMode ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>{focusMode ? 'Focused' : 'Isolate'}</span>
            </button>
          )}

          <div className="flex items-center space-x-1 border-l border-surfaceBorder pl-2">
            <button
              onClick={() => setZoom(z => Math.min(z + 0.15, 2.2))}
              className="p-1.5 hover:bg-surfaceLight rounded-lg text-slate-400 hover:text-white transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(z - 0.15, 0.35))}
              className="p-1.5 hover:bg-surfaceLight rounded-lg text-slate-400 hover:text-white transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); setSearch(''); setFilterType('ALL'); setFocusMode(false); }}
              className="p-1.5 hover:bg-surfaceLight rounded-lg text-slate-400 hover:text-white transition"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Infinite Canvas */}
      <div
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        className={`flex-1 min-h-0 overflow-hidden relative flex items-center justify-center ${isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center text-slate-400 text-xs">
            <Loader2 className="w-8 h-8 animate-spin text-primary-400 mb-2" />
            <span>Analyzing AST symbols and constructing call graph...</span>
          </div>
        ) : positionedNodes.length === 0 ? (
          <div className="text-slate-500 text-xs text-center">
            No graph relationships found. Connect and index a repository to explore codebase topology.
          </div>
        ) : (
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDraggingCanvas ? 'none' : 'transform 0.1s ease-out'
            }}
            className="w-[1000px] h-[800px] relative shrink-0"
          >
            {/* SVG Connecting Edges */}
            <svg className="w-full h-full absolute inset-0 pointer-events-none">
              <defs>
                <marker id="arrow-active" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#818CF8" />
                </marker>
              </defs>
              {visibleEdges.map((edge, idx) => {
                const s = posMap.get(edge.source);
                const t = posMap.get(edge.target);
                if (!s || !t) return null;
                const isHighlighted = selectedNode && (selectedNode.id === edge.source || selectedNode.id === edge.target);

                return (
                  <line
                    key={idx}
                    x1={s.x}
                    y1={s.y}
                    x2={t.x}
                    y2={t.y}
                    stroke={isHighlighted ? '#818CF8' : (edge.type === 'CALLS_METHOD' ? '#F59E0B' : '#1E293B')}
                    strokeWidth={isHighlighted ? '2.5' : (edge.type === 'CALLS_METHOD' ? '1.5' : '1')}
                    strokeDasharray={edge.type === 'CALLS_METHOD' ? '4 2' : 'none'}
                    opacity={isHighlighted ? 1 : (selectedNode ? 0.2 : 0.6)}
                  />
                );
              })}
            </svg>

            {/* Interactive Nodes */}
            {positionedNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isNeighbor = neighborIds.has(node.id);
              const isDimmed = selectedNode && !isSelected && !isNeighbor;

              return (
                <div
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  onDoubleClick={() => handleNodeDoubleClick(node)}
                  style={{ left: `${node.x}px`, top: `${node.y}px` }}
                  className={`node-element absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl text-[11px] font-mono cursor-pointer transition-all duration-150 flex items-center space-x-2 shadow-lg backdrop-blur-sm ${
                    isSelected
                      ? 'ring-2 ring-primary-400 scale-115 z-30 bg-[#141C33] border border-primary-400 shadow-primary-500/30'
                      : isDimmed
                      ? 'opacity-20 scale-95 bg-[#0A0E1A] border border-surfaceBorder/40 text-slate-500'
                      : 'hover:scale-105 hover:z-20 bg-[#0E1526]/90 border border-surfaceBorder text-slate-200 hover:border-primary-500/60'
                  }`}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: node.color || '#6366F1' }}
                  />
                  <span className="truncate max-w-[140px] font-medium">{node.label}</span>
                  {node.method_count > 0 && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-surfaceBorder text-slate-400">
                      {node.method_count}m
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deep Class & Method Inspector Drawer */}
      {isInspectorOpen && selectedNode && (
        <div className="drawer-element absolute top-12 right-0 bottom-0 w-96 bg-[#090D1A]/95 backdrop-blur-2xl border-l border-surfaceBorder z-30 flex flex-col shadow-2xl animate-in slide-in-from-right duration-150">
          {/* Header */}
          <div className="p-4 border-b border-surfaceBorder flex items-center justify-between shrink-0 bg-surfaceLight/30">
            <div className="flex items-center space-x-2.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode.color }} />
              <div>
                <h3 className="font-bold text-white text-sm truncate max-w-[220px]">{selectedNode.label}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surfaceLight text-primary-300 border border-surfaceBorder">
                  {selectedNode.type}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsInspectorOpen(false)}
              className="p-1 hover:bg-surfaceLight rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Details Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 text-xs custom-scrollbar">
            {/* File Path & Jump Action */}
            {selectedNode.full_path && (
              <div className="p-3.5 bg-surfaceLight/40 rounded-xl border border-surfaceBorder space-y-2.5">
                <div className="text-[11px] font-mono text-slate-300 truncate">
                  📍 {selectedNode.full_path}
                </div>
                {selectedNode.start_line && (
                  <div className="text-[11px] text-slate-400 font-mono">
                    Lines {selectedNode.start_line} - {selectedNode.end_line}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onOpenFileWithLines(selectedNode.full_path, selectedNode.start_line || 1, selectedNode.end_line || 35)}
                    className="bg-primary-600 hover:bg-primary-500 text-white py-1.5 px-2.5 rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1.5 transition shadow-md shadow-primary-600/20"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>View Code</span>
                  </button>
                  {onStartContextChat && (
                    <button
                      onClick={() => onStartContextChat(`Explain the role, methods, and dependencies of '${selectedNode.label}' in detail with a visual diagram.`)}
                      className="bg-surfaceLight hover:bg-surfaceBorder border border-surfaceBorder text-slate-200 hover:text-white py-1.5 px-2.5 rounded-lg text-[11px] font-medium flex items-center justify-center space-x-1.5 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-primary-400" />
                      <span>Ask AI</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Methods Defined */}
            {selectedNode.methods && selectedNode.methods.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  <Code className="w-3.5 h-3.5 text-primary-400" />
                  <span>Methods Defined ({selectedNode.methods.length})</span>
                </div>

                <div className="space-y-1.5">
                  {selectedNode.methods.map((method, mIdx) => (
                    <div
                      key={mIdx}
                      onClick={() => onOpenFileWithLines(selectedNode.full_path, method.start_line, method.end_line)}
                      className="p-2.5 bg-surfaceLight/30 hover:bg-surfaceLight border border-surfaceBorder hover:border-primary-500/40 rounded-xl cursor-pointer transition group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-white group-hover:text-primary-300 truncate">
                          {method.name}()
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          L{method.start_line}-{method.end_line}
                        </span>
                      </div>
                      {method.signature && (
                        <div className="text-[10.5px] font-mono text-slate-400 mt-1 truncate">
                          {method.signature}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outgoing Dependencies */}
            {outgoingRelations.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Calls / Uses ({outgoingRelations.length})
                </div>
                <div className="space-y-1.5">
                  {outgoingRelations.map((rel, rIdx) => rel.node ? (
                    <div
                      key={rIdx}
                      onClick={() => handleNodeClick(rel.node)}
                      className="p-2 bg-surfaceLight/30 hover:bg-surfaceLight border border-surfaceBorder rounded-lg flex items-center justify-between cursor-pointer group"
                    >
                      <span className="font-mono text-[11px] text-slate-300 group-hover:text-white truncate">
                        {rel.edge.type === 'CALLS_METHOD' ? `➡️ Calls ${rel.node.label}` : `📦 ${rel.node.label}`}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-primary-400" />
                    </div>
                  ) : null)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
