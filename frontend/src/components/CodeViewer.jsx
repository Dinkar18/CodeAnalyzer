import React, { useState } from 'react';
import { Copy, FileCode, Check, BookOpen, ChevronRight, Hash, ArrowUpRight } from 'lucide-react';

export default function CodeViewer({ file, targetLine }) {
  const [copiedContent, setCopiedContent] = React.useState(false);
  const [copiedPath, setCopiedPath] = React.useState(false);

  if (!file) {
    return (
      <div className="flex-1 bg-[#060912] flex flex-col items-center justify-center text-slate-500 text-xs p-6 select-none">
        <div className="p-4 bg-surfaceLight/30 rounded-2xl border border-surfaceBorder mb-4 text-primary-400">
          <BookOpen className="w-8 h-8" />
        </div>
        <p className="font-semibold text-slate-300 text-sm">Select a file from the explorer to view its code</p>
        <p className="text-[11.5px] text-slate-500 mt-1 max-w-md text-center">
          Or use <kbd className="font-mono bg-surface border border-surfaceBorder px-1.5 py-0.5 rounded text-primary-400">Ctrl K</kbd> to jump straight to any file, class, or method.
        </p>
      </div>
    );
  }

  const lines = (file.content || '').split('\n');
  const pathParts = (file.path || '').split('/');

  const copyContentToClipboard = () => {
    navigator.clipboard.writeText(file.content);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 2000);
  };

  const copyPathToClipboard = () => {
    navigator.clipboard.writeText(file.path);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  return (
    <div className="flex-1 bg-[#070B16] flex flex-col h-full min-h-0 overflow-hidden border-r border-surfaceBorder">
      {/* File Breadcrumb & Header Bar */}
      <div className="h-11 bg-surface/90 backdrop-blur-md border-b border-surfaceBorder flex items-center justify-between px-4 shrink-0 select-none z-10">
        <div className="flex items-center space-x-1.5 text-xs truncate">
          <FileCode className="w-4 h-4 text-primary-400 shrink-0 mr-1" />
          {pathParts.map((part, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}
              <span
                className={`font-mono truncate ${
                  idx === pathParts.length - 1
                    ? 'font-bold text-white'
                    : 'text-slate-400'
                }`}
              >
                {part}
              </span>
            </React.Fragment>
          ))}
          <span className="text-[10px] font-mono text-slate-500 ml-2 px-2 py-0.5 rounded bg-surfaceLight border border-surfaceBorder shrink-0">
            {lines.length} lines
          </span>
          {targetLine && (
            <span className="text-[10px] font-mono text-primary-300 bg-primary-600/20 border border-primary-500/30 px-2 py-0.5 rounded shrink-0">
              Focus: L{targetLine.start}-L{targetLine.end}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={copyPathToClipboard}
            className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-white px-2.5 py-1 bg-surfaceLight hover:bg-surfaceBorder rounded-lg border border-surfaceBorder transition font-mono"
            title="Copy Relative Path"
          >
            {copiedPath ? <Check className="w-3 h-3 text-accent" /> : <Hash className="w-3 h-3" />}
            <span>{copiedPath ? 'Path Copied' : 'Copy Path'}</span>
          </button>
          <button
            onClick={copyContentToClipboard}
            className="flex items-center space-x-1 text-[11px] text-slate-300 hover:text-white px-2.5 py-1 bg-primary-600 hover:bg-primary-500 rounded-lg transition shadow-md shadow-primary-600/20 font-medium"
            title="Copy Full Code"
          >
            {copiedContent ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
            <span>{copiedContent ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Code Viewer Table with Line Highlighting */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 font-mono text-[12px] leading-relaxed text-slate-200 select-text custom-scrollbar">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isHighlighted = targetLine && lineNum >= targetLine.start && lineNum <= targetLine.end;
              return (
                <tr
                  key={idx}
                  id={`L${lineNum}`}
                  className={`group transition-colors ${
                    isHighlighted ? 'bg-primary-600/20 border-l-2 border-primary-400 shadow-sm' : 'hover:bg-surfaceLight/30'
                  }`}
                >
                  <td className="w-12 pr-4 text-right select-none text-slate-600 group-hover:text-slate-400 text-[11px] font-mono">
                    {lineNum}
                  </td>
                  <td className="whitespace-pre pl-2 font-mono">
                    {line || ' '}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
