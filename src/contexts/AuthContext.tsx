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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore user from localStorage if present
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, role: 'host' | 'student'): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.user && data.user.role === role) {
        const userObj = {
          id: data.user.id || data.user._id || '',
          email: data.user.email,
          role: data.user.role,
          name: data.user.name
        };
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
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
      const res = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role })
      });
      const data = await res.json();
      if (res.ok) {
        setLoading(false);
        return true;
      } else {
        console.error('Registration error:', data.error);
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Registration failed:', error);
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    // TODO: Implement logout with backend
    setUser(null);
    localStorage.removeItem('user');
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};