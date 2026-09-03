import React, { useState, useEffect } from 'react';
import { GitBranch, GitCompare, X, Loader2, Copy, Check, FileDiff, ArrowRight } from 'lucide-react';
import { RepositoryAPI } from '../services/api';

export default function BranchDiffModal({ isOpen, onClose, repository }) {
  const [branches, setBranches] = useState([]);
  const [baseBranch, setBaseBranch] = useState('main');
  const [targetBranch, setTargetBranch] = useState('HEAD');
  const [diffData, setDiffData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && repository) {
      loadBranches();
    }
  }, [isOpen, repository]);

  const loadBranches = async () => {
    try {
      const res = await RepositoryAPI.getBranches(repository.id);
      const list = res.data || ['main'];
      setBranches(list);
      if (list.length > 0) {
        setBaseBranch(list[0]);
        setTargetBranch(list.length > 1 ? list[1] : list[0]);
      }
    } catch (err) {
      console.error("Failed to load branches:", err);
    }
  };

  const handleCompare = async () => {
    if (!repository) return;
    setLoading(true);
    try {
      const res = await RepositoryAPI.getDiff(repository.id, baseBranch, targetBranch);
      setDiffData(res.data);
    } catch (err) {
      console.error("Failed to get diff:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDiff = () => {
    if (!diffData?.diff) return;
    navigator.clipboard.writeText(diffData.diff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0B1020] border border-surfaceBorder rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="h-14 px-6 border-b border-surfaceBorder flex items-center justify-between bg-surface/90 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-primary-600/20 text-primary-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Multi-Branch Git Diff & PR Comparison</h2>
              <p className="text-[11px] text-slate-400">Compare code changes, commits, and file modifications across branches</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surfaceLight rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Branch Selector Bar */}
        <div className="p-4 bg-surfaceLight/30 border-b border-surfaceBorder flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-medium">Base:</span>
              <select
                value={baseBranch}
                onChange={(e) => setBaseBranch(e.target.value)}
                className="bg-surface border border-surfaceBorder rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-primary-500 font-mono"
              >
                {branches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500" />

            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-medium">Compare Target:</span>
              <select
                value={targetBranch}
                onChange={(e) => setTargetBranch(e.target.value)}
                className="bg-surface border border-surfaceBorder rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-primary-500 font-mono"
              >
                {branches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
                <option value="HEAD">HEAD (Working Tree)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCompare}
              disabled={loading}
              className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 shadow-md shadow-primary-600/20"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitCompare className="w-3.5 h-3.5" />}
              <span>Compare Branches</span>
            </button>

            {diffData?.diff && (
              <button
                onClick={handleCopyDiff}
                className="px-3 py-1.5 bg-surface border border-surfaceBorder hover:border-slate-500 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition flex items-center space-x-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Diff'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Diff Output Viewer */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-[11.5px] leading-relaxed select-text custom-scrollbar bg-[#070A14]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-primary-400 mb-3" />
              <span>Calculating unified Git diff between branches...</span>
            </div>
          ) : !diffData ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <FileDiff className="w-10 h-10 text-slate-600 mb-3" />
              <p className="font-semibold text-slate-300">Select base and compare branches above</p>
              <p className="text-xs text-slate-500 mt-1">Click "Compare Branches" to inspect commit changes and diffs.</p>
            </div>
          ) : !diffData.diff ? (
            <div className="text-center py-16 text-slate-400">
              <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="font-semibold text-white">Branches are in sync</p>
              <p className="text-xs text-slate-500 mt-1">No file differences found between {baseBranch} and {targetBranch}.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {diffData.stats && (
                <div className="p-3 bg-surfaceLight/40 border border-surfaceBorder rounded-xl mb-4 text-slate-300 whitespace-pre">
                  {diffData.stats}
                </div>
              )}
              {diffData.diff.split('\n').map((line, idx) => {
                let colorClass = 'text-slate-300';
                let bgClass = '';
                if (line.startsWith('+') && !line.startsWith('+++')) {
                  colorClass = 'text-emerald-400';
                  bgClass = 'bg-emerald-500/10';
                } else if (line.startsWith('-') && !line.startsWith('---')) {
                  colorClass = 'text-rose-400';
                  bgClass = 'bg-rose-500/10';
                } else if (line.startsWith('@@')) {
                  colorClass = 'text-primary-400 font-bold';
                  bgClass = 'bg-primary-900/20';
                } else if (line.startsWith('diff --git')) {
                  colorClass = 'text-amber-300 font-bold';
                  bgClass = 'bg-surfaceLight/50 mt-3 pt-1 border-t border-surfaceBorder';
                }

                return (
                  <div key={idx} className={`px-2 py-0.5 rounded ${colorClass} ${bgClass} whitespace-pre`}>
                    {line || ' '}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
