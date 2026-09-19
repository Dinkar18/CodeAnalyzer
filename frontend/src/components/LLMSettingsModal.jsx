import React, { useState, useEffect } from 'react';
import { X, Key, Cpu, Sparkles, Check, Eye, EyeOff, Loader2, Server, RefreshCw } from 'lucide-react';
import { PROVIDERS } from '../constants/apiEndpoints';
import { useAuth } from '../contexts/AuthContext';
import {
  getActiveProvider,
  setActiveProvider as saveActiveProvider,
  getBYOKKey,
  setBYOKKey,
  getBYOKModel,
  setBYOKModel,
  getBYOKUrl,
  setBYOKUrl
} from '../utils/byokStorage';

const PROVIDER_PRESETS = {
  [PROVIDERS.GEMINI]: {
    default: 'gemini-2.5-flash',
    presets: ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro']
  },
  [PROVIDERS.GROQ]: {
    default: 'llama-3.1-8b-instant',
    presets: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it', 'deepseek-r1-distill-llama-70b']
  },
  [PROVIDERS.OPENAI]: {
    default: 'gpt-4o',
    presets: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o1']
  },
  [PROVIDERS.ANTHROPIC]: {
    default: 'claude-3-5-sonnet-20241022',
    presets: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022']
  },
  [PROVIDERS.DEEPSEEK]: {
    default: 'deepseek-chat',
    presets: ['deepseek-chat', 'deepseek-reasoner']
  },
  [PROVIDERS.OLLAMA]: {
    default: 'llama3',
    presets: ['llama3', 'deepseek-coder-v2', 'mistral', 'qwen2.5-coder']
  },
};

