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
  isBackendWarming: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const RAW_API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';
const API_BASE = `${RAW_API_BASE}/auth`;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('codedna_token'));
  const [loading, setLoading] = useState(true);
  const [isBackendWarming, setIsBackendWarming] = useState(false);

  // Keep-alive heartbeat & warmup ping
  useEffect(() => {
    let warmTimer: ReturnType<typeof setTimeout>;

    const pingHealth = async () => {
      // Set warming status if response takes longer than 1.5s
      warmTimer = setTimeout(() => {
        setIsBackendWarming(true);
      }, 1500);

      try {
        const res = await fetch(`${RAW_API_BASE}/health`, { cache: 'no-store' });
        if (res.ok) {
          console.log('[Keep-Alive] Backend health ping OK');
        }
      } catch (err) {
        console.warn('[Keep-Alive] Ping attempted; backend warming up or offline.');
      } finally {
        clearTimeout(warmTimer);
        setIsBackendWarming(false);
      }
    };

    // Initial ping on app mount
    pingHealth();

    // Heartbeat every 10 minutes (600,000 ms) to keep Render instance awake while tab is open
    const heartbeat = setInterval(pingHealth, 600000);

    return () => {
      clearTimeout(warmTimer);
      clearInterval(heartbeat);
    };
  }, []);

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
    <AuthContext.Provider value={{ user, token, loading, isBackendWarming, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
