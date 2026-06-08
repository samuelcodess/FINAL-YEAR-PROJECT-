import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import axios from "axios";

import { api, registerUnauthorizedHandler, setApiToken } from "../lib/api";
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

function decodeJwtPayload(token: string) {
  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(window.atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
}

function isTokenExpired(token: string) {
  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    return false;
  }

  return payload.exp * 1000 <= Date.now();
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function clearSession() {
    setSession(null);
    setApiToken(null);
    window.localStorage.removeItem(storageKey);
  }

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);

    if (!stored) {
      setIsLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as AuthSession;

      if (isTokenExpired(parsed.token)) {
        clearSession();
        setIsLoading(false);
        return;
      }

      setSession(parsed);
      setApiToken(parsed.token);

      void api.get("/auth/me").catch((error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          clearSession();
        }
      });
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      clearSession();
    });

    return () => {
      registerUnauthorizedHandler(null);
    };
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
    clearSession();
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
