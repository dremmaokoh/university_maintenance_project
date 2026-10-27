import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/authApi.js';

const AuthContext = createContext(null);
const TOKEN_KEY = 'um_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    authApi
      .getMe(token)
      .then((res) => {
        if (!cancelled) {
          setUser(res.data.user);
        }
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      setSession(nextToken, nextUser) {
        localStorage.setItem(TOKEN_KEY, nextToken);
        setToken(nextToken);
        setUser(nextUser);
      },
      async login(email, password) {
        const res = await authApi.login({ email, password });
        localStorage.setItem(TOKEN_KEY, res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return res.data.user;
      },
      async registerStudent(fullName, email, password) {
        const res = await authApi.registerStudent({ fullName, email, password });
        localStorage.setItem(TOKEN_KEY, res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return res.data.user;
      },
      async setupAdmin(fullName, email, password) {
        const res = await authApi.setupAdmin({ fullName, email, password });
        localStorage.setItem(TOKEN_KEY, res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return res.data.user;
      },
      logout() {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
