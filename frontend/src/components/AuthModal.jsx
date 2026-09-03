import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, Loader2, ShieldCheck, Github, CheckCircle2, Send, ArrowRight, ExternalLink, ArrowLeft, Key, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthAPI } from '../services/api';

export default function AuthModal({ isOpen, onClose }) {
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [signedUpEmail, setSignedUpEmail] = useState(null);

  // Server OAuth Config
  const [serverOAuthConfig, setServerOAuthConfig] = useState({ githubClientId: '', googleClientId: '' });
  const [configProvider, setConfigProvider] = useState(null); // 'GITHUB' | 'GOOGLE'
  const [customClientId, setCustomClientId] = useState('');
  const [customClientSecret, setCustomClientSecret] = useState('');

  useEffect(() => {
    if (isOpen) {
      AuthAPI.getOAuthConfig()
        .then((res) => {
          if (res?.data) {
            setServerOAuthConfig(res.data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await signup(email, username, password, fullName);
        setSignedUpEmail(email);
      } else {
        await login(email, password);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubClick = () => {
    const clientId = serverOAuthConfig.githubClientId || localStorage.getItem('oauth_github_client_id') || import.meta.env.VITE_GITHUB_CLIENT_ID || '';
    if (clientId) {
      const redirectUri = encodeURIComponent(`${window.location.origin}/oauth/callback`);
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read:user,user:email&redirect_uri=${redirectUri}`;
    } else {
      setConfigProvider('GITHUB');
      setCustomClientId(localStorage.getItem('oauth_github_client_id') || '');
      setCustomClientSecret(localStorage.getItem('oauth_github_client_secret') || '');
    }
  };

  const handleGoogleClick = () => {
    const clientId = serverOAuthConfig.googleClientId || localStorage.getItem('oauth_google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    if (clientId) {
      const redirectUri = encodeURIComponent(`${window.location.origin}/oauth/callback`);
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20profile%20email&access_type=offline&prompt=select_account`;
    } else {
      setConfigProvider('GOOGLE');
      setCustomClientId(localStorage.getItem('oauth_google_client_id') || '');
      setCustomClientSecret(localStorage.getItem('oauth_google_client_secret') || '');
    }
  };

  const handleSaveAndRedirectOAuth = (e) => {
    e.preventDefault();
    if (!customClientId.trim()) return;

    if (configProvider === 'GITHUB') {
      localStorage.setItem('oauth_github_client_id', customClientId.trim());
      if (customClientSecret.trim()) {
        localStorage.setItem('oauth_github_client_secret', customClientSecret.trim());
      }
      const redirectUri = encodeURIComponent(`${window.location.origin}/oauth/callback`);
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${customClientId.trim()}&scope=read:user,user:email&redirect_uri=${redirectUri}`;
    } else if (configProvider === 'GOOGLE') {
      localStorage.setItem('oauth_google_client_id', customClientId.trim());
      if (customClientSecret.trim()) {
        localStorage.setItem('oauth_google_client_secret', customClientSecret.trim());
      }
      const redirectUri = encodeURIComponent(`${window.location.origin}/oauth/callback`);
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${customClientId.trim()}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20profile%20email&access_type=offline&prompt=select_account`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0B1020] border border-surfaceBorder rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="h-14 px-6 border-b border-surfaceBorder flex items-center justify-between bg-surface/90 shrink-0">
          <div className="flex items-center space-x-2.5">
            {configProvider ? (
              <button
                onClick={() => setConfigProvider(null)}
                className="p-1.5 hover:bg-surfaceLight rounded-lg text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="p-2 rounded-lg bg-primary-600/20 text-primary-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold text-white">
                {configProvider
                  ? `Configure ${configProvider === 'GITHUB' ? 'GitHub' : 'Google'} OAuth`
                  : signedUpEmail
                  ? 'Verify Your Email'
                  : isSignUp
                  ? 'Create Developer Account'
                  : 'Sign in to Codebase Architect'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {configProvider
                  ? 'Redirects directly to official OAuth login'
                  : signedUpEmail
                  ? 'Activation link dispatched'
                  : 'Enterprise developer authentication'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surfaceLight rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* OAuth App Configuration Sub-view (if not set in env) */}
        {configProvider ? (
          <form onSubmit={handleSaveAndRedirectOAuth} className="p-6 space-y-4 text-xs">
            <div className="p-3 bg-primary-900/20 border border-primary-500/30 rounded-xl text-primary-200 text-[11.5px] leading-relaxed flex items-start space-x-2">
              <Key className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
              <span>
                To redirect to <strong>{configProvider === 'GITHUB' ? 'GitHub.com' : 'Google.com'}</strong>, enter your OAuth App Client ID.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  {configProvider} Client ID
                </label>
                <a
                  href={configProvider === 'GITHUB' ? 'https://github.com/settings/developers' : 'https://console.cloud.google.com/apis/credentials'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-primary-400 hover:underline flex items-center space-x-1"
                >
                  <span>Get from {configProvider}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <input
                type="text"
                required
                autoFocus
                placeholder={`Enter your ${configProvider} Client ID`}
                value={customClientId}
                onChange={(e) => setCustomClientId(e.target.value)}
                className="w-full bg-surfaceLight border border-surfaceBorder rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  {configProvider} Client Secret
                </label>
                <span className="text-[10px] text-slate-500">For token exchange</span>
              </div>
              <input
                type="password"
                placeholder={`Enter your ${configProvider} Client Secret`}
                value={customClientSecret}
                onChange={(e) => setCustomClientSecret(e.target.value)}
                className="w-full bg-surfaceLight border border-surfaceBorder rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 font-mono"
              />
            </div>

            <div className="pt-2 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setConfigProvider(null)}
                className="flex-1 py-2.5 bg-surfaceLight hover:bg-surfaceBorder text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!customClientId.trim()}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-primary-600/25 flex items-center justify-center space-x-1.5"
              >
                <span>Authorize with {configProvider === 'GITHUB' ? 'GitHub' : 'Google'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        ) : signedUpEmail ? (
          /* Email Verification Sent Screen */
          <div className="p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary-600/20 border border-primary-500/40 text-primary-400 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-white">Verification Link Sent!</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              We have dispatched a verification email to:
              <br />
              <strong className="text-primary-300 font-mono text-[12.5px]">{signedUpEmail}</strong>
            </p>

            <div className="p-3 bg-surfaceLight/50 border border-surfaceBorder rounded-xl text-left space-y-1 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Next Steps:</span>
              <p>1. Open your inbox and click the verification link.</p>
              <p>2. Your account will be activated with full workspace access.</p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-primary-600/25 mt-2"
            >
              Done / Got It
            </button>
          </div>
        ) : (
          <>
            {/* Tab Switcher */}
            <div className="flex border-b border-surfaceBorder bg-surfaceLight/30 text-xs font-semibold">
              <button
                onClick={() => { setIsSignUp(false); setError(null); }}
                className={`flex-1 py-3 text-center transition ${
                  !isSignUp
                    ? 'text-primary-300 border-b-2 border-primary-500 bg-primary-600/10'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setIsSignUp(true); setError(null); }}
                className={`flex-1 py-3 text-center transition ${
                  isSignUp
                    ? 'text-primary-300 border-b-2 border-primary-500 bg-primary-600/10'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                  {error}
                </div>
              )}

              {/* Direct Official OAuth Redirect Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleGoogleClick}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-surfaceLight hover:bg-surfaceBorder border border-surfaceBorder hover:border-slate-500 rounded-xl text-xs font-semibold text-slate-200 hover:text-white transition flex items-center justify-center space-x-2.5 shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"/>
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                    <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.6 6.4C.6 8.3 0 10.5 0 12s.6 3.7 1.6 5.6l3.7-2.9z"/>
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <button
                  onClick={handleGitHubClick}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#161B22] hover:bg-[#21262D] border border-surfaceBorder hover:border-slate-500 rounded-xl text-xs font-semibold text-white transition flex items-center justify-center space-x-2.5 shadow-sm"
                >
                  <Github className="w-4 h-4" />
                  <span>Continue with GitHub</span>
                </button>
              </div>

              <div className="flex items-center space-x-3 text-slate-500 text-[11px]">
                <div className="flex-1 h-px bg-surfaceBorder" />
                <span>or continue with email</span>
                <div className="flex-1 h-px bg-surfaceBorder" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {isSignUp && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="Alex Morgan"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-surfaceLight border border-surfaceBorder rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>
                )}

                {isSignUp && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Username</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="alex_dev"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-surfaceLight border border-surfaceBorder rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="alex@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-surfaceLight border border-surfaceBorder rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-surfaceLight border border-surfaceBorder rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5 shadow-lg shadow-primary-600/25 mt-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{isSignUp ? 'Create Account & Send Verification' : 'Sign In'}</span>
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
