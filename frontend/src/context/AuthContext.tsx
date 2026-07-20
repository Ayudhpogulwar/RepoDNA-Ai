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

const API_BASE = 'http://localhost:8080/api/auth';

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
          setUser(data);
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.warn('Backend offline, using simulated session.');
        // Simulated user session fallback
        setUser({ id: 1, username: 'dev_user', email: 'dev@codedna.ai', role: 'ROLE_USER' });
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
        setToken(data.token);
        setUser({ id: data.id, username: data.username, email: data.email, role: data.role });
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Backend login offline, simulating success.');
      // Simulate success for dev prototype ease of access
      const mockToken = 'mock_jwt_token_payload';
      localStorage.setItem('codedna_token', mockToken);
      setToken(mockToken);
      setUser({ id: 1, username, email: `${username}@codedna.ai`, role: 'ROLE_USER' });
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
        setToken(data.token);
        setUser({ id: data.id, username: data.username, email: data.email, role: data.role });
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Backend registration offline, simulating success.');
      const mockToken = 'mock_jwt_token_payload';
      localStorage.setItem('codedna_token', mockToken);
      setToken(mockToken);
      setUser({ id: 1, username, email, role: 'ROLE_USER' });
      return true;
    }
  };

  const logout = () => {
    localStorage.removeItem('codedna_token');
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
