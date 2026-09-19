import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, AlertCircle, Loader2, ArrowRight, Mail, ArrowLeft, Key } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function VerifyEmailPage({ onNavigate }) {
  const { verifyEmail, resendVerification } = useAuth();
  const [status, setStatus] = useState('PROMPT'); // 'PROMPT' | 'VERIFYING' | 'SUCCESS' | 'ERROR'
  const [errorMessage, setErrorMessage] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      setTokenInput(token);
      performVerification(token);
    } else {
      setStatus('PROMPT');
    }
  }, []);

  const performVerification = (tokenToVerify) => {
    setStatus('VERIFYING');
    setErrorMessage('');

    verifyEmail(tokenToVerify)
      .then(() => {
        setStatus('SUCCESS');
      })
      .catch((err) => {
        setStatus('ERROR');
        setErrorMessage(err.response?.data?.message || err.message || 'Verification token is invalid or has expired.');
      });
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    performVerification(tokenInput.trim());
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    try {
      await resendVerification(resendEmail.trim());
      setResendStatus('Verification link resent successfully! Check your inbox.');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to resend verification email.');
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

      <div className="w-full max-w-md bg-[#0B1020] border border-surfaceBorder rounded-3xl shadow-2xl p-8 relative z-10 animate-in fade-in zoom-in-95 duration-150 text-center">
        {status === 'PROMPT' && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-600/20 border border-primary-500/30 text-primary-400 flex items-center justify-center mx-auto">
              <Key className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-white">Account Activation</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Enter your verification token to activate your account.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-3 pt-2 text-left">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Security Token / Code</label>
                <input
                  type="text"
                  required
                  placeholder="Paste your activation token"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full bg-surfaceLight border border-surfaceBorder rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={!tokenInput.trim()}
                className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-primary-600/25 flex items-center justify-center space-x-1.5"
              >
                <span>Verify & Activate Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {status === 'VERIFYING' && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-600/20 border border-primary-500/30 text-primary-400 flex items-center justify-center mx-auto">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-white">Verifying Your Email...</h1>
            <p className="text-xs text-slate-400">
              Validating your security token with the enterprise directory.
            </p>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 animate-in zoom-in-50 duration-200" />
            </div>
            <h1 className="text-xl font-bold text-white">Email Verified Successfully!</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your account is now fully activated with full access to the AI Codebase Architect workspace.
            </p>

            <button
              onClick={() => onNavigate('/workspace')}
              className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-primary-600/25 flex items-center justify-center space-x-1.5 mt-4"
            >
              <span>Launch AI Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {status === 'ERROR' && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-white">Verification Failed</h1>
            <p className="text-xs text-rose-300 leading-relaxed">
              {errorMessage}
            </p>

            {resendStatus ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs mt-4">
                {resendStatus}
              </div>
            ) : (
              <form onSubmit={handleResend} className="pt-2 text-left space-y-2">
                <label className="block text-[11px] font-semibold text-slate-400">
                  Request New Verification Link
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full bg-surfaceLight border border-surfaceBorder rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-primary-600/20 mt-1"
                >
                  Resend Link
                </button>
              </form>
            )}

            <div className="pt-4 border-t border-surfaceBorder/60">
              <button
                onClick={() => onNavigate('/signin')}
                className="text-xs text-slate-400 hover:text-white transition"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
