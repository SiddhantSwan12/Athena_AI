import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("athena_user") || "null");
    } catch {
      return null;
    }
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("athena_token");
    if (!token) {
      setReady(true);
      return;
    }
    authApi
      .me()
      .then((u) => {
        setUser(u);
        localStorage.setItem("athena_user", JSON.stringify(u));
      })
      .catch(() => {
        localStorage.removeItem("athena_token");
        localStorage.removeItem("athena_user");
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem("athena_token", data.access_token);
    localStorage.setItem("athena_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async ({ name, email, password }) => {
    const data = await authApi.signup({ name, email, password });
    localStorage.setItem("athena_token", data.access_token);
    localStorage.setItem("athena_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("athena_token");
    localStorage.removeItem("athena_user");
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, login, signup, logout }), [user, ready, login, signup, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
