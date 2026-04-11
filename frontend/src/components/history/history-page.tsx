"use client";

import {
  Copy,
  FolderOpen,
  Languages,
  Link2,
  Mail,
  Search,
  Share2,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";

import { useSessions } from "@/hooks/use-sessions";
import type { SessionRecord } from "@/lib/session-types";
import {
  FOLDER_COLORS,
  downloadTextFile,
  getDurationLabel,
  getLanguageLabel,
  getModeLabel,
  getPrimaryTranscript,
  getSessionDateLabel,
  getTranscriptForType,
} from "@/lib/session-utils";

const TRANSLATION_OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "kn", label: "Kannada" },
  { value: "ml", label: "Malayalam" },
];

export function HistoryPage() {
  const {
    sessions,
    folders,
    isLoading,
    error,
    refresh,
    deleteSession,
    translateSession,
    assignFolder,
    createFolder,
    toggleShare,
  } = useSessions();
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [folderFilter, setFolderFilter] = useState("all");
  const [expandedId, setExpandedId] = useState("");
  const [translatingId, setTranslatingId] = useState("");
  const [translationChoice, setTranslationChoice] = useState("en");
  const [toast, setToast] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(""), 2500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const languages = Array.from(
    new Set(sessions.map((session) => session.language).filter(Boolean)),
  ) as string[];

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = deferredSearch
      ? [
          session.title,
          session.summary,
          session.notes,
          session.transcript,
          session.corrected_transcript,
          session.filtered_transcript,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(deferredSearch),
          )
      : true;
    const matchesMode =
      modeFilter === "all" ? true : (session.mode ?? "unknown") === modeFilter;
    const matchesLanguage =
      languageFilter === "all"
        ? true
        : (session.language ?? "unknown") === languageFilter;
    const matchesFolder =
      folderFilter === "all"
        ? true
        : folderFilter === "unfiled"
          ? !session.folder_id
          : session.folder_id === folderFilter;

    return matchesSearch && matchesMode && matchesLanguage && matchesFolder;
  });

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setToast("Transcript copied.");
  }

  async function handleDelete(session: SessionRecord) {
    const confirmed = window.confirm(
      `Delete "${session.title || "this session"}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    await deleteSession(session.session_id);
    setToast("Session deleted.");
  }

  async function handleTranslate(session: SessionRecord) {
    setTranslatingId(session.session_id);

    try {
      await translateSession(session.session_id, translationChoice);
      setToast(`Translated to ${translationChoice.toUpperCase()}.`);
    } finally {
      setTranslatingId("");
    }
  }

  async function handleCreateFolder(session: SessionRecord) {
    const name = window.prompt("Folder name");

    if (!name?.trim()) {
      return;
    }

    const color = FOLDER_COLORS[folders.length % FOLDER_COLORS.length];
    const folder = await createFolder(name.trim(), color);
    await assignFolder(session.session_id, folder.folder_id);
    setToast("Folder created and assigned.");
  }

  async function handleToggleShare(session: SessionRecord) {
    const sharePath = await toggleShare(
      session.session_id,
      !(session.is_public ?? false),
    );

    if (sharePath) {
      const shareUrl = `${window.location.origin}${sharePath}`;
      await navigator.clipboard.writeText(shareUrl);
      setToast("Share link copied.");
      return;
    }

    setToast("Share link disabled.");
  }

  function handleEmailShare(session: SessionRecord) {
    const subject = encodeURIComponent(
      session.title || "MeetWise AI transcript",
    );
    const body = encodeURIComponent(
      `${session.summary ? `${session.summary}\n\n` : ""}${getPrimaryTranscript(session).slice(0, 2800)}`,
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  }

  function handleWhatsappShare(session: SessionRecord) {
    const body = encodeURIComponent(
      `${session.title || "MeetWise AI transcript"}\n\n${(session.summary || getPrimaryTranscript(session)).slice(0, 1400)}`,
    );
    window.open(`https://wa.me/?text=${body}`, "_blank");
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[28px] border border-white/70 bg-white/90 p-7 shadow-[0_26px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
              Session history
            </p>
            <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              Search, review, and organize saved transcripts
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              This Phase 2 view replaces the old static history template with a
              fully authenticated React screen for filtering, translating,
              sharing, downloading, and managing your sessions.
            </p>
          </div>

          <button
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            onClick={() => void refresh()}
            type="button"
          >
            Refresh data
          </button>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,0.55fr))]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search transcripts, summaries, and notes"
              value={search}
            />
          </label>

          <select
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            onChange={(event) => setModeFilter(event.target.value)}
            value={modeFilter}
          >
            <option value="all">All modes</option>
            <option value="transcribe">Transcribe</option>
            <option value="translate">Translate</option>
            <option value="codemix">Codemix</option>
            <option value="youtube">YouTube</option>
          </select>

          <select
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            onChange={(event) => setLanguageFilter(event.target.value)}
            value={languageFilter}
          >
            <option value="all">All languages</option>
            {languages.map((language) => (
              <option key={language} value={language}>
                {getLanguageLabel(language)}
              </option>
            ))}
          </select>

          <select
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            onChange={(event) => setFolderFilter(event.target.value)}
            value={folderFilter}
          >
            <option value="all">All folders</option>
            <option value="unfiled">Unfiled</option>
            {folders.map((folder) => (
              <option key={folder.folder_id} value={folder.folder_id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 text-sm text-slate-500 shadow-[0_26px_60px_rgba(15,23,42,0.08)]">
          Loading sessions...
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-[0_20px_40px_rgba(244,63,94,0.08)]">
          {error}
        </div>
      ) : filteredSessions.length ? (
        <div className="grid gap-4">
          {filteredSessions.map((session) => {
            const transcript = getPrimaryTranscript(session);
            const currentFolder = folders.find(
              (folder) => folder.folder_id === session.folder_id,
            );
            const sharePath = session.share_token
              ? `/share/${session.share_token}`
              : "";
            const shareUrl =
              sharePath && typeof window !== "undefined"
                ? `${window.location.origin}${sharePath}`
                : sharePath;

            return (
              <article
                key={session.session_id}
                className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_26px_60px_rgba(15,23,42,0.08)] backdrop-blur"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                        {getLanguageLabel(session.language)}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {getModeLabel(session.mode)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {session.word_count?.toLocaleString() || 0} words
                      </span>
                      {currentFolder ? (
                        <span
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: `${currentFolder.color || FOLDER_COLORS[0]}18`,
                            color: currentFolder.color || FOLDER_COLORS[0],
                          }}
                        >
                          {currentFolder.name}
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <h4 className="text-xl font-semibold text-slate-950">
                        {session.title || "Untitled session"}
                      </h4>
                      <p className="mt-2 text-sm text-slate-500">
                        {getSessionDateLabel(session.started_at)} ·{" "}
                        {getDurationLabel(session)}
                      </p>
                    </div>

                    <p className="max-w-4xl text-sm leading-7 text-slate-600">
                      {session.summary || transcript.slice(0, 240) || "No transcript content yet."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      onClick={() =>
                        setExpandedId((current) =>
                          current === session.session_id ? "" : session.session_id,
                        )
                      }
                      type="button"
                    >
                      {expandedId === session.session_id ? "Hide" : "Open"}
                    </button>
                    <button
                      className="inline-flex h-11 items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                      onClick={() => void handleDelete(session)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>

                {expandedId === session.session_id ? (
                  <div className="mt-6 grid gap-6 border-t border-slate-200 pt-6">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <div className="flex items-center justify-between gap-4">
                          <h5 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Transcript
                          </h5>
                          <button
                            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm"
                            onClick={() => void handleCopy(transcript)}
                            type="button"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </button>
                        </div>
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                          {transcript || "No transcript available."}
                        </p>
                      </div>

                      <div className="grid gap-4">
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                          <h5 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Actions
                          </h5>
                          <div className="mt-4 grid gap-3">
                            <div className="grid gap-2 sm:grid-cols-3">
                              {(["raw", "corrected", "filtered"] as const).map((type) => (
                                <button
                                  key={type}
                                  className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                                  onClick={() =>
                                    downloadTextFile(
                                      `${session.title || session.session_id}-${type}.txt`,
                                      getTranscriptForType(session, type),
                                    )
                                  }
                                  type="button"
                                >
                                  Download {type}
                                </button>
                              ))}
                            </div>

                            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                              <select
                                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                onChange={(event) => setTranslationChoice(event.target.value)}
                                value={translationChoice}
                              >
                                {TRANSLATION_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                                onClick={() => void handleTranslate(session)}
                                type="button"
                              >
                                <WandSparkles className="h-4 w-4" />
                                {translatingId === session.session_id
                                  ? "Translating..."
                                  : "Translate"}
                              </button>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                              <button
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                onClick={() => handleEmailShare(session)}
                                type="button"
                              >
                                <Mail className="h-4 w-4" />
                                Email
                              </button>
                              <button
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                onClick={() => handleWhatsappShare(session)}
                                type="button"
                              >
                                <Share2 className="h-4 w-4" />
                                WhatsApp
                              </button>
                            </div>

                            <button
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 text-sm font-medium text-violet-700 transition hover:bg-violet-100"
                              onClick={() => void handleToggleShare(session)}
                              type="button"
                            >
                              <Link2 className="h-4 w-4" />
                              {session.is_public ? "Disable share link" : "Copy share link"}
                            </button>
                            {shareUrl ? (
                              <p className="rounded-2xl border border-violet-200 bg-white px-4 py-3 text-xs text-violet-700">
                                {shareUrl}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                          <h5 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Folder
                          </h5>
                          <div className="mt-4 grid gap-3">
                            <select
                              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                              onChange={(event) =>
                                void assignFolder(
                                  session.session_id,
                                  event.target.value,
                                )
                              }
                              value={session.folder_id || ""}
                            >
                              <option value="">No folder</option>
                              {folders.map((folder) => (
                                <option key={folder.folder_id} value={folder.folder_id}>
                                  {folder.name}
                                </option>
                              ))}
                            </select>
                            <button
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                              onClick={() => void handleCreateFolder(session)}
                              type="button"
                            >
                              <FolderOpen className="h-4 w-4" />
                              New folder
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {session.notes || session.summary ? (
                      <div className="grid gap-4 lg:grid-cols-2">
                        {session.summary ? (
                          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                            <h5 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Summary
                            </h5>
                            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                              {session.summary}
                            </p>
                          </div>
                        ) : null}
                        {session.notes ? (
                          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                            <h5 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Notes
                            </h5>
                            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                              {session.notes}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {(session[`translated_${translationChoice}`] as string | undefined) ? (
                      <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-sky-700">
                          <Languages className="h-4 w-4" />
                          Latest translation
                        </div>
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                          {String(session[`translated_${translationChoice}`])}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/80 px-8 py-16 text-center text-sm text-slate-500 shadow-[0_26px_60px_rgba(15,23,42,0.06)]">
          No sessions match your current filters.
        </div>
      )}

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
