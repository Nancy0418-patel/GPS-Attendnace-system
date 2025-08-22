

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  role: 'host' | 'student';
  name: string;
  address?: string;
  graduation?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  login: (email: string, password: string, role: 'host' | 'student') => Promise<boolean>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, role: 'host' | 'student') => Promise<boolean>;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  // Don't auto-restore session on mount - always start at login
  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, role: 'host' | 'student'): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });

      const data = await res.json();
      if (res.ok && data.user && data.user.role === role) {
        const userObj: User = {
          id: data.user.id || data.user._id || '',
          email: data.user.email,
          role: data.user.role,
          name: data.user.name,
          address: data.user.address,
          graduation: data.user.graduation
        };
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        setUser(userObj);
        setLoading(false);
        return true;
      } else {
        console.error('Login error:', data.error || 'Role mismatch');
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string, role: 'host' | 'student'): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role })
      });

      const data = await res.json();
      if (res.ok) {
        const loginSuccess = await login(email, password, role);
        setLoading(false);
        return loginSuccess;
      } else {
        alert(data.error || "Registration failed. Please try again.");
        setLoading(false);
        return false;
      }
    } catch (error) {
      alert("Registration failed. Please try again.");
      setLoading(false);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    localStorage.removeItem('token');
    setUser(null);
    setLoading(false);
  };

  const clearSession = (): void => {
    localStorage.removeItem('token');
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, register, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
};


