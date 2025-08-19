
//   // Register function must be inside AuthProvider to access setLoading
//   const register = async (email: string, password: string, name: string, role: 'host' | 'student'): Promise<boolean> => {
//     setLoading(true);
//     try {
//       const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
//       const res = await fetch(`${API_URL}/auth/register`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password, name, role })
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setLoading(false);
//         return true;
//       } else {
//         console.error('Registration error:', data.error);
//         setLoading(false);
//         return false;
//       }
//     } catch (error) {
//       console.error('Registration failed:', error);
//       setLoading(false);
//       return false;
//     }
//   };
// import React, { createContext, useContext, useState, useEffect } from 'react';


// interface User {
//   id: string;
//   email: string;
//   role: 'host' | 'student';
//   name: string;
//   address?: string;
//   graduation?: string;
// }

// interface AuthContextType {
//   user: User | null;
//   setUser: React.Dispatch<React.SetStateAction<User | null>>;
//   loading: boolean;
//   login: (email: string, password: string, role: 'host' | 'student') => Promise<boolean>;
//   logout: () => Promise<void>;
//   register: (email: string, password: string, name: string, role: 'host' | 'student') => Promise<boolean>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     setLoading(false);
//   }, []);

//   const login = async (email: string, password: string, role: 'host' | 'student'): Promise<boolean> => {
//     setLoading(true);
//     try {
//       const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
//       const res = await fetch(`${API_URL}/auth/login`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password, role })
//       });
//       const data = await res.json();
//       if (res.ok && data.user && data.user.role === role) {
//         const userObj = {
//           id: data.user.id || data.user._id || '',
//           email: data.user.email,
//           role: data.user.role,
//           name: data.user.name
//         };
//         setUser(userObj);
//         setLoading(false);
//         return true;
//       } else {
//         console.error('Login error:', data.error || 'Role mismatch');
//         setLoading(false);
//         return false;
//       }
//     } catch (error) {
//       console.error('Login failed:', error);
//       setLoading(false);
//       return false;
//     }
//   };

//   const register = async (email: string, password: string, name: string, role: 'host' | 'student'): Promise<boolean> => {
//     setLoading(true);
//     try {
//       const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
//       const res = await fetch(`${API_URL}/auth/register`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password, name, role })
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setLoading(false);
//         return true;
//       } else {
//         console.error('Registration error:', data.error);
//         setLoading(false);
//         return false;
//       }
//     } catch (error) {
//       console.error('Registration failed:', error);
//       setLoading(false);
//       return false;
//     }
//   };

//   const logout = async () => {
//     // TODO: Implement logout with backend
//     setUser(null);
//     setLoading(false);
//   };

//   return (
//     <AuthContext.Provider value={{ user, setUser, loading, login, logout, register }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };



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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // On initial load, mark loading as false (no persisted session handling yet)
    setLoading(false);
  }, []);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

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
        // Auto-login after successful registration
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
    // TODO: Implement backend logout if needed
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
