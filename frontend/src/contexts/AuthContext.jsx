import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('architect_jwt_token'));
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await AuthAPI.getMe();
      setUser(res.data);
      localStorage.setItem('architect_user_profile', JSON.stringify(res.data));
    } catch (err) {
      console.warn("Failed to fetch user profile, clearing token:", err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('architect_jwt_token');
    const savedUser = localStorage.getItem('architect_user_profile');
    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          // ignore
        }
      }
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (emailOrUsername, password) => {
    const res = await AuthAPI.signIn({ emailOrUsername, password });
    const data = res.data;
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('architect_jwt_token', data.token);
    localStorage.setItem('architect_user_profile', JSON.stringify(data.user));
    return data;
  };

  const signup = async (email, username, password, fullName) => {
    const res = await AuthAPI.signUp({ email, username, password, fullName });
    return res.data;
  };

  const verifyEmail = async (verificationToken) => {
    const res = await AuthAPI.verifyEmail(verificationToken);
    const data = res.data;
    if (data.token) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('architect_jwt_token', data.token);
      localStorage.setItem('architect_user_profile', JSON.stringify(data.user));
    }
    return data;
  };

  const resendVerification = async (email) => {
    return await AuthAPI.resendVerification(email);
  };

  const exchangeOAuthCode = async (provider, code, redirectUri) => {
    let res;
    const clientId = localStorage.getItem(`oauth_${provider.toLowerCase()}_client_id`) || '';
    const clientSecret = localStorage.getItem(`oauth_${provider.toLowerCase()}_client_secret`) || '';

    if (provider === 'GITHUB') {
      res = await AuthAPI.oauthGithubCallback({ code, redirectUri, clientId, clientSecret });
    } else if (provider === 'GOOGLE') {
      res = await AuthAPI.oauthGoogleCallback({ code, redirectUri, clientId, clientSecret });
    }
    if (res?.data) {
      const data = res.data;
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('architect_jwt_token', data.token);
      localStorage.setItem('architect_user_profile', JSON.stringify(data.user));
      return data;
    }
  };

  const loginWithOAuth = async (provider, oauthData) => {
    let res;
    if (provider === 'GOOGLE') {
      res = await AuthAPI.oauthGoogle(oauthData);
    } else if (provider === 'GITHUB') {
      res = await AuthAPI.oauthGithub(oauthData);
    }
    if (res?.data) {
      const data = res.data;
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('architect_jwt_token', data.token);
      localStorage.setItem('architect_user_profile', JSON.stringify(data.user));
      return data;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('architect_jwt_token');
    localStorage.removeItem('architect_user_profile');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        verifyEmail,
        resendVerification,
        exchangeOAuthCode,
        loginWithOAuth,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
