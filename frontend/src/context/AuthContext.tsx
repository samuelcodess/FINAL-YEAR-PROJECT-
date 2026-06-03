import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";

import { api, setApiToken } from "../lib/api";
import type { AuthSession } from "../lib/types";

type AuthContextValue = {
  session: AuthSession | null;
  login: (email: string, password: string) => Promise<void>;
  acceptSession: (session: AuthSession) => void;
  logout: () => void;
  isLoading: boolean;
};

const storageKey = "performai-session";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as AuthSession;
      setSession(parsed);
      setApiToken(parsed.token);
    }

    setIsLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const response = await api.post<AuthSession>("/auth/login", { email, password });
    acceptSession(response.data);
  }

  function acceptSession(nextSession: AuthSession) {
    setSession(nextSession);
    setApiToken(nextSession.token);
    window.localStorage.setItem(storageKey, JSON.stringify(nextSession));
  }

  function logout() {
    setSession(null);
    setApiToken(null);
    window.localStorage.removeItem(storageKey);
  }

  const value = useMemo(
    () => ({
      session,
      login,
      acceptSession,
      logout,
      isLoading
    }),
    [isLoading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
