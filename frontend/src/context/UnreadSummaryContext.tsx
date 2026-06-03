import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { useAuth } from "./AuthContext";
import { api } from "../lib/api";

type UnreadSummary = {
  total: number;
  general: number;
  task: number;
  recommendation: number;
  evaluation: number;
  security: number;
};

type UnreadSummaryContextValue = {
  summary: UnreadSummary;
  refreshSummary: () => Promise<void>;
};

const emptySummary: UnreadSummary = {
  total: 0,
  general: 0,
  task: 0,
  recommendation: 0,
  evaluation: 0,
  security: 0
};

const UnreadSummaryContext = createContext<UnreadSummaryContextValue | undefined>(undefined);

export function UnreadSummaryProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [summary, setSummary] = useState<UnreadSummary>(emptySummary);

  const refreshSummary = useCallback(async () => {
    if (!session) {
      setSummary(emptySummary);
      return;
    }

    const response = await api.get<UnreadSummary>("/notifications/summary");
    setSummary(response.data);
  }, [session]);

  useEffect(() => {
    if (!session) {
      setSummary(emptySummary);
      return;
    }

    void refreshSummary();
    const interval = window.setInterval(() => {
      void refreshSummary();
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [refreshSummary, session]);

  const value = useMemo(
    () => ({
      summary,
      refreshSummary
    }),
    [refreshSummary, summary]
  );

  return <UnreadSummaryContext.Provider value={value}>{children}</UnreadSummaryContext.Provider>;
}

export function useUnreadSummary() {
  const context = useContext(UnreadSummaryContext);

  if (!context) {
    throw new Error("useUnreadSummary must be used within UnreadSummaryProvider.");
  }

  return context;
}
