"use client";

import { useEffect, useState } from "react";

import type { AdminStats, AdminUserRecord } from "@/lib/session-types";

type AdminState = {
  isLoading: boolean;
  error: string;
  stats: AdminStats | null;
  users: AdminUserRecord[];
  webhookUrl: string;
};

const EMPTY_ADMIN_STATE: AdminState = {
  isLoading: false,
  error: "",
  stats: null,
  users: [],
  webhookUrl: "",
};

async function readJson<T>(response: Response) {
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }

  return payload as T;
}

async function fetchAdminState(enabled: boolean): Promise<AdminState> {
  if (!enabled) {
    return EMPTY_ADMIN_STATE;
  }

  const [statsResponse, usersResponse, webhookResponse] = await Promise.all([
    fetch("/api/proxy/admin/stats", { cache: "no-store" }),
    fetch("/api/proxy/admin/users", { cache: "no-store" }),
    fetch("/api/proxy/webhooks", { cache: "no-store" }),
  ]);

  const stats = await readJson<AdminStats>(statsResponse);
  const users = await readJson<AdminUserRecord[]>(usersResponse);
  const webhook = await readJson<{ webhook_url?: string }>(webhookResponse);

  return {
    isLoading: false,
    error: "",
    stats,
    users,
    webhookUrl: webhook.webhook_url ?? "",
  };
}

export function useAdminData(enabled: boolean) {
  const [state, setState] = useState<AdminState>({
    ...EMPTY_ADMIN_STATE,
    isLoading: enabled,
  });

  async function load() {
    setState((current) => ({
      ...current,
      isLoading: enabled,
      error: "",
    }));

    try {
      setState(await fetchAdminState(enabled));
    } catch (loadError) {
      setState({
        isLoading: false,
        error:
          loadError instanceof Error
            ? loadError.message
            : "Unable to load admin data.",
        stats: null,
        users: [],
        webhookUrl: "",
      });
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadOnMount() {
      setState((current) => ({
        ...current,
        isLoading: enabled,
        error: "",
      }));

      try {
        const nextState = await fetchAdminState(enabled);

        if (!isMounted) {
          return;
        }

        setState(nextState);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setState({
          isLoading: false,
          error:
            loadError instanceof Error
              ? loadError.message
              : "Unable to load admin data.",
          stats: null,
          users: [],
          webhookUrl: "",
        });
      }
    }

    void loadOnMount();

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  async function saveWebhook(url: string) {
    const response = await fetch("/api/proxy/webhooks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    const payload = await readJson<{ webhook_url?: string }>(response);

    setState((current) => ({
      ...current,
      webhookUrl: payload.webhook_url ?? "",
    }));
  }

  async function promoteUser(userId: string) {
    const response = await fetch(`/api/proxy/admin/users/${userId}/promote`, {
      method: "POST",
    });

    await readJson<{ ok: boolean }>(response);
    await load();
  }

  async function deleteUser(userId: string) {
    const response = await fetch(`/api/proxy/admin/users/${userId}`, {
      method: "DELETE",
    });

    await readJson<{ ok: boolean }>(response);
    await load();
  }

  async function requestSelfPromote() {
    const response = await fetch("/api/proxy/auth/promote-self", {
      method: "POST",
    });

    await readJson<{ ok: boolean }>(response);
    await load();
  }

  return {
    ...state,
    refresh: load,
    saveWebhook,
    promoteUser,
    deleteUser,
    requestSelfPromote,
  };
}
