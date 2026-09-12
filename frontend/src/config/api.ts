const LOCAL_API_BASE = 'http://localhost:8080/api';
const DEPLOYED_API_BASE = 'https://repodna-ai.onrender.com/api';

const isLocalBrowser = () => {
  if (typeof window === 'undefined') {
    return true;
  }

  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
};

export const API_BASE =
  import.meta.env.VITE_API_BASE || (isLocalBrowser() ? LOCAL_API_BASE : DEPLOYED_API_BASE);

export const AUTH_API_BASE = `${API_BASE}/auth`;
