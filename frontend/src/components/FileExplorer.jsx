import React, { useState } from 'react';
import { Folder, FileCode, FileText, Search, ChevronRight, ChevronDown, Code, Hash } from 'lucide-react';

export default function FileExplorer({ files, selectedFile, onSelectFile }) {
  const [search, setSearch] = useState('');

  const filteredFiles = files.filter((f) =>
    f.path.toLowerCase().includes(search.toLowerCase())
  );

  const getFileIcon = (ext, lang) => {
    if (['java', 'py', 'ts', 'js', 'tsx', 'jsx'].includes(lang)) {
      return <FileCode className="w-3.5 h-3.5 text-primary-400 shrink-0" />;
    }
    if (['md', 'txt'].includes(lang)) {
      return <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
    return <Code className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  };

  return (
    <div className="w-64 border-r border-surfaceBorder bg-surface flex flex-col shrink-0 h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-surfaceBorder">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Repository Explorer</span>
          <span className="text-[10px] font-mono bg-surfaceLight px-1.5 py-0.5 rounded text-slate-400">
            {files.length} files
          </span>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
          <input
            type="text"
            placeholder="Filter files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surfaceLight border border-surfaceBorder rounded-md pl-8 pr-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs font-mono">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-[11px]">
            {files.length === 0 ? 'No files indexed yet' : 'No matching files'}
          </div>
        ) : (
          filteredFiles.map((file) => {
            const isSelected = selectedFile?.path === file.path;
            return (
              <div
                key={file.id || file.path}
                onClick={() => onSelectFile(file.path)}
                className={`flex items-center space-x-2 px-2 py-1.5 rounded cursor-pointer transition ${
                  isSelected
                    ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30 font-medium'
                    : 'text-slate-300 hover:bg-surfaceLight/60 hover:text-white'
                }`}
              >
                {getFileIcon(file.extension, file.language)}
                <span className="truncate flex-1" title={file.path}>
                  {file.path}
                </span>
                {file.lineCount > 0 && (
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {file.lineCount}L
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
