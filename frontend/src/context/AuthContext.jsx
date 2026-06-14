import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Validate session on app boot
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (error) {
          console.error('Session validation failed, logging out:', error);
          logout();
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, [token]);

  const login = async (loginIdentifier, password) => {
    try {
      const res = await api.post('/auth/login', { loginIdentifier, password });
      const { token: receivedToken, user: receivedUser } = res.data;
      
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true };
    } catch (error) {
      console.error('Login action error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed. Please check your credentials.' 
      };
    }
  };

  const register = async (username, email, password, role) => {
    try {
      const res = await api.post('/auth/register', { username, email, password, role });
      const { token: receivedToken, user: receivedUser } = res.data;
      
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true };
    } catch (error) {
      console.error('Registration action error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!user }}>
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
