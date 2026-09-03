import React, { useState, useEffect } from 'react';
import { Cpu, Lock, Mail, User, Loader2, ArrowRight, Github, CheckCircle2, ArrowLeft, ExternalLink, Key } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthAPI } from '../services/api';

export default function SignUpPage({ onNavigate }) {
  const { signup, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [signedUpEmail, setSignedUpEmail] = useState(null);

  // Server OAuth Config
  const [serverOAuthConfig, setServerOAuthConfig] = useState({ githubClientId: '', googleClientId: '' });
  const [configProvider, setConfigProvider] = useState(null);
  const [customClientId, setCustomClientId] = useState('');
  const [customClientSecret, setCustomClientSecret] = useState('');

  const [signedUpToken, setSignedUpToken] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      onNavigate('/workspace');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    AuthAPI.getOAuthConfig()
      .then((res) => {
        if (res?.data) {
          setServerOAuthConfig(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signup(email, username, password, fullName);
      setSignedUpEmail(email);
      if (res?.verificationToken) {
        setSignedUpToken(res.verificationToken);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubClick = () => {
    sessionStorage.setItem('oauth_active_provider', 'GITHUB');
    const clientId = serverOAuthConfig.githubClientId || localStorage.getItem('oauth_github_client_id') || import.meta.env.VITE_GITHUB_CLIENT_ID || '';
    if (clientId) {
      const redirectUri = encodeURIComponent(`${window.location.origin}/oauth/callback`);
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read:user,user:email&redirect_uri=${redirectUri}&state=GITHUB`;
    } else {
      setConfigProvider('GITHUB');
      setCustomClientId(localStorage.getItem('oauth_github_client_id') || '');
      setCustomClientSecret(localStorage.getItem('oauth_github_client_secret') || '');
    }
  };

  const handleGoogleClick = () => {
    sessionStorage.setItem('oauth_active_provider', 'GOOGLE');
    const clientId = serverOAuthConfig.googleClientId || localStorage.getItem('oauth_google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    if (clientId) {
      const redirectUri = encodeURIComponent(`${window.location.origin}/oauth/callback`);
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20profile%20email&access_type=offline&prompt=select_account&state=GOOGLE`;
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
      sessionStorage.setItem('oauth_active_provider', 'GITHUB');
      localStorage.setItem('oauth_github_client_id', customClientId.trim());
      if (customClientSecret.trim()) {
        localStorage.setItem('oauth_github_client_secret', customClientSecret.trim());
      }
      const redirectUri = encodeURIComponent(`${window.location.origin}/oauth/callback`);
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${customClientId.trim()}&scope=read:user,user:email&redirect_uri=${redirectUri}&state=GITHUB`;
    } else if (configProvider === 'GOOGLE') {
      sessionStorage.setItem('oauth_active_provider', 'GOOGLE');
      localStorage.setItem('oauth_google_client_id', customClientId.trim());
      if (customClientSecret.trim()) {
        localStorage.setItem('oauth_google_client_secret', customClientSecret.trim());
      }
      const redirectUri = encodeURIComponent(`${window.location.origin}/oauth/callback`);
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${customClientId.trim()}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20profile%20email&access_type=offline&prompt=select_account&state=GOOGLE`;
    }
  };

  return (
    <div className="min-h-screen bg-[#060912] text-slate-100 flex flex-col justify-center items-center p-4 relative font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Brand Link */}
      <button
        onClick={() => onNavigate('/')}
        className="flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition mb-8 group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition" />
        <span>Back to Home</span>
      </button>

      <div className="w-full max-w-md bg-[#0B1020] border border-surfaceBorder rounded-3xl shadow-2xl p-8 relative z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <div className="p-3 bg-primary-600/20 border border-primary-500/30 rounded-2xl text-primary-400 shadow-md shadow-primary-600/20">
            <Cpu className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {signedUpEmail
              ? 'Verify Your Email'
              : configProvider
              ? `Configure ${configProvider} OAuth`
              : 'Create Developer Account'}
          </h1>
          <p className="text-xs text-slate-400">
            {signedUpEmail
              ? 'Activation link dispatched'
              : 'Join the next-generation codebase intelligence platform'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs mb-4">
            {error}
          </div>
        )}

        {signedUpEmail ? (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-600/20 border border-primary-500/40 text-primary-400 flex items-center justify-center mx-auto shadow-lg shadow-primary-600/20">
              <Mail className="w-8 h-8 animate-pulse" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white tracking-tight">Check Your Email Inbox</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                We've sent a secure verification link to:
                <br />
                <strong className="text-primary-300 font-mono text-[13px] inline-block mt-1">{signedUpEmail}</strong>
              </p>
            </div>

            <div className="p-4 bg-surfaceLight/60 border border-surfaceBorder rounded-2xl text-left space-y-2 text-xs text-slate-300">
              <span className="font-bold text-white text-[11px] uppercase tracking-wider block">Important Next Step:</span>
              <p className="text-slate-400 text-[11.5px] leading-relaxed">
                You must click the link in the email to activate your account before you can log in.
              </p>
              <p className="text-slate-500 text-[10.5px]">
                (If you don't see it within a minute, please check your Spam / Promotions folder.)
              </p>
            </div>

            <div className="pt-2 flex flex-col space-y-2">
              <button
                onClick={() => onNavigate('/signin')}
                className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-primary-600/25 flex items-center justify-center space-x-1.5"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : configProvider ? (
          <form onSubmit={handleSaveAndRedirectOAuth} className="space-y-4 text-xs">
            <div className="p-3 bg-primary-900/20 border border-primary-500/30 rounded-xl text-primary-200 text-[11.5px] leading-relaxed flex items-start space-x-2">
              <Key className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
              <span>
                To redirect directly to <strong>{configProvider === 'GITHUB' ? 'GitHub.com' : 'Google.com'}</strong>, enter your OAuth App Client ID.
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
                className="w-full bg-surfaceLight border border-surfaceBorder rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 font-mono"
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
                className="w-full bg-surfaceLight border border-surfaceBorder rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 font-mono"
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
        ) : (
          <div className="space-y-4">
            {/* Social OAuth Buttons */}
            <div className="space-y-2.5">
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
              <span>or sign up with email</span>
              <div className="flex-1 h-px bg-surfaceBorder" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Alex Morgan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-surfaceLight border border-surfaceBorder rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="alex_dev"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-surfaceLight border border-surfaceBorder rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="alex@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surfaceLight border border-surfaceBorder rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="•••••••• (Min. 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surfaceLight border border-surfaceBorder rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-primary-600/25 flex items-center justify-center space-x-1.5 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Create Account & Verify</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-6">
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('/signin')}
                className="text-primary-400 hover:text-primary-300 font-semibold"
              >
                Sign in
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
