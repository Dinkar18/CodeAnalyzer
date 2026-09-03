import React, { useState, useEffect, useRef } from 'react';
import { Search, FileCode, Network, ShieldAlert, Sparkles, Code2, ArrowRight, CornerDownLeft, X, GitFork, Activity, GraduationCap } from 'lucide-react';
import { VIEW_MODES } from '../constants/apiEndpoints';

export default function CommandPalette({
  isOpen,
  onClose,
  files = [],
  onSelectFile,
  onSwitchView,
  onRunPrompt
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Static Quick Actions
  const quickActions = [
    {
      id: 'chat-uml',
      title: 'Draw UML Class Diagram',
      category: 'AI Action',
      icon: GitFork,
      color: 'text-primary-400',
      action: () => {
        onRunPrompt('Draw a comprehensive Mermaid UML class diagram for this repository showing key service classes, models, interfaces, and their relationships.');
        onClose();
      }
    },
    {
      id: 'chat-seq',
      title: 'Draw Request Flow Sequence Diagram',
      category: 'AI Action',
      icon: Activity,
      color: 'text-blue-400',
      action: () => {
        onRunPrompt('Draw a detailed Mermaid sequence diagram showing the step-by-step request flow from user API upload to background worker transcription and evaluation.');
        onClose();
      }
    },
    {
      id: 'chat-beginner',
      title: 'Explain Project (Beginner Developer Guide)',
      category: 'AI Action',
      icon: GraduationCap,
      color: 'text-emerald-400',
      action: () => {
        onRunPrompt('Explain this project and all its services as if I am a beginner developer. Break down each service step-by-step with simple analogies, what each component does, and how data moves between them.');
        onClose();
      }
    },
    {
      id: 'chat-speech',
      title: 'Search Speech-to-Text & Worker Pipeline',
      category: 'AI Action',
      icon: Sparkles,
      color: 'text-purple-400',
      action: () => {
        onRunPrompt('In which file is the speech-to-text and transcription logic written? Explain how it works step-by-step with exact code citations and file locations.');
        onClose();
      }
    },
    {
      id: 'nav-graph',
      title: 'Switch to Architecture & Call Graph',
      category: 'Navigation',
      icon: Network,
      color: 'text-indigo-400',
      action: () => {
        onSwitchView(VIEW_MODES.GRAPH);
        onClose();
      }
    },
    {
      id: 'nav-findings',
      title: 'Switch to Specialist Audit Findings',
      category: 'Navigation',
      icon: ShieldAlert,
      color: 'text-rose-400',
      action: () => {
        onSwitchView(VIEW_MODES.FINDINGS);
        onClose();
      }
    },
    {
      id: 'nav-chat',
      title: 'Switch to AI Architect Workspace',
      category: 'Navigation',
      icon: Sparkles,
      color: 'text-primary-400',
      action: () => {
        onSwitchView(VIEW_MODES.CHAT);
        onClose();
      }
    }
  ];

  // Matching files
  const matchingFiles = files
    .filter(f => !query || f.path.toLowerCase().includes(query.toLowerCase()) || f.filename.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8)
    .map(f => ({
      id: `file-${f.id || f.path}`,
      title: f.filename,
      subtitle: f.path,
      category: 'Files',
      icon: FileCode,
      color: 'text-slate-300',
      action: () => {
        onSelectFile(f.path);
        onClose();
      }
    }));

  // Matching quick actions
  const matchingActions = quickActions.filter(a =>
    !query || a.title.toLowerCase().includes(query.toLowerCase())
  );

  const allItems = [...matchingActions, ...matchingFiles];

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % (allItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + allItems.length) % (allItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-start justify-center pt-24 px-4 animate-in fade-in duration-100">
      <div
        className="w-full max-w-2xl bg-[#090D1A] border border-surfaceBorder rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="h-14 px-4 border-b border-surfaceBorder flex items-center space-x-3 bg-surfaceLight/30">
          <Search className="w-5 h-5 text-primary-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a file name, symbol, or prompt (e.g. 'call_service', 'UML', 'security')..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-sans"
          />
          <div className="flex items-center space-x-1 font-mono text-[10px] text-slate-400 bg-surfaceLight px-2 py-0.5 rounded border border-surfaceBorder">
            <span>ESC</span>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {allItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching files, symbols, or actions found.
            </div>
          ) : (
            allItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between text-xs ${
                    isSelected
                      ? 'bg-primary-600/20 border border-primary-500/40 text-white shadow-sm'
                      : 'bg-surfaceLight/20 hover:bg-surfaceLight/50 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className={`p-1.5 rounded-lg bg-surfaceLight/60 ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="font-medium text-white truncate">{item.title}</span>
                      {item.subtitle && (
                        <span className="text-[10px] font-mono text-slate-400 truncate">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-surfaceLight/60 text-slate-400 border border-surfaceBorder">
                      {item.category}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-primary-400" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2 bg-surfaceLight/20 border-t border-surfaceBorder flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <div className="flex items-center space-x-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>AI Codebase Architect Command Palette</span>
        </div>
      </div>
    </div>
  );
}
