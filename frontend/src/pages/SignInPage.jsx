import React, { useState, useEffect } from 'react';
import { Cpu, Lock, Mail, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SignInPage({ onNavigate }) {
  const { login, isAuthenticated } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isUnverified, setIsUnverified] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      onNavigate('/workspace');
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsUnverified(false);
    setLoading(true);

    try {
      await login(emailOrUsername, password);
      onNavigate('/workspace');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password';
      setError(msg);
      if (msg.toLowerCase().includes('not verified') || msg.toLowerCase().includes('activate')) {
        setIsUnverified(true);
      }
    } finally {
      setLoading(false);
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
            Sign in to Architect
          </h1>
          <p className="text-xs text-slate-400">
            Welcome back! Enter your developer credentials.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs mb-4 space-y-2">
            <p>{error}</p>
            {isUnverified && (
              <button
                onClick={() => onNavigate('/verify-email')}
                className="text-primary-400 hover:underline font-semibold text-[11.5px] block mt-1"
              >
                Go to Email Verification Page &rarr;
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Email or Username</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                autoFocus
                placeholder="developer@company.com"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
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
                placeholder="••••••••"
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
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('/signup')}
            className="text-primary-400 hover:text-primary-300 font-semibold"
          >
            Sign up free
          </button>
        </p>
      </div>
    </div>
  );
}
