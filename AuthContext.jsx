import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('classconnect_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('classconnect_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error('Failed to fetch user:', err);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = res.data;
      localStorage.setItem('classconnect_token', access_token);
      localStorage.setItem('classconnect_user', JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please verify credentials.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      await api.post('/auth/register', userData);
      // Automatically log in after registration
      return await login(userData.email, userData.password);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const switchQuickDemo = async (role) => {
    const demoCredentials = {
      student: { email: 'student@classconnect.ai', password: 'student123' },
      cr: { email: 'cr@classconnect.ai', password: 'cr123' },
      faculty: { email: 'faculty@classconnect.ai', password: 'faculty123' }
    };
    const creds = demoCredentials[role];
    if (creds) {
      return await login(creds.email, creds.password);
    }
  };

  const logout = () => {
    localStorage.removeItem('classconnect_token');
    localStorage.removeItem('classconnect_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        switchQuickDemo,
        isAuthenticated: !!token && !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
