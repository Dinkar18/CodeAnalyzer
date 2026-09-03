import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Copy, Check, ArrowUpRight, BarChart3, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Download, Table, ChevronRight } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  suppressErrorRendering: true,
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    nodeSpacing: 60,
    rankSpacing: 60,
    padding: 24,
    useMaxWidth: false
  },
  sequence: {
    diagramMarginX: 40,
    diagramMarginY: 30,
    actorMargin: 80,
    width: 180,
    height: 54,
    boxMargin: 14,
    boxTextMargin: 8,
    noteMargin: 16,
    messageMargin: 45,
    mirrorActors: true,
    bottomMarginAdj: 15,
    useMaxWidth: false,
    wrap: true
  },
  themeVariables: {
    darkMode: true,
    background: '#070B14',
    primaryColor: '#1E293B',
    primaryTextColor: '#F8FAFC',
    primaryBorderColor: '#6366F1',
    lineColor: '#818CF8',
    secondaryColor: '#0F172A',
    tertiaryColor: '#1E293B',
    edgeLabelBackground: '#0B1020',
    actorBkg: '#111827',
    actorBorder: '#6366F1',
    actorTextColor: '#F8FAFC',
    actorLineColor: '#6366F1',
    signalColor: '#818CF8',
    signalTextColor: '#F8FAFC',
    labelBoxBkgColor: '#1E293B',
    labelBoxBorderColor: '#6366F1',
    labelTextColor: '#F8FAFC',
    loopTextColor: '#F8FAFC',
    noteBorderColor: '#F59E0B',
    noteBkgColor: '#1E1B4B',
    noteTextColor: '#FDE68A',
    activationBorderColor: '#6366F1',
    activationBkgColor: '#312E81',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '13px'
  },
  securityLevel: 'loose'
});

/**
 * Robust Mermaid AST Pre-processor & Sanitizer
 * Strips syntax collision tokens (<=>, unescaped backticks, secondary colons)
 * that cause Mermaid lexer parse crashes on reload.
 */
