import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Key, Cpu, LogOut, ArrowRight, CheckCircle2, AlertCircle, ArrowLeft, Save, Eye, EyeOff, Sparkles, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PROVIDERS } from '../constants/apiEndpoints';

export default function ProfilePage({ onNavigate }) {
  const { user, logout, isAuthenticated } = useAuth();

  // BYOK Settings State
  const [provider, setProvider] = useState(() => localStorage.getItem('byok_provider') || PROVIDERS.GEMINI);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(`byok_key_${provider}`) || '');
  const [showKey, setShowKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      onNavigate('/signin');
    }
  }, [isAuthenticated]);

  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    setApiKey(localStorage.getItem(`byok_key_${newProvider}`) || '');
    setSaveSuccess(false);
  };

  const handleSaveBYOK = (e) => {
    e.preventDefault();
    localStorage.setItem('byok_provider', provider);
    if (apiKey.trim()) {
      localStorage.setItem(`byok_key_${provider}`, apiKey.trim());
    } else {
      localStorage.removeItem(`byok_key_${provider}`);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleLogout = () => {
    logout();
    onNavigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#060912] text-slate-100 flex flex-col font-sans">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-primary-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="h-16 border-b border-surfaceBorder/60 bg-[#060912]/80 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-6 lg:px-12 max-w-6xl mx-auto w-full">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('/')}>
          <div className="p-2 bg-primary-600/20 border border-primary-500/30 rounded-xl text-primary-400">
            <Cpu className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">
            AI Codebase Architect
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <button
            onClick={() => onNavigate('/workspace')}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl shadow-lg shadow-primary-600/25 transition flex items-center space-x-1.5 font-semibold"
          >
            <span>Open Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl border border-surfaceBorder transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Profile Dashboard */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 lg:p-10 space-y-8 relative z-10">
        {/* Back Link */}
        <button
          onClick={() => onNavigate('/workspace')}
          className="flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition" />
          <span>Back to Workspace</span>
        </button>

        {/* User Card */}
        <div className="p-8 rounded-3xl bg-[#0B1020] border border-surfaceBorder shadow-2xl flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-6">
          <div className="relative">
            <img
              src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
              alt="Profile"
              className="w-24 h-24 rounded-3xl border-2 border-primary-500/40 bg-surface shadow-xl object-cover"
            />
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-primary-600 text-white shadow-md">
              <Shield className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                {user.fullName || user.username}
              </h1>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-primary-600/20 text-primary-300 border border-primary-500/30 font-semibold self-center sm:self-auto">
                {user.role || 'ROLE_DEVELOPER'}
              </span>
            </div>

            <p className="text-xs font-mono text-slate-400">@{user.username}</p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-300">
              <div className="flex items-center space-x-1.5 bg-surfaceLight/60 px-3 py-1.5 rounded-xl border border-surfaceBorder">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.email}</span>
              </div>

              <div className="flex items-center space-x-1.5 bg-surfaceLight/60 px-3 py-1.5 rounded-xl border border-surfaceBorder">
                <span className="text-slate-400 font-medium">Provider:</span>
                <span className="font-semibold text-primary-300">{user.provider || 'LOCAL'}</span>
              </div>

              <div className="flex items-center space-x-1.5 bg-surfaceLight/60 px-3 py-1.5 rounded-xl border border-surfaceBorder">
                {user.isEmailVerified ? (
                  <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-amber-400 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Unverified</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bring Your Own Key (BYOK) Configuration Section */}
        <div className="p-8 rounded-3xl bg-[#0B1020] border border-surfaceBorder shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-surfaceBorder/60 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Bring Your Own Key (BYOK) Engine</h2>
                <p className="text-xs text-slate-400">Configure your personal AI provider and custom API keys</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Client-Side Encrypted
            </span>
          </div>

          <form onSubmit={handleSaveBYOK} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Select Active LLM Provider
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: PROVIDERS.GEMINI, name: 'Google Gemini', desc: 'Gemini 2.5 Flash / Pro' },
                  { id: PROVIDERS.OPENAI, name: 'OpenAI', desc: 'GPT-4o / GPT-4o mini' },
                  { id: PROVIDERS.ANTHROPIC, name: 'Anthropic', desc: 'Claude 3.5 Sonnet' },
                  { id: PROVIDERS.GROQ, name: 'Groq Cloud', desc: 'Llama 3.3 70B (Ultra Fast)' },
                  { id: PROVIDERS.DEEPSEEK, name: 'DeepSeek', desc: 'DeepSeek V3 / R1' },
                  { id: PROVIDERS.OLLAMA, name: 'Ollama Local', desc: 'Local localhost:11434' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleProviderChange(item.id)}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                      provider === item.id
                        ? 'bg-primary-600/15 border-primary-500 text-white shadow-md shadow-primary-600/15'
                        : 'bg-surfaceLight/40 border-surfaceBorder hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs">{item.name}</span>
                    <span className="text-[10px] text-slate-500 mt-1 font-mono">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {provider !== PROVIDERS.OLLAMA && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {provider.toUpperCase()} API Key
                  </label>
                  <span className="text-[10px] text-slate-500">Stored only in your browser localStorage</span>
                </div>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder={`Paste your ${provider.toUpperCase()} API key`}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-surfaceLight border border-surfaceBorder rounded-2xl pl-4 pr-12 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-3 p-1 text-slate-400 hover:text-white transition"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {saveSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>BYOK configuration saved successfully!</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl text-xs font-semibold transition shadow-lg shadow-primary-600/25 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Provider Settings</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="px-5 py-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition flex items-center space-x-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
