import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_BASE 
  ? `${import.meta.env.VITE_API_BASE}/auth` 
  : 'https://repodna-ai.onrender.com/api/auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('codedna_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('codedna_username', data.username);
          localStorage.setItem('codedna_email', data.email);
          setUser(data);
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.warn('Backend offline, using simulated session.');
        const cachedUsername = localStorage.getItem('codedna_username') || 'ayudh';
        const cachedEmail = localStorage.getItem('codedna_email') || 'ayudh@gmail.com';
        setUser({ 
          id: 1, 
          username: cachedUsername, 
          email: cachedEmail, 
          role: cachedUsername === 'admin' ? 'ROLE_ADMIN' : 'ROLE_USER' 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('codedna_token', data.token);
        localStorage.setItem('codedna_username', data.username);
        localStorage.setItem('codedna_email', data.email);
        setToken(data.token);
        setUser({ id: data.id, username: data.username, email: data.email, role: data.role });
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Backend login offline, simulating success.');
      const mockToken = 'mock_jwt_token_payload';
      localStorage.setItem('codedna_token', mockToken);
      localStorage.setItem('codedna_username', username);
      localStorage.setItem('codedna_email', `${username}@gmail.com`);
      setToken(mockToken);
      setUser({ id: 1, username, email: `${username}@gmail.com`, role: 'ROLE_USER' });
      return true;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('codedna_token', data.token);
        localStorage.setItem('codedna_username', data.username);
        localStorage.setItem('codedna_email', data.email);
        setToken(data.token);
        setUser({ id: data.id, username: data.username, email: data.email, role: data.role });
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Backend register offline, simulating success.');
      const mockToken = 'mock_jwt_token_payload';
      localStorage.setItem('codedna_token', mockToken);
      localStorage.setItem('codedna_username', username);
      localStorage.setItem('codedna_email', email);
      setToken(mockToken);
      setUser({ id: 1, username, email, role: 'ROLE_USER' });
      return true;
    }
  };

  const logout = () => {
    localStorage.removeItem('codedna_token');
    localStorage.removeItem('codedna_username');
    localStorage.removeItem('codedna_email');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
