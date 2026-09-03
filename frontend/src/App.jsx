import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ProfilePage from './pages/ProfilePage';
import WorkspacePage from './pages/WorkspacePage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';

export default function App() {
  return (
    <AuthProvider>
      <RouterApp />
    </AuthProvider>
  );
}

function RouterApp() {
  const { exchangeOAuthCode, verifyEmail } = useAuth();
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');
  const [authNotification, setAuthNotification] = useState(null);

  // Navigate handler that updates browser history and local state
  const handleNavigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen to browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle OAuth Callbacks (/oauth/callback?code=...) or Email Verification links (?token=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthCode = params.get('code');
    const verifyToken = params.get('token');

    if (oauthCode) {
      const redirectUri = `${window.location.origin}/oauth/callback`;
      const rawState = params.get('state');
      const sessionProvider = sessionStorage.getItem('oauth_active_provider');
      const provider = (rawState && rawState.toUpperCase() === 'GOOGLE') || (sessionProvider === 'GOOGLE')
        ? 'GOOGLE'
        : 'GITHUB';

      // Clear session tracking
      sessionStorage.removeItem('oauth_active_provider');

      exchangeOAuthCode(provider, oauthCode, redirectUri)
        .then(() => {
          setAuthNotification({
            type: 'success',
            title: 'Welcome Back!',
            message: `Signed in successfully via ${provider === 'GOOGLE' ? 'Google' : 'GitHub'}.`
          });
          window.history.replaceState({}, '', '/workspace');
          setCurrentPath('/workspace');
        })
        .catch((err) => {
          setAuthNotification({
            type: 'error',
            title: 'OAuth Authentication Failed',
            message: err.response?.data?.message || err.message
          });
          window.history.replaceState({}, '', '/signin');
          setCurrentPath('/signin');
        });
    } else if (verifyToken && currentPath !== '/verify-email') {
      handleNavigate(`/verify-email?token=${encodeURIComponent(verifyToken)}`);
    }
  }, []);

  // Route Dispatcher
  const renderRoute = () => {
    if (currentPath === '/signin') {
      return <SignInPage onNavigate={handleNavigate} />;
    }
    if (currentPath === '/signup') {
      return <SignUpPage onNavigate={handleNavigate} />;
    }
    if (currentPath.startsWith('/verify-email')) {
      return <VerifyEmailPage onNavigate={handleNavigate} />;
    }
    if (currentPath === '/profile') {
      return <ProfilePage onNavigate={handleNavigate} />;
    }
    if (currentPath === '/workspace' || currentPath === '/app') {
      return <WorkspacePage onNavigate={handleNavigate} />;
    }
    if (currentPath.startsWith('/oauth/callback')) {
      return (
        <div className="min-h-screen bg-[#060912] flex flex-col items-center justify-center text-slate-200 font-sans space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
          <h2 className="text-base font-bold">Completing OAuth Sign In...</h2>
          <p className="text-xs text-slate-400">Exchanging credentials and initializing your workspace session.</p>
        </div>
      );
    }
    // Default Route: Modern Landing Page
    return <LandingPage onNavigate={handleNavigate} />;
  };

  return (
    <>
      {/* Toast Notification */}
      {authNotification && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top duration-200">
          <div
            className={`p-4 rounded-2xl border shadow-2xl flex items-start space-x-3 text-xs max-w-sm ${
              authNotification.type === 'success'
                ? 'bg-[#0B1712] border-emerald-500/40 text-emerald-200'
                : 'bg-[#1A0B10] border-rose-500/40 text-rose-200'
            }`}
          >
            {authNotification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="font-bold text-white text-xs">{authNotification.title}</h4>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{authNotification.message}</p>
            </div>
            <button
              onClick={() => setAuthNotification(null)}
              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {renderRoute()}
    </>
  );
}