function sanitizeMermaidCode(rawCode) {
  let code = rawCode.trim();

  // 1. Ensure valid starting diagram directive
  if (!code.startsWith('graph ') && !code.startsWith('flowchart ') && !code.startsWith('sequenceDiagram') && !code.startsWith('classDiagram') && !code.startsWith('erDiagram')) {
    code = `flowchart TD\n${code}`;
  }

  const lines = code.split('\n');
  const sanitizedLines = [];
  const isSequence = code.startsWith('sequenceDiagram');

  for (let line of lines) {
    let l = line.trim();
    if (!l) continue;

    if (isSequence) {
      // Clean participant quotes: participant X as "Name" -> participant X as Name
      l = l.replace(/participant\s+(\w+)\s+as\s+["']([^"']+)["']/g, 'participant $1 as $2');
      l = l.replace(/actor\s+(\w+)\s+as\s+["']([^"']+)["']/g, 'actor $1 as $2');

      // If line is an arrow message (e.g. A->>B: message text)
      const arrowMatch = l.match(/^([\w\s]+(?:->>|-->>|->|-->|--x|-x)[\w\s]+):\s*(.*)$/);
      if (arrowMatch) {
        const callerCallee = arrowMatch[1];
        let msg = arrowMatch[2];

        // Sanitize arrow collision tokens inside message text
        msg = msg.replace(/<=>/g, '(cosine similarity)');
        msg = msg.replace(/<=\s*/g, 'less-or-equal ');
        msg = msg.replace(/>=\s*/g, 'greater-or-equal ');
        msg = msg.replace(/<([^>]+)>/g, '($1)');

        // Sanitize backticks inside message
        msg = msg.replace(/`([^`]+)`/g, '$1');

        // Sanitize colon line numbers (e.g., call_service.py:L20-L24 -> call_service.py [L20-L24])
        msg = msg.replace(/:L?(\d+)(?:-L?(\d+))?/g, ' [L$1-$2]');

        // Strip dangerous quotes/braces that confuse sequence parser
        msg = msg.replace(/[{}"']/g, '');

        l = `${callerCallee}: ${msg.trim()}`;
      } else {
        // General line sanitization for notes / loop blocks
        l = l.replace(/<=>/g, '(cosine distance)');
        l = l.replace(/`([^`]+)`/g, '$1');
        l = l.replace(/:L?(\d+)(?:-L?(\d+))?/g, ' [L$1-$2]');
      }
    } else {
      // Flowchart / Class Diagram sanitization
      l = l.replace(/`([^`]+)`/g, '$1');
      l = l.replace(/<=>/g, '(similarity)');
    }

    sanitizedLines.push(l);
  }

  return sanitizedLines.join('\n');
}

export default function MarkdownRenderer({ content, onOpenFileWithLines }) {
  const renderSections = () => {
    if (!content) return null;

    // Step 1: Split by explicit triple-backtick code blocks
    const initialSections = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        initialSections.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }

      const lang = (match[1] || '').trim().toLowerCase();
      const code = match[2].trim();

      if (lang === 'mermaid' || code.startsWith('graph ') || code.startsWith('flowchart ') || code.startsWith('sequenceDiagram') || code.startsWith('classDiagram')) {
        initialSections.push({ type: 'mermaid', code });
      } else {
        initialSections.push({ type: 'code', lang: lang || 'text', code });
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      initialSections.push({ type: 'text', content: content.substring(lastIndex) });
    }

    // Step 2: Auto-detect unwrapped raw Mermaid diagrams in text blocks (e.g. after refresh)
    const finalSections = [];
    const rawMermaidRegex = /(?:^|\n)((?:sequenceDiagram|classDiagram|flowchart\s+[A-Z]{2}|graph\s+[A-Z]{2}|erDiagram|gitGraph)\b[\s\S]*?)(?=(?:\n\s*#{1,4}\s+|\n\s*---\s*|\n\s*\d+\.\s+[A-Z]|$))/g;

    for (const sec of initialSections) {
      if (sec.type !== 'text') {
        finalSections.push(sec);
        continue;
      }

      const text = sec.content;
      let textLastIndex = 0;
      let rawMatch;

      while ((rawMatch = rawMermaidRegex.exec(text)) !== null) {
        const matchStart = rawMatch.index + (rawMatch[0].startsWith('\n') ? 1 : 0);
        if (matchStart > textLastIndex) {
          const preText = text.substring(textLastIndex, matchStart).trim();
          if (preText) {
            finalSections.push({ type: 'text', content: preText });
          }
        }

        const diagramCode = rawMatch[1].trim();
        finalSections.push({ type: 'mermaid', code: diagramCode });
        textLastIndex = rawMatch.index + rawMatch[0].length;
      }

      if (textLastIndex < text.length) {
        const remainingText = text.substring(textLastIndex).trim();
        if (remainingText) {
          finalSections.push({ type: 'text', content: remainingText });
        }
      }
    }

    return finalSections.map((sec, idx) => {
      if (sec.type === 'mermaid') {
        return <InteractiveMermaidDiagram key={idx} code={sec.code} />;
      }

      if (sec.type === 'code') {
        return <CodeBlock key={idx} lang={sec.lang} code={sec.code} />;
      }

      return <TextBlock key={idx} text={sec.content} onOpenFileWithLines={onOpenFileWithLines} />;
    });
  };

  return (
    <div className="markdown-body space-y-4 text-xs leading-relaxed text-slate-200 select-text font-sans">
      {renderSections()}
    </div>
  );
}

function InteractiveMermaidDiagram({ code }) {
  const [svgContent, setSvgContent] = useState(null);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const cleanupErrors = () => {
      document.querySelectorAll('#dmermaid, [id^="dmermaid"], .error-icon').forEach(el => el.remove());
    };

    cleanupErrors();

    const renderDiagram = async () => {
      const sanitized = sanitizeMermaidCode(code);
      const id = `mermaid_${Math.random().toString(36).substring(2, 9)}`;

      try {
        const { svg } = await mermaid.render(id, sanitized);
        if (isMounted) {
          // Custom high-contrast SVG styling with full un-squashed typography
          const antiClipStyles = `
            <style>
              .node foreignObject { overflow: visible !important; }
              .node foreignObject div { width: max-content !important; min-width: 100% !important; padding: 6px 14px !important; text-align: center !important; font-family: Inter, -apple-system, sans-serif !important; font-size: 13px !important; font-weight: 500 !important; color: #F8FAFC !important; }
              .edgeLabel foreignObject { overflow: visible !important; }
              .edgeLabel foreignObject div { font-family: Inter, -apple-system, sans-serif !important; padding: 4px 8px !important; font-size: 12px !important; color: #E2E8F0 !important; background: #0B1020 !important; border-radius: 6px !important; border: 1px solid rgba(99,102,241,0.2) !important; }
              text { font-family: Inter, -apple-system, sans-serif !important; fill: #F8FAFC !important; }
              text.actor { font-size: 13px !important; font-weight: 600 !important; fill: #FFFFFF !important; }
              text.messageText { font-size: 12px !important; fill: #E2E8F0 !important; }
              rect.actor { stroke: #6366F1 !important; stroke-width: 1.5px !important; fill: #111827 !important; rx: 8px !important; ry: 8px !important; }
              line.actor-line { stroke: #4F46E5 !important; stroke-dasharray: 4 !important; }
              .messageLine0, .messageLine1 { stroke: #818CF8 !important; stroke-width: 1.5px !important; }
              .note { stroke: #F59E0B !important; fill: #1E1B4B !important; rx: 8px !important; ry: 8px !important; }
              .noteText { fill: #FDE68A !important; font-size: 12px !important; font-weight: 500 !important; }
            </style>
          `;

          // Clean SVG attributes to prevent SVG 1.1 / XML syntax warnings (NaN, auto)
          let enhancedSvg = svg
            .replace(/\bwidth="[^"]*"/gi, '')
            .replace(/\bheight="[^"]*"/gi, '')
            .replace(/\bviewBox="[^"]*NaN[^"]*"/gi, '')
            .replace(/<svg\b([^>]*)>/i, `<svg $1 style="width: 100%; height: 100%; max-width: none; display: block;">${antiClipStyles}`)
            .replace(/style="max-width:[^"]*"/g, 'style="max-width:none;width:100%;height:100%;"')
            .replace(/fill:#ffffde/gi, 'fill:#111827')
            .replace(/fill:#ececff/gi, 'fill:#1E1B4B')
            .replace(/stroke:#333/gi, 'stroke:#6366F1')
            .replace(/fill:#333/gi, 'fill:#F8FAFC');

          setSvgContent(enhancedSvg);
          setError(false);
        }
      } catch (err) {
        if (isMounted) {
          // Attempt auto-healing fallback: strip all non-alphanumeric punctuation from message bodies
          try {
            const healedLines = sanitized.split('\n').map(l => {
              if (l.includes('->>') || l.includes('-->>')) {
                const parts = l.split(':');
                if (parts.length > 1) {
                  return `${parts[0]}: ${parts.slice(1).join(' ').replace(/[^\w\s\-_./()[\]]/g, '')}`;
                }
              }
              return l;
            }).join('\n');

            const healId = `mermaid_heal_${Math.random().toString(36).substring(2, 9)}`;
            const healedRes = await mermaid.render(healId, healedLines);
            if (isMounted && healedRes?.svg) {
              setSvgContent(healedRes.svg.replace(/style="max-width:[^"]*"/g, 'style="max-width:none;width:auto;height:auto;"'));
              setError(false);
              return;
            }
          } catch (healErr) {
            // Keep error boundary
          }

          setError(true);
          cleanupErrors();
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
      cleanupErrors();
    };
  }, [code]);

  // Attach non-passive wheel event listener for smooth zoom without browser console warnings
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheelNonPassive = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      setZoom(z => Math.min(Math.max(z * zoomFactor, 0.3), 6.0));
    };

    el.addEventListener('wheel', onWheelNonPassive, { passive: false });
    return () => el.removeEventListener('wheel', onWheelNonPassive);
  }, []);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDoubleClick = (e) => {
    e.preventDefault();
    setZoom(z => (z < 1.6 ? z + 0.8 : 1.0));
    setPosition({ x: 0, y: 0 });
  };

  const resetView = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadSVG = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `architecture-diagram-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = () => {
    if (!svgContent) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = (img.width || 1400) * 2;
      canvas.height = (img.height || 900) * 2;
      ctx.fillStyle = '#070B14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `architecture-diagram-${Date.now()}.png`;
      a.click();
    };
    img.src = url;
  };

  if (error || !svgContent) {
    return (
      <div className="my-3 p-4 bg-[#0A0E1A] border border-surfaceBorder rounded-2xl">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-surfaceBorder text-slate-400 font-mono text-[11px]">
          <span className="font-semibold text-primary-400">Architecture Diagram (Source)</span>
          <button onClick={handleCopyCode} className="hover:text-white flex items-center space-x-1">
            {copiedCode ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <pre className="font-mono text-[11.5px] text-slate-300 overflow-x-auto p-2 bg-surfaceLight/30 rounded-xl leading-relaxed">
          {code}
        </pre>
      </div>
    );
  }

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-[#070B14] flex flex-col p-4 animate-in fade-in duration-150"
    : "my-3 rounded-2xl bg-[#080C18] border border-surfaceBorder overflow-hidden shadow-2xl transition-all";

  return (
    <div className={containerClasses}>
      {/* Diagram Toolbar */}
      <div className="h-10 px-4 bg-surfaceLight/40 backdrop-blur-md border-b border-surfaceBorder flex items-center justify-between text-[11px] font-sans select-none shrink-0">
        <div className="flex items-center space-x-2 text-slate-400 font-medium">
          <BarChart3 className="w-4 h-4 text-primary-400" />
          <span className="font-semibold text-slate-200">Interactive Architecture Diagram</span>
          <span className="text-[10px] text-slate-500 font-mono">({Math.round(zoom * 100)}%)</span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">• Drag to pan • Scroll to zoom</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button onClick={handleDownloadPNG} className="px-2.5 py-1 bg-surfaceLight hover:bg-surfaceBorder rounded text-slate-300 hover:text-white transition font-mono text-[10.5px]" title="Export High-Res PNG">PNG</button>
          <button onClick={handleDownloadSVG} className="px-2.5 py-1 bg-surfaceLight hover:bg-surfaceBorder rounded text-slate-300 hover:text-white transition font-mono text-[10.5px]" title="Export Lossless SVG">SVG</button>
          <button onClick={handleCopyCode} className="px-2.5 py-1 bg-surfaceLight hover:bg-surfaceBorder rounded text-slate-300 hover:text-white transition font-mono text-[10.5px] flex items-center space-x-1" title="Copy Mermaid Code">
            {copiedCode ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
            <span>Code</span>
          </button>
          <div className="h-3.5 w-px bg-surfaceBorder mx-1" />
          <button onClick={() => setZoom(z => Math.min(z + 0.3, 6.0))} className="p-1 hover:bg-surfaceLight rounded text-slate-400 hover:text-white transition"><ZoomIn className="w-3.5 h-3.5" /></button>
          <button onClick={() => setZoom(z => Math.max(z - 0.3, 0.3))} className="p-1 hover:bg-surfaceLight rounded text-slate-400 hover:text-white transition"><ZoomOut className="w-3.5 h-3.5" /></button>
          <button onClick={resetView} className="p-1 hover:bg-surfaceLight rounded text-slate-400 hover:text-white transition"><RotateCcw className="w-3.5 h-3.5" /></button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1 hover:bg-surfaceLight rounded text-slate-400 hover:text-white transition">
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        className={`relative overflow-hidden flex items-center justify-center p-6 select-none ${
          isFullscreen ? 'flex-1 h-full' : 'h-[520px]'
        } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
          className="flex justify-center items-center pointer-events-none"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>
    </div>
  );
}

function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-2xl bg-[#060913] border border-surfaceBorder overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-3.5 py-2 bg-surfaceLight/50 border-b border-surfaceBorder text-[11px] font-mono text-slate-400">
        <span className="font-semibold text-primary-300 uppercase tracking-wider">{lang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 text-slate-400 hover:text-white transition px-2 py-0.5 rounded hover:bg-surfaceLight"
        >
          {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
          <span className="text-[10px]">{copied ? 'Copied' : 'Copy Code'}</span>
        </button>
      </div>
      <pre className="p-4 font-mono text-[11.5px] overflow-x-auto text-slate-200 leading-relaxed custom-scrollbar">
        {code}
      </pre>
    </div>
  );
}

function TextBlock({ text, onOpenFileWithLines }) {
  const normalizedText = text
    .replace(/\n\s*•\s*\n\s*/g, '\n• ')
    .replace(/\n\s*(\d+)\.\s*\n\s*/g, '\n$1. ');

  const rawLines = normalizedText.split('\n');
  const elements = [];
  let currentTable = null;

  const flushTable = () => {
    if (currentTable && currentTable.rows.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} className="my-3.5 overflow-x-auto rounded-xl border border-surfaceBorder shadow-md bg-[#090D1A]">
          <table className="w-full border-collapse text-left text-xs font-sans">
            <thead>
              <tr className="bg-surfaceLight/60 border-b border-surfaceBorder">
                {currentTable.headers.map((h, hIdx) => (
                  <th key={hIdx} className="px-3.5 py-2.5 font-bold text-white text-[11.5px]">
                    {formatInline(h.trim(), onOpenFileWithLines)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surfaceBorder/60">
              {currentTable.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-surfaceLight/30 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2 text-slate-300 text-[11.5px] leading-relaxed align-top">
                      {formatInline(cell.trim(), onOpenFileWithLines)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentTable = null;
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.slice(1, -1).split('|');
      const isDivider = cells.every(c => /^[\s:-]+$/.test(c));

      if (isDivider && currentTable) {
        continue;
      } else if (!currentTable) {
        currentTable = { headers: cells, rows: [] };
      } else {
        currentTable.rows.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    if (!trimmed) {
      elements.push(<div key={`space-${i}`} className="h-1" />);
      continue;
    }

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      elements.push(<hr key={`hr-${i}`} className="border-t border-surfaceBorder/80 my-4" />);
      continue;
    }

    const sectionMatch = trimmed.match(/^(\d+)\.\s+([A-Z].*)/);
    if (sectionMatch && !trimmed.includes(':') && trimmed.length < 80) {
      elements.push(
        <div key={`sec-${i}`} className="pt-3 pb-1 flex items-center space-x-2 border-b border-surfaceBorder/60">
          <span className="w-5 h-5 rounded-md bg-primary-600/20 border border-primary-500/30 text-primary-400 font-mono text-[11px] font-bold flex items-center justify-center">
            {sectionMatch[1]}
          </span>
          <h2 className="text-[13.5px] font-bold text-white tracking-wide">
            {formatInline(sectionMatch[2], onOpenFileWithLines)}
          </h2>
        </div>
      );
      continue;
    }

    if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={`h1-${i}`} className="text-base font-bold text-white pt-3 pb-1 border-b border-surfaceBorder">{formatInline(trimmed.slice(2), onOpenFileWithLines)}</h1>);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={`h2-${i}`} className="text-sm font-bold text-primary-300 pt-2.5 pb-0.5">{formatInline(trimmed.slice(3), onOpenFileWithLines)}</h2>);
      continue;
    }
    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={`h3-${i}`} className="text-xs font-semibold text-white pt-2">{formatInline(trimmed.slice(4), onOpenFileWithLines)}</h3>);
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      elements.push(<h4 key={`h4-${i}`} className="text-[11.5px] font-semibold text-primary-400 pt-1.5">{formatInline(trimmed.slice(5), onOpenFileWithLines)}</h4>);
      continue;
    }

    if (trimmed.startsWith('•') || trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const bulletContent = trimmed.replace(/^[•*-]\s*/, '');
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start space-x-2.5 pl-2 my-1">
          <span className="text-primary-400 font-bold text-xs mt-0.5">•</span>
          <span className="flex-1 text-slate-200 leading-relaxed text-[12px]">{formatInline(bulletContent, onOpenFileWithLines)}</span>
        </div>
      );
      continue;
    }

    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`num-${i}`} className="flex items-start space-x-2.5 pl-2 my-1.5">
          <span className="text-primary-400 font-mono text-[11px] font-bold mt-0.5">{numMatch[1]}.</span>
          <span className="flex-1 text-slate-200 leading-relaxed text-[12px]">{formatInline(numMatch[2], onOpenFileWithLines)}</span>
        </div>
      );
      continue;
    }

    elements.push(
      <p key={`p-${i}`} className="text-slate-300 leading-relaxed text-[12px] my-1">
        {formatInline(trimmed, onOpenFileWithLines)}
      </p>
    );
  }

  flushTable();
  return <div className="space-y-1">{elements}</div>;
}

function formatInline(text, onOpenFileWithLines) {
  if (!text) return '';
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, pIdx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={pIdx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      const codeVal = part.slice(1, -1);
      const fileMatch = codeVal.match(/^([\w\-./]+\.[\w]+)(?::L?(\d+)(?:-L?(\d+))?)?$/);
      if (fileMatch && onOpenFileWithLines) {
        const filePath = fileMatch[1];
        const start = fileMatch[2] ? parseInt(fileMatch[2], 10) : 1;
        const end = fileMatch[3] ? parseInt(fileMatch[3], 10) : start + 25;
        return (
          <span
            key={pIdx}
            onClick={() => onOpenFileWithLines(filePath, start, end)}
            className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-primary-600/20 hover:bg-primary-600/40 border border-primary-500/30 text-primary-300 hover:text-white rounded font-mono text-[11px] cursor-pointer transition mx-0.5 select-all"
            title={`Open ${filePath}:${start}-${end}`}
          >
            <span>{codeVal}</span>
            <ArrowUpRight className="w-2.5 h-2.5 inline text-primary-400" />
          </span>
        );
      }
      return <code key={pIdx} className="px-1.5 py-0.5 bg-surfaceLight border border-surfaceBorder text-primary-300 rounded font-mono text-[11px]">{codeVal}</code>;
    }
    return part;
  });
}
