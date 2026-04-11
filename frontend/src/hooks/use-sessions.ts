"use client";

import { startTransition, useEffect, useState } from "react";

import type {
  FolderRecord,
  SessionRecord,
  SessionsResponse,
  TranslationResponse,
} from "@/lib/session-types";

type ApiError = {
  error?: string;
  ok?: boolean;
  share_url?: string | null;
  folder_id?: string;
};

async function readJson<T>(response: Response) {
  const payload = (await response.json()) as T & ApiError;

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }

  return payload as T;
}

export function useSessions() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSessions() {
    setError("");
    setIsLoading(true);

    try {
      const [sessionsResponse, foldersResponse] = await Promise.all([
        fetch("/api/proxy/v1/sessions?page=1&limit=100", { cache: "no-store" }),
        fetch("/api/proxy/folders", { cache: "no-store" }),
      ]);

      const sessionsPayload = await readJson<SessionsResponse>(sessionsResponse);
      const foldersPayload = foldersResponse.ok
        ? await readJson<FolderRecord[]>(foldersResponse)
        : [];

      startTransition(() => {
        setSessions(sessionsPayload.sessions ?? []);
        setFolders(Array.isArray(foldersPayload) ? foldersPayload : []);
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load sessions.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSessions();
  }, []);

  async function deleteSession(sessionId: string) {
    const response = await fetch(`/api/proxy/v1/sessions/${sessionId}`, {
      method: "DELETE",
    });

    await readJson<{ ok: boolean }>(response);

    setSessions((current) =>
      current.filter((session) => session.session_id !== sessionId),
    );
  }

  async function translateSession(sessionId: string, targetLang: string) {
    const response = await fetch(`/api/proxy/v1/sessions/${sessionId}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ target_lang: targetLang }),
    });

    const payload = await readJson<TranslationResponse>(response);

    setSessions((current) =>
      current.map((session) =>
        session.session_id === sessionId
          ? {
              ...session,
              [`translated_${targetLang}`]: payload.translated,
            }
          : session,
      ),
    );

    return payload;
  }

  async function assignFolder(sessionId: string, folderId: string) {
    const response = await fetch(`/api/proxy/sessions/${sessionId}/folder`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ folder_id: folderId }),
    });

    await readJson<{ ok: boolean }>(response);

    setSessions((current) =>
      current.map((session) =>
        session.session_id === sessionId
          ? {
              ...session,
              folder_id: folderId || undefined,
            }
          : session,
      ),
    );
  }

  async function createFolder(name: string, color: string) {
    const response = await fetch("/api/proxy/folders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, color }),
    });

    const folder = await readJson<FolderRecord>(response);
    setFolders((current) => [...current, folder]);
    return folder;
  }

  async function toggleShare(sessionId: string, enable: boolean) {
    const response = await fetch(`/api/proxy/sessions/${sessionId}/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ enable }),
    });

    const payload = await readJson<{ ok: boolean; share_url?: string | null }>(
      response,
    );

    setSessions((current) =>
      current.map((session) =>
        session.session_id === sessionId
          ? {
              ...session,
              is_public: enable,
              share_token:
                enable && payload.share_url
                  ? payload.share_url.split("/").pop()
                  : undefined,
            }
          : session,
      ),
    );

    return payload.share_url ?? null;
  }

  return {
    sessions,
    folders,
    isLoading,
    error,
    refresh: loadSessions,
    deleteSession,
    translateSession,
    assignFolder,
    createFolder,
    toggleShare,
  };
}
