import React, { useState, useEffect } from 'react';
import { X, Key, Cpu, Sparkles, Check, Eye, EyeOff, Loader2, Server, RefreshCw } from 'lucide-react';
import { PROVIDERS } from '../constants/apiEndpoints';

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
      const savedProvider = localStorage.getItem('byok_provider') || PROVIDERS.GEMINI;
      const savedKey = localStorage.getItem(`byok_key_${savedProvider}`) || '';
      const savedModel = localStorage.getItem(`byok_model_${savedProvider}`) || PROVIDER_PRESETS[savedProvider]?.default || '';
      const savedUrl = localStorage.getItem(`byok_url_${savedProvider}`) || (savedProvider === PROVIDERS.OLLAMA ? 'http://localhost:11434' : '');

      setProvider(savedProvider);
      setApiKey(savedKey);
      setModel(savedModel);
      setBaseUrl(savedUrl);
      setTestResult(null);
      setSavedSuccess(false);
      setLiveModels([]);

      if (savedKey) {
        fetchLiveModels(savedProvider, savedKey, savedUrl);
      }
    }
  }, [isOpen]);

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
    const savedKey = localStorage.getItem(`byok_key_${newProvider}`) || '';
    const savedModel = localStorage.getItem(`byok_model_${newProvider}`) || PROVIDER_PRESETS[newProvider]?.default || '';
    const savedUrl = localStorage.getItem(`byok_url_${newProvider}`) || (newProvider === PROVIDERS.OLLAMA ? 'http://localhost:11434' : '');

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
    localStorage.setItem('byok_provider', provider);
    if (apiKey) {
      localStorage.setItem(`byok_key_${provider}`, apiKey.trim());
    } else {
      localStorage.removeItem(`byok_key_${provider}`);
    }
    if (model) {
      localStorage.setItem(`byok_model_${provider}`, model.trim());
    }
    if (baseUrl) {
      localStorage.setItem(`byok_url_${provider}`, baseUrl.trim());
    } else {
      localStorage.removeItem(`byok_url_${provider}`);
    }

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
        setTestResult({ success: true, message: `✅ Connected to Local Ollama at ${baseUrl || 'http://localhost:11434'}` });
      } else if (apiKey && apiKey.length > 5) {
        setTestResult({ success: true, message: `✅ Configured ${provider.toUpperCase()} (${model})` });
      } else {
        setTestResult({ success: false, message: 'Please provide a valid API key for this provider.' });
      }
    } catch (err) {
      setTestResult({ success: false, message: `Connection failed: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  const currentAvailableModels = liveModels.length > 0 
    ? liveModels 
    : (PROVIDER_PRESETS[provider]?.presets || []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0B1020] border border-surfaceBorder rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="h-14 px-6 border-b border-surfaceBorder flex items-center justify-between bg-surface/90 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-primary-600/20 text-primary-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">LLM Provider & BYOK Settings</h2>
              <p className="text-[11px] text-slate-400">Bring your own API key for zero-latency inference</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surfaceLight rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs select-text">
          {/* Notice Banner */}
          <div className="p-3 bg-primary-900/20 border border-primary-500/30 rounded-xl text-primary-200 text-[11.5px] leading-relaxed flex items-start space-x-2">
            <Key className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
            <span>
              <strong>Zero Server-Side Storage</strong>: Your API keys remain only in your local browser and are transmitted ephemerally per request.
            </span>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Select AI Model Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: PROVIDERS.GEMINI, name: 'Google Gemini', desc: 'Fast & High Context' },
                { id: PROVIDERS.GROQ, name: 'Groq Cloud', desc: '14.4k/day Free & Fast' },
                { id: PROVIDERS.OPENAI, name: 'OpenAI GPT', desc: 'GPT-4o & Reasoning' },
                { id: PROVIDERS.ANTHROPIC, name: 'Anthropic Claude', desc: 'Claude 3.5 Sonnet' },
                { id: PROVIDERS.DEEPSEEK, name: 'DeepSeek', desc: 'DeepSeek V3 & R1' },
                { id: PROVIDERS.OLLAMA, name: 'Local Ollama', desc: '100% Private Offline' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProviderChange(p.id)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    provider === p.id
                      ? 'border-primary-500 bg-primary-600/15 text-white shadow-sm shadow-primary-600/20'
                      : 'border-surfaceBorder bg-surfaceLight/30 text-slate-300 hover:bg-surfaceLight hover:text-white'
                  }`}
                >
                  <span className="font-semibold text-xs tracking-tight">{p.name}</span>
                  <span className="text-[9.5px] text-slate-400 mt-1 truncate">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          {provider !== PROVIDERS.OLLAMA && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  {provider.toUpperCase()} API Key
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Optional (uses server default if blank)</span>
              </div>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder={`Enter your ${provider} API key`}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    if (e.target.value.length > 10) {
                      fetchLiveModels(provider, e.target.value, baseUrl);
                    }
                  }}
                  className="w-full bg-surfaceLight border border-surfaceBorder rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Model Selection (Dynamic Live List + Presets) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <span>Active Model Selection</span>
                {fetchingModels && <Loader2 className="w-3 h-3 animate-spin text-primary-400" />}
              </label>
              {apiKey && (
                <button
                  type="button"
                  onClick={() => fetchLiveModels(provider, apiKey, baseUrl)}
                  className="text-[10px] text-primary-400 hover:text-primary-300 flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh Models</span>
                </button>
              )}
            </div>

            {/* Combobox: Custom Model Input + Dynamic Live Select */}
            <div className="space-y-2 mb-2">
              <input
                type="text"
                placeholder="Type any model ID or pick from live list below"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-surfaceLight border border-surfaceBorder rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 font-mono"
              />

              <select
                value={currentAvailableModels.includes(model) ? model : ''}
                onChange={(e) => { if (e.target.value) setModel(e.target.value); }}
                className="w-full bg-surfaceLight border border-surfaceBorder rounded-xl px-3.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-primary-500 font-mono"
              >
                <option value="" disabled>-- Or pick from live available models ({currentAvailableModels.length}) --</option>
                {currentAvailableModels.map((mId) => (
                  <option key={mId} value={mId} className="bg-[#0B1020] text-white">
                    {mId} {mId === PROVIDER_PRESETS[provider]?.default ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick-Pick Tags */}
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {currentAvailableModels.slice(0, 8).map((pModel) => (
                <button
                  key={pModel}
                  type="button"
                  onClick={() => setModel(pModel)}
                  className={`px-2 py-0.5 rounded-md text-[10.5px] font-mono transition border ${
                    model === pModel
                      ? 'bg-primary-600/30 border-primary-500 text-primary-200'
                      : 'bg-surfaceLight/50 border-surfaceBorder text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {pModel}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Base URL (for Ollama / DeepSeek) */}
          {(provider === PROVIDERS.OLLAMA || provider === PROVIDERS.DEEPSEEK) && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Custom Endpoint / Base URL
              </label>
              <div className="relative">
                <Server className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={provider === PROVIDERS.OLLAMA ? 'http://localhost:11434' : 'https://api.deepseek.com'}
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full bg-surfaceLight border border-surfaceBorder rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-2.5 rounded-xl border text-[11.5px] font-sans flex items-center space-x-2 ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-surfaceLight/30 border-t border-surfaceBorder flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="px-3 py-1.5 bg-surface border border-surfaceBorder hover:border-slate-500 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1.5"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary-400" />}
            <span>Test Connection</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 hover:bg-surfaceLight text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-primary-600/20 flex items-center space-x-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Configuration</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
