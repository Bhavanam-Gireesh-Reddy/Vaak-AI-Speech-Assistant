"use client";

import { useEffect, useState } from "react";

import type { SessionRecord, SessionsResponse } from "@/lib/session-types";

type DashboardState = {
  isLoading: boolean;
  error: string;
  stats: SessionRecord[];
  recentSessions: SessionRecord[];
};

async function readJson<T>(response: Response) {
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }

  return payload as T;
}

export function useDashboardData() {
  const [state, setState] = useState<DashboardState>({
    isLoading: true,
    error: "",
    stats: [],
    recentSessions: [],
  });

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [statsResponse, sessionsResponse] = await Promise.all([
          fetch("/api/proxy/v1/stats", { cache: "no-store" }),
          fetch("/api/proxy/v1/sessions?page=1&limit=8", { cache: "no-store" }),
        ]);

        const stats = await readJson<SessionRecord[]>(statsResponse);
        const sessions = await readJson<SessionsResponse>(sessionsResponse);

        if (!isMounted) {
          return;
        }

        setState({
          isLoading: false,
          error: "",
          stats,
          recentSessions: sessions.sessions ?? [],
        });
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setState({
          isLoading: false,
          error:
            loadError instanceof Error
              ? loadError.message
              : "Unable to load dashboard data.",
          stats: [],
          recentSessions: [],
        });
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
