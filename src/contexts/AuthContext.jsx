import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import biService from '@/services/biService';

const AuthContext = createContext(null);

const unwrap = (res) => (res && res.data !== undefined ? res.data : res);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('authToken') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    let cancelled = false;
    if (!token) { setUser(null); setLoading(false); return undefined; }
    setLoading(true);
    biService.me()
      .then((res) => { if (!cancelled) setUser(unwrap(res)); })
      .catch(() => { if (!cancelled) { localStorage.removeItem('authToken'); setToken(null); setUser(null); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const login = useCallback(async (username, password) => {
    const data = unwrap(await biService.login({ username, password }));
    localStorage.setItem('authToken', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    token, user, loading,
    isAuthenticated: !!user,
    isAdmin: !!user && user.role === 'admin',
    login, logout,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
