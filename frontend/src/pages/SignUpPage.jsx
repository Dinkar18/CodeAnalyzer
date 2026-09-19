import React, { useState, useEffect } from 'react';
import { Cpu, Lock, Mail, User, Loader2, ArrowRight, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SignUpPage({ onNavigate }) {
  const { signup, resendVerification, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Verification State
  const [registeredEmail, setRegisteredEmail] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      onNavigate('/workspace');
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signup(email, username, password, fullName);
      setRegisteredEmail(email);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    setResendLoading(true);
    setResendStatus(null);
    setError(null);

    try {
      await resendVerification(registeredEmail);
      setResendStatus('Verification email resent successfully! Please check your inbox.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to resend verification email.');
    } finally {
      setResendLoading(false);
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
            {registeredEmail ? 'Verify Your Email' : 'Create Developer Account'}
          </h1>
          <p className="text-xs text-slate-400">
            {registeredEmail
              ? 'Activation link dispatched'
              : 'Join the next-generation codebase intelligence platform'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs mb-4">
            {error}
          </div>
        )}

        {registeredEmail ? (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-600/20 border border-primary-500/40 text-primary-400 flex items-center justify-center mx-auto shadow-lg shadow-primary-600/20">
              <Mail className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white">Check Your Email Inbox</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                We've sent a secure verification link to:
                <br />
                <strong className="text-primary-300 font-mono text-[13px] inline-block mt-1">{registeredEmail}</strong>
              </p>
            </div>

            <div className="p-4 bg-surfaceLight/60 border border-surfaceBorder rounded-2xl text-left space-y-2 text-xs text-slate-300">
              <span className="font-bold text-white text-[11px] uppercase tracking-wider block">Verification Required:</span>
              <p className="text-slate-400 text-[11.5px] leading-relaxed">
                You must click the link in your email to activate your account before you can sign in.
              </p>
              <p className="text-slate-500 text-[10.5px]">
                (If you don't see the email within 1-2 minutes, please check your Spam / Promotions folder.)
              </p>
            </div>

            {resendStatus && (
              <p className="text-[11.5px] text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl">
                {resendStatus}
              </p>
            )}

            <div className="pt-2 flex flex-col space-y-2.5">
              <button
                onClick={() => onNavigate('/signin')}
                className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-primary-600/25 flex items-center justify-center space-x-1.5"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="w-full py-2.5 bg-surfaceLight hover:bg-surfaceBorder border border-surfaceBorder text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5"
              >
                {resendLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Resend Verification Email</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Dinkar Arya"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-surfaceLight border border-surfaceBorder rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Username</label>
              <div className="relative">
                <span className="text-slate-500 font-mono absolute left-3.5 top-2.5 text-xs">@</span>
                <input
                  type="text"
                  required
                  placeholder="dinkar_dev"
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
                  placeholder="dinkar@company.com"
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
                  placeholder="At least 6 characters"
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
              <span>Create Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {!registeredEmail && (
          <p className="text-center text-xs text-slate-400 mt-6">
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('/signin')}
              className="text-primary-400 hover:text-primary-300 font-semibold"
            >
              Sign In
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
