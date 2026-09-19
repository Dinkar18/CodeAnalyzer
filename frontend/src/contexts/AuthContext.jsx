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

  const logout = () => {
    setUser(null);
    setToken(null);
    // Securely clear all tokens, BYOK keys, and cached state
    try {
      localStorage.removeItem('architect_jwt_token');
      localStorage.removeItem('architect_user_profile');
      
      // Clean up all user-scoped and global BYOK keys
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('byok_') || key.startsWith('last_conv_') || key.startsWith('architect_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch (e) {
      console.warn("Error cleaning storage during logout:", e);
    }

    // Force redirection to home landing page
    window.location.href = '/';
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
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
