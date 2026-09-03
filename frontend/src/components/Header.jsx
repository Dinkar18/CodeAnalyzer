import React, { useState } from 'react';
import { Cpu, GitBranch, Shield, Sparkles, FolderGit2, RefreshCw, Search, Command, GitCompare, ShieldCheck, Key, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Header({
  selectedRepo,
  onOpenRepoModal,
  onTriggerIndex,
  isIndexing,
  onOpenCommandPalette,
  onOpenBranchDiffModal,
  onOpenLLMSettingsModal,
  onOpenAuthModal,
  onNavigateProfile,
  activeProvider = 'gemini'
}) {
  const { user, logout, isAuthenticated } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const providerLabels = {
    gemini: 'Gemini',
    openai: 'GPT-4o',
    anthropic: 'Claude 3.5',
    groq: 'Groq',
    deepseek: 'DeepSeek',
    ollama: 'Ollama',
  };

  return (
    <header className="h-14 border-b border-surfaceBorder bg-surface flex items-center justify-between px-4 z-10 shrink-0 select-none">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        <div className="p-1.5 bg-primary-600/20 border border-primary-500/30 rounded-lg flex items-center justify-center text-primary-400">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            AI Codebase Architect
          </span>
          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-primary-600/20 text-primary-400 font-mono font-medium border border-primary-500/20">
            v2.0
          </span>
        </div>
      </div>

      {/* Global Command Palette Launcher */}
      <button
        onClick={onOpenCommandPalette}
        className="flex items-center space-x-2.5 bg-surfaceLight/50 hover:bg-surfaceLight border border-surfaceBorder hover:border-primary-500/40 px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition w-72 justify-between group shadow-sm hidden md:flex"
      >
        <div className="flex items-center space-x-2">
          <Search className="w-3.5 h-3.5 text-primary-400" />
          <span className="text-[11.5px] font-sans">Quick search files, UML, prompts...</span>
        </div>
        <kbd className="font-mono text-[10px] bg-surface border border-surfaceBorder px-1.5 py-0.5 rounded text-slate-400 group-hover:text-primary-300">
          Ctrl K
        </kbd>
      </button>

      {/* Action Controls: LLM Config, Repository Status, Auth */}
      <div className="flex items-center space-x-2.5">
        {/* BYOK / LLM Config Button */}
        <button
          onClick={onOpenLLMSettingsModal}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-surfaceLight/60 hover:bg-surfaceLight border border-surfaceBorder hover:border-primary-500/50 text-xs text-slate-300 hover:text-white transition shadow-sm"
          title="Configure AI Model & Custom API Keys"
        >
          <Key className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline font-medium">Model:</span>
          <span className="text-[11px] font-semibold text-primary-300 font-mono">
            {providerLabels[activeProvider] || activeProvider}
          </span>
        </button>

        {/* Repository Status */}
        {selectedRepo ? (
          <div className="flex items-center space-x-2 bg-surfaceLight/60 border border-surfaceBorder px-3 py-1.5 rounded-xl text-xs">
            <FolderGit2 className="w-4 h-4 text-primary-400" />
            <span className="font-medium text-slate-200 truncate max-w-[120px]">{selectedRepo.name}</span>
            <span className="text-slate-500 font-mono text-[11px] hidden sm:inline">({selectedRepo.defaultBranch || 'main'})</span>
            
            <button
              onClick={onOpenBranchDiffModal}
              title="Compare Branches & Git Diff"
              className="ml-1 p-1 hover:bg-surfaceBorder rounded text-slate-400 hover:text-primary-300 transition flex items-center space-x-1"
            >
              <GitCompare className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onTriggerIndex(selectedRepo.id)}
              disabled={isIndexing}
              title="Reindex Repository"
              className="ml-1 p-1 hover:bg-surfaceBorder rounded text-slate-400 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isIndexing ? 'animate-spin text-primary-400' : ''}`} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenRepoModal}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition shadow-md shadow-primary-600/20"
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Connect Repo</span>
          </button>
        )}

        {selectedRepo && (
          <button
            onClick={onOpenRepoModal}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl border border-surfaceBorder hover:border-slate-500 hover:bg-surfaceLight transition hidden lg:inline"
          >
            Switch Repo
          </button>
        )}

        {/* User Auth Profile / Login & Dedicated Logout */}
        <div className="flex items-center space-x-2">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-1.5">
              {/* Profile Badge */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-1 pl-2 pr-2.5 rounded-xl bg-surfaceLight/60 hover:bg-surfaceLight border border-surfaceBorder hover:border-slate-500 transition"
                  title="View Account Details"
                >
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                    alt="Avatar"
                    className="w-6 h-6 rounded-full bg-primary-900 border border-primary-500/50"
                  />
                  <span className="text-xs font-semibold text-slate-200 hidden sm:inline truncate max-w-[100px]">
                    {user.username}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-[#0B1020] border border-surfaceBorder rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-surfaceBorder mb-1">
                      <p className="text-xs font-bold text-white truncate">{user.fullName || user.username}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-primary-600/20 text-primary-400 font-mono font-medium border border-primary-500/20">
                        {user.role || 'ROLE_DEVELOPER'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (onNavigateProfile) onNavigateProfile();
                      }}
                      className="w-full px-3 py-1.5 rounded-lg text-slate-300 hover:bg-surfaceLight text-xs font-medium flex items-center space-x-2 transition mb-1"
                    >
                      <User className="w-3.5 h-3.5 text-primary-400" />
                      <span>Developer Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-medium flex items-center space-x-2 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Prominent Direct Logout Button */}
              <button
                onClick={logout}
                className="p-1.5 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
                title="Sign out of your account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center space-x-1.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition shadow-md shadow-primary-600/20"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