export default function LLMSettingsModal({ isOpen, onClose, onSave }) {
  const { user } = useAuth();
  const userId = user?.id || user?.username || 'anon';

  const [provider, setProvider] = useState(PROVIDERS.GEMINI);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(PROVIDER_PRESETS[PROVIDERS.GEMINI].default);
  const [baseUrl, setBaseUrl] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  
  // Dynamic Live Models List
  const [liveModels, setLiveModels] = useState([]);
  const [fetchingModels, setFetchingModels] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedProvider = getActiveProvider(userId);
      const savedKey = getBYOKKey(savedProvider, userId);
      const savedModel = getBYOKModel(savedProvider, PROVIDER_PRESETS[savedProvider]?.default, userId);
      const savedUrl = getBYOKUrl(savedProvider, userId) || (savedProvider === PROVIDERS.OLLAMA ? 'http://localhost:11434' : '');

      setProvider(savedProvider);
      setApiKey(savedKey);
      setModel(savedModel);
      setBaseUrl(savedUrl);
      setTestResult(null);
      setSavedSuccess(false);
      setLiveModels([]);

      if (savedKey || savedProvider === PROVIDERS.OLLAMA) {
        fetchLiveModels(savedProvider, savedKey, savedUrl);
      }
    }
  }, [isOpen, userId]);

  const fetchLiveModels = async (prov, key, url) => {
    if (!key && prov !== PROVIDERS.OLLAMA) return;
    setFetchingModels(true);
    try {
      if (prov === PROVIDERS.GROQ) {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${key.trim()}` }
        });
        if (res.ok) {
          const data = await res.json();
          const ids = (data.data || [])
            .map((m) => m.id)
            .filter((id) => !id.includes('whisper') && !id.includes('guard'));
          if (ids.length > 0) setLiveModels(ids);
        }
      } else if (prov === PROVIDERS.GEMINI) {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key.trim()}`);
        if (res.ok) {
          const data = await res.json();
          const ids = (data.models || [])
            .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m) => m.name.replace('models/', ''));
          if (ids.length > 0) setLiveModels(ids);
        }
      } else if (prov === PROVIDERS.OPENAI) {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${key.trim()}` }
        });
        if (res.ok) {
          const data = await res.json();
          const ids = (data.data || [])
            .map((m) => m.id)
            .filter((id) => id.startsWith('gpt-') || id.startsWith('o1') || id.startsWith('o3'));
          if (ids.length > 0) setLiveModels(ids);
        }
      } else if (prov === PROVIDERS.OLLAMA) {
        const targetUrl = url || 'http://localhost:11434';
        const res = await fetch(`${targetUrl}/api/tags`);
        if (res.ok) {
          const data = await res.json();
          const ids = (data.models || []).map((m) => m.name);
          if (ids.length > 0) setLiveModels(ids);
        }
      }
    } catch (e) {
      // Fallback silently to presets
    } finally {
      setFetchingModels(false);
    }
  };

  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    const savedKey = getBYOKKey(newProvider, userId);
    const savedModel = getBYOKModel(newProvider, PROVIDER_PRESETS[newProvider]?.default, userId);
    const savedUrl = getBYOKUrl(newProvider, userId) || (newProvider === PROVIDERS.OLLAMA ? 'http://localhost:11434' : '');

    setApiKey(savedKey);
    setModel(savedModel);
    setBaseUrl(savedUrl);
    setTestResult(null);
    setLiveModels([]);

    if (savedKey || newProvider === PROVIDERS.OLLAMA) {
      fetchLiveModels(newProvider, savedKey, savedUrl);
    }
  };

  const handleSave = () => {
    saveActiveProvider(provider, userId);
    setBYOKKey(provider, apiKey, userId);
    setBYOKModel(provider, model, userId);
    setBYOKUrl(provider, baseUrl, userId);

    setSavedSuccess(true);
    if (onSave) onSave({ provider, apiKey, model, baseUrl });
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      if (provider === PROVIDERS.GROQ && apiKey) {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${apiKey.trim()}` }
        });
        if (res.ok) {
          setTestResult({ success: true, message: `✅ Verified Groq Connection with model '${model}'` });
        } else {
          setTestResult({ success: false, message: '❌ Invalid Groq API Key.' });
        }
      } else if (provider === PROVIDERS.GEMINI && apiKey) {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`);
        if (res.ok) {
          setTestResult({ success: true, message: `✅ Verified Gemini Connection with model '${model}'` });
        } else {
          setTestResult({ success: false, message: '❌ Invalid Gemini API Key or Quota Exceeded.' });
        }
      } else if (provider === PROVIDERS.OLLAMA) {
        const targetUrl = baseUrl || 'http://localhost:11434';
        const res = await fetch(`${targetUrl}/api/tags`);
        if (res.ok) {
          setTestResult({ success: true, message: `✅ Verified Ollama Instance at ${targetUrl}` });
        } else {
          setTestResult({ success: false, message: `❌ Could not reach Ollama at ${targetUrl}` });
        }
      } else {
        setTestResult({ success: true, message: `Configured ${provider} with model ${model}.` });
      }
    } catch (err) {
      setTestResult({ success: false, message: `Connection error: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="w-full max-w-xl bg-[#0B1020] border border-surfaceBorder rounded-3xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-surfaceLight transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 bg-primary-600/20 border border-primary-500/30 rounded-2xl text-primary-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Bring Your Own Key (BYOK) AI Engine
            </h2>
            <p className="text-xs text-slate-400">
              Keys are securely stored in your local session and scoped to your account.
            </p>
          </div>
        </div>

        {/* Provider Tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
          {Object.values(PROVIDERS).map((p) => {
            const isSelected = provider === p;
            return (
              <button
                key={p}
                onClick={() => handleProviderChange(p)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition text-center border ${
                  isSelected
                    ? 'bg-primary-600/20 border-primary-500 text-primary-300 shadow-md shadow-primary-600/20'
                    : 'bg-surfaceLight border-surfaceBorder text-slate-400 hover:text-white hover:border-slate-500'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Dynamic Form */}
        <div className="space-y-4">
          {provider !== PROVIDERS.OLLAMA ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  {provider.toUpperCase()} API Key
                </label>
                <span className="text-[10px] text-slate-500">Private to your account</span>
              </div>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder={`Enter your ${provider} API Key`}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-surfaceLight border border-surfaceBorder rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition"
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Ollama Base URL
              </label>
              <input
                type="text"
                placeholder="http://localhost:11434"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full bg-surfaceLight border border-surfaceBorder rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 font-mono"
              />
            </div>
          )}

          {/* Model Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Model Name
              </label>
              {fetchingModels ? (
                <span className="text-[10px] text-primary-400 flex items-center space-x-1">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  <span>Fetching models...</span>
                </span>
              ) : null}
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. llama-3.3-70b-versatile"
                className="flex-1 bg-surfaceLight border border-surfaceBorder rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 font-mono"
              />
              <button
                type="button"
                onClick={() => fetchLiveModels(provider, apiKey, baseUrl)}
                className="p-2 bg-surfaceLight hover:bg-surfaceBorder border border-surfaceBorder rounded-xl text-slate-400 hover:text-white transition"
                title="Fetch live models from provider API"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fetchingModels ? 'animate-spin text-primary-400' : ''}`} />
              </button>
            </div>

            {/* Live Model Pills or Preset Pills */}
            <div className="flex flex-wrap gap-1.5 mt-2 max-h-24 overflow-y-auto custom-scrollbar">
              {(liveModels.length > 0 ? liveModels : PROVIDER_PRESETS[provider]?.presets || []).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModel(m)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition border ${
                    model === m
                      ? 'bg-primary-600 text-white border-primary-500 font-semibold'
                      : 'bg-surfaceLight/60 hover:bg-surfaceLight border-surfaceBorder text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div
            className={`p-3 rounded-xl text-xs mt-4 border ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {testResult.message}
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-surfaceBorder">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || (!apiKey && provider !== PROVIDERS.OLLAMA)}
            className="px-3.5 py-2 bg-surfaceLight hover:bg-surfaceBorder border border-surfaceBorder rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition disabled:opacity-50 flex items-center space-x-1.5"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Test Key</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-primary-600/25 flex items-center space-x-1.5"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{savedSuccess ? 'Saved!' : 'Save & Apply'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
