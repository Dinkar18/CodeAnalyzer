import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import RepositoryModal from '../components/RepositoryModal';
import FileExplorer from '../components/FileExplorer';
import CodeViewer from '../components/CodeViewer';
import ChatPanel from '../components/ChatPanel';
import FindingsPanel from '../components/FindingsPanel';
import GraphViewer from '../components/GraphViewer';
import CommandPalette from '../components/CommandPalette';
import BranchDiffModal from '../components/BranchDiffModal';
import LLMSettingsModal from '../components/LLMSettingsModal';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { RepositoryAPI, FileAPI } from '../services/api';
import { VIEW_MODES, PROVIDERS } from '../constants/apiEndpoints';
import { getActiveProvider } from '../utils/byokStorage';
import { Code2, ShieldAlert, Network, MessageSquare, PanelLeftClose, PanelLeftOpen, PanelRightClose, Sparkles } from 'lucide-react';

export default function WorkspacePage({ onNavigate }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id || user?.username || 'anon';

  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [isRepoModalOpen, setIsRepoModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isBranchDiffOpen, setIsBranchDiffOpen] = useState(false);
  const [isLLMSettingsOpen, setIsLLMSettingsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState(() => getActiveProvider(userId));

  // Redirect to landing page if logged out
  useEffect(() => {
    if (!authLoading && !user) {
      onNavigate('/');
    }
  }, [user, authLoading]);

  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetLine, setTargetLine] = useState(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [activeCenterView, setActiveCenterView] = useState(VIEW_MODES.CHAT);
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [isSideChatOpen, setIsSideChatOpen] = useState(false);

  // Global Chat State
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Welcome! I am your **Senior AI Codebase Architect & Mentor**.\n\nI support **Bring Your Own Key (BYOK)** (Gemini, OpenAI GPT-4o, Claude 3.5, Groq, DeepSeek, and Ollama) with real-time SSE streaming, interactive diagrams, and branch diffing.\n\nPress <kbd class="px-1.5 py-0.5 rounded bg-surfaceLight border border-surfaceBorder text-primary-400 font-mono">Ctrl K</kbd> to search symbols, or configure keys in **Model** (top right)!',
      evidence: []
    }
  ]);
  const [initialPrompt, setInitialPrompt] = useState(null);

  // Global keyboard shortcut for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const loadRepositories = async () => {
    try {
      const res = await RepositoryAPI.list();
      setRepositories(res.data || []);
      if (res.data && res.data.length > 0 && !selectedRepo) {
        setSelectedRepo(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to load repositories:", err);
    }
  };

  const loadFiles = async (repoId) => {
    if (!repoId) return;
    try {
      const res = await FileAPI.listFiles(repoId);
      setFiles(res.data || []);
    } catch (err) {
      console.error("Failed to load files:", err);
      setFiles([]);
    }
  };

  const handleSelectFile = async (filePath, startLine = null, endLine = null) => {
    if (!selectedRepo) return;
    try {
      const res = await FileAPI.getFileContent(selectedRepo.id, filePath);
      setSelectedFile(res.data);
      if (startLine && endLine) {
        setTargetLine({ start: startLine, end: endLine });
      } else {
        setTargetLine(null);
      }
      setActiveCenterView(VIEW_MODES.CODE);
    } catch (err) {
      console.error("Failed to get file content:", err);
    }
  };

  const handleStartContextChat = (prompt) => {
    setInitialPrompt(prompt);
    setActiveCenterView(VIEW_MODES.CHAT);
  };

  const handleCreateRepo = async (repoData) => {
    const res = await RepositoryAPI.create(repoData);
    await loadRepositories();
    setSelectedRepo(res.data);
    setIsIndexing(true);
    pollIndexingStatus(res.data.id);
  };

  const handleTriggerIndex = async (repoId) => {
    setIsIndexing(true);
    await RepositoryAPI.triggerIndex(repoId, true);
    pollIndexingStatus(repoId);
  };

  const pollIndexingStatus = (repoId) => {
    const interval = setInterval(async () => {
      try {
        const res = await RepositoryAPI.indexStatus(repoId);
        if (res.data.status === 'READY' || res.data.status === 'FAILED') {
          setIsIndexing(false);
          clearInterval(interval);
          loadRepositories();
          loadFiles(repoId);
        }
      } catch (err) {
        clearInterval(interval);
        setIsIndexing(false);
      }
    }, 2500);
  };

  useEffect(() => {
    loadRepositories();
  }, []);

  useEffect(() => {
    if (selectedRepo) {
      loadFiles(selectedRepo.id);
    }
  }, [selectedRepo]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background font-sans">
      <Header
        selectedRepo={selectedRepo}
        onOpenRepoModal={() => setIsRepoModalOpen(true)}
        onTriggerIndex={handleTriggerIndex}
        isIndexing={isIndexing}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenBranchDiffModal={() => setIsBranchDiffOpen(true)}
        onOpenLLMSettingsModal={() => setIsLLMSettingsOpen(true)}
        onOpenAuthModal={() => onNavigate('/signin')}
        onNavigateProfile={() => onNavigate('/profile')}
        activeProvider={activeProvider}
      />

      {/* Main Workspace Layout with Collapsible Sidebars */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Left: File Tree Explorer (Collapsible) */}
        {isExplorerOpen && (
          <div className="w-64 shrink-0 h-full flex flex-col border-r border-surfaceBorder bg-surface animate-in slide-in-from-left duration-150">
            <div className="h-9 px-3 border-b border-surfaceBorder flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Files & Folders</span>
              <button
                onClick={() => setIsExplorerOpen(false)}
                className="p-1 hover:bg-surfaceLight rounded text-slate-400 hover:text-white"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              <FileExplorer
                files={files}
                selectedFile={selectedFile}
                onSelectFile={(path) => handleSelectFile(path)}
              />
            </div>
          </div>
        )}

        {/* Closed Left Sidebar Handle */}
        {!isExplorerOpen && (
          <button
            onClick={() => setIsExplorerOpen(true)}
            className="w-8 h-full bg-surface border-r border-surfaceBorder hover:bg-surfaceLight flex flex-col items-center pt-3 text-slate-400 hover:text-white transition z-10 shrink-0"
            title="Expand Explorer"
          >
            <PanelLeftOpen className="w-4 h-4 mb-2 text-primary-400" />
            <span className="text-[10px] font-mono [writing-mode:vertical-lr] tracking-widest uppercase">
              Files
            </span>
          </button>
        )}

        {/* Center: Main View Workspace */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#070B14]">
          {/* View Mode Switcher Header */}
          <div className="h-11 bg-surface/95 backdrop-blur-md border-b border-surfaceBorder flex items-center justify-between px-4 text-xs shrink-0 z-10">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveCenterView(VIEW_MODES.CHAT)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeCenterView === VIEW_MODES.CHAT
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30 border border-primary-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-surfaceLight'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Architect Workspace</span>
              </button>

              <button
                onClick={() => setActiveCenterView(VIEW_MODES.CODE)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeCenterView === VIEW_MODES.CODE
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30 border border-primary-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-surfaceLight'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Source Code & Docs</span>
              </button>

              <button
                onClick={() => setActiveCenterView(VIEW_MODES.GRAPH)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeCenterView === VIEW_MODES.GRAPH
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30 border border-primary-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-surfaceLight'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>Architecture Graph</span>
              </button>

              <button
                onClick={() => setActiveCenterView(VIEW_MODES.FINDINGS)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeCenterView === VIEW_MODES.FINDINGS
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30 border border-primary-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-surfaceLight'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Specialist Findings</span>
              </button>
            </div>

            {/* Side Chat Toggle button */}
            {activeCenterView !== VIEW_MODES.CHAT && (
              <button
                onClick={() => setIsSideChatOpen(!isSideChatOpen)}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition ${
                  isSideChatOpen
                    ? 'bg-surfaceLight text-primary-300 border border-primary-500/40'
                    : 'bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-600/20'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{isSideChatOpen ? "Hide Side Chat" : "Open Side Chat"}</span>
              </button>
            )}
          </div>

          {/* Active View Container */}
          <div className="flex-1 min-h-0 overflow-hidden flex">
            {activeCenterView === VIEW_MODES.CHAT && (
              <ChatPanel
                repository={selectedRepo}
                onOpenFileWithLines={(path, s, e) => handleSelectFile(path, s, e)}
                isFullWidth={true}
                messages={messages}
                setMessages={setMessages}
                initialPrompt={initialPrompt}
                onClearInitialPrompt={() => setInitialPrompt(null)}
                onOpenLLMSettings={() => setIsLLMSettingsOpen(true)}
              />
            )}
            {activeCenterView === VIEW_MODES.CODE && (
              <CodeViewer file={selectedFile} targetLine={targetLine} />
            )}
            {activeCenterView === VIEW_MODES.GRAPH && (
              <GraphViewer
                repository={selectedRepo}
                onOpenFileWithLines={(path, s, e) => handleSelectFile(path, s, e)}
                onStartContextChat={handleStartContextChat}
              />
            )}
            {activeCenterView === VIEW_MODES.FINDINGS && (
              <FindingsPanel
                repository={selectedRepo}
                onOpenFileWithLines={(path, s, e) => handleSelectFile(path, s, e)}
              />
            )}
          </div>
        </div>

        {/* Right Side Chat Panel */}
        {activeCenterView !== VIEW_MODES.CHAT && isSideChatOpen && (
          <div className="relative flex h-full">
            <ChatPanel
              repository={selectedRepo}
              onOpenFileWithLines={(path, s, e) => handleSelectFile(path, s, e)}
              isFullWidth={false}
              messages={messages}
              setMessages={setMessages}
              initialPrompt={initialPrompt}
              onClearInitialPrompt={() => setInitialPrompt(null)}
              onOpenLLMSettings={() => setIsLLMSettingsOpen(true)}
            />
            <button
              onClick={() => setIsSideChatOpen(false)}
              className="absolute top-2.5 right-36 p-1 text-slate-400 hover:text-white hover:bg-surfaceLight rounded-md transition z-20"
              title="Close Side Chat"
            >
              <PanelRightClose className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        files={files}
        onSelectFile={(path) => handleSelectFile(path)}
        onSwitchView={(mode) => setActiveCenterView(mode)}
        onRunPrompt={(prompt) => handleStartContextChat(prompt)}
      />

      <BranchDiffModal
        isOpen={isBranchDiffOpen}
        onClose={() => setIsBranchDiffOpen(false)}
        repository={selectedRepo}
      />

      <LLMSettingsModal
        isOpen={isLLMSettingsOpen}
        onClose={() => setIsLLMSettingsOpen(false)}
        onSave={({ provider }) => setActiveProvider(provider)}
      />

      <RepositoryModal
        isOpen={isRepoModalOpen}
        onClose={() => setIsRepoModalOpen(false)}
        repositories={repositories}
        onSelectRepo={(repo) => setSelectedRepo(repo)}
        onCreateRepo={handleCreateRepo}
      />
    </div>
  );
}
