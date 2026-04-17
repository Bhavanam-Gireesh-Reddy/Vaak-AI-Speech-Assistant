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

const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
};

const SUBCARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const GRADIENT_TEXT: React.CSSProperties = {
  background: "linear-gradient(135deg, #ffffff 20%, #a78bfa 60%, #00d4ff 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const INPUT_CLASS =
  "h-12 w-full rounded-2xl px-4 text-sm text-white outline-none transition placeholder:text-white/25";

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const SELECT_STYLE: React.CSSProperties = {
  background: "rgba(20,20,30,0.95)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.85)",
  colorScheme: "dark",
};

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
      {/* ── Header ── */}
      <section
        className="relative overflow-hidden rounded-3xl p-7 md:p-10"
        style={{
          background: "rgba(255,255,255,0.025)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(124,58,237,0.18)",
          boxShadow: "0 0 60px rgba(124,58,237,0.07), 0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Ambient inner glows */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at top left, rgba(124,58,237,0.1) 0%, transparent 55%)" }}
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-48 w-48"
          style={{ background: "radial-gradient(circle at bottom right, rgba(0,212,255,0.07) 0%, transparent 60%)" }}
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest"
              style={{
                background: "rgba(0,212,255,0.08)",
                border: "1px solid rgba(0,212,255,0.22)",
                color: "#67e8f9",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "#00d4ff", boxShadow: "0 0 6px #00d4ff" }}
              />
              Session history
            </div>
            <h3
              className="text-2xl md:text-4xl font-bold leading-tight tracking-tight"
              style={GRADIENT_TEXT}
            >
              Search, review &amp;
              <br />
              organize transcripts
            </h3>
            <p
              className="mt-3 max-w-2xl text-sm md:text-base leading-7"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Filter, translate, share, download, and manage your sessions from
              one authenticated screen.
            </p>
          </div>

          <button
            className="inline-flex h-11 items-center justify-center rounded-2xl px-6 text-sm font-semibold text-white transition hover:opacity-90 w-full md:w-auto"
            style={{
              background: "linear-gradient(135deg,#7c3aed,#00d4ff)",
              boxShadow: "0 0 20px rgba(124,58,237,0.3)",
            }}
            onClick={() => void refresh()}
            type="button"
          >
            Refresh data
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="mt-6 md:mt-8 grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,0.55fr))]">
          <label className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: "rgba(255,255,255,0.35)" }}
            />
            <input
              className={`${INPUT_CLASS} pl-11 pr-4`}
              style={INPUT_STYLE}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search transcripts, summaries, and notes"
              value={search}
            />
          </label>

          <select
            className="h-12 rounded-2xl px-4 text-sm outline-none transition"
            style={SELECT_STYLE}
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
            className="h-12 rounded-2xl px-4 text-sm outline-none transition"
            style={SELECT_STYLE}
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
            className="h-12 rounded-2xl px-4 text-sm outline-none transition"
            style={SELECT_STYLE}
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

      {/* ── Body ── */}
      {isLoading ? (
        <div
          className="rounded-2xl p-8 text-sm"
          style={{ ...CARD, color: "rgba(255,255,255,0.4)" }}
        >
          Loading sessions...
        </div>
      ) : error ? (
        <div
          className="rounded-2xl p-8 text-sm"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#fca5a5",
          }}
        >
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
                className="rounded-2xl p-6"
                style={CARD}
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    {/* ── Badges ── */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}
                      >
                        {getLanguageLabel(session.language)}
                      </span>
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}
                      >
                        {getModeLabel(session.mode)}
                      </span>
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}
                      >
                        {session.word_count?.toLocaleString() || 0} words
                      </span>
                      {currentFolder ? (
                        <span
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: `${currentFolder.color || FOLDER_COLORS[0]}18`,
                            color: currentFolder.color || FOLDER_COLORS[0],
                            border: `1px solid ${currentFolder.color || FOLDER_COLORS[0]}30`,
                          }}
                        >
                          {currentFolder.name}
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <h4 className="text-xl font-semibold text-white">
                        {session.title || "Untitled session"}
                      </h4>
                      <p
                        className="mt-2 text-sm"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        {getSessionDateLabel(session.started_at)} ·{" "}
                        {getDurationLabel(session)}
                      </p>
                    </div>

                    <p
                      className="max-w-4xl text-sm leading-7"
                      style={{ color: "rgba(255,255,255,0.55)" }}
                    >
                      {session.summary || transcript.slice(0, 240) || "No transcript content yet."}
                    </p>
                  </div>

                  {/* ── Action buttons ── */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-medium text-white transition hover:opacity-90"
                      style={{
                        background: "linear-gradient(135deg,#7c3aed,#00d4ff)",
                        boxShadow: "0 0 20px rgba(124,58,237,0.25)",
                      }}
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
                      className="inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-medium transition hover:opacity-90"
                      style={{
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        color: "#fca5a5",
                      }}
                      onClick={() => void handleDelete(session)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* ── Expanded panel ── */}
                {expandedId === session.session_id ? (
                  <div
                    className="mt-6 grid gap-6 pt-6"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
                      {/* Transcript */}
                      <div className="rounded-2xl p-5" style={SUBCARD}>
                        <div className="flex items-center justify-between gap-4">
                          <h5
                            className="text-sm font-bold uppercase tracking-[0.2em]"
                            style={{ color: "rgba(255,255,255,0.4)" }}
                          >
                            Transcript
                          </h5>
                          <button
                            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-80"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                            onClick={() => void handleCopy(transcript)}
                            type="button"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </button>
                        </div>
                        <p
                          className="mt-4 whitespace-pre-wrap text-sm leading-7"
                          style={{ color: "rgba(255,255,255,0.65)" }}
                        >
                          {transcript || "No transcript available."}
                        </p>
                      </div>

                      <div className="grid gap-4">
                        {/* Actions sub-card */}
                        <div className="rounded-2xl p-5" style={SUBCARD}>
                          <h5
                            className="text-sm font-bold uppercase tracking-[0.2em]"
                            style={{ color: "rgba(255,255,255,0.4)" }}
                          >
                            Actions
                          </h5>
                          <div className="mt-4 grid gap-3">
                            {/* Download row */}
                            <div className="grid gap-2 sm:grid-cols-3">
                              {(["raw", "corrected", "filtered"] as const).map((type) => (
                                <button
                                  key={type}
                                  className="rounded-2xl px-3 py-3 text-xs font-semibold transition hover:opacity-80"
                                  style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    color: "rgba(255,255,255,0.65)",
                                  }}
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

                            {/* Translate row */}
                            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                              <select
                                className="h-11 rounded-2xl px-4 text-sm outline-none transition"
                                style={SELECT_STYLE}
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
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold text-white transition hover:opacity-90"
                                style={{
                                  background: "linear-gradient(135deg,#7c3aed,#00d4ff)",
                                  boxShadow: "0 0 20px rgba(124,58,237,0.25)",
                                }}
                                onClick={() => void handleTranslate(session)}
                                type="button"
                              >
                                <WandSparkles className="h-4 w-4" />
                                {translatingId === session.session_id
                                  ? "Translating..."
                                  : "Translate"}
                              </button>
                            </div>

                            {/* Share row */}
                            <div className="grid gap-2 sm:grid-cols-2">
                              <button
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-medium transition hover:opacity-80"
                                style={{
                                  background: "rgba(255,255,255,0.04)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  color: "rgba(255,255,255,0.65)",
                                }}
                                onClick={() => handleEmailShare(session)}
                                type="button"
                              >
                                <Mail className="h-4 w-4" />
                                Email
                              </button>
                              <button
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-medium transition hover:opacity-80"
                                style={{
                                  background: "rgba(255,255,255,0.04)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  color: "rgba(255,255,255,0.65)",
                                }}
                                onClick={() => handleWhatsappShare(session)}
                                type="button"
                              >
                                <Share2 className="h-4 w-4" />
                                WhatsApp
                              </button>
                            </div>

                            {/* Public link */}
                            <button
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-medium transition hover:opacity-80"
                              style={{
                                background: "rgba(167,139,250,0.1)",
                                border: "1px solid rgba(167,139,250,0.25)",
                                color: "#a78bfa",
                              }}
                              onClick={() => void handleToggleShare(session)}
                              type="button"
                            >
                              <Link2 className="h-4 w-4" />
                              {session.is_public ? "Disable share link" : "Copy share link"}
                            </button>
                            {shareUrl ? (
                              <p
                                className="rounded-2xl px-4 py-3 text-xs"
                                style={{
                                  background: "rgba(167,139,250,0.06)",
                                  border: "1px solid rgba(167,139,250,0.18)",
                                  color: "#a78bfa",
                                }}
                              >
                                {shareUrl}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {/* Folder sub-card */}
                        <div className="rounded-2xl p-5" style={SUBCARD}>
                          <h5
                            className="text-sm font-bold uppercase tracking-[0.2em]"
                            style={{ color: "rgba(255,255,255,0.4)" }}
                          >
                            Folder
                          </h5>
                          <div className="mt-4 grid gap-3">
                            <select
                              className="h-11 rounded-2xl px-4 text-sm outline-none transition"
                              style={SELECT_STYLE}
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
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-medium transition hover:opacity-80"
                              style={{
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                color: "rgba(255,255,255,0.65)",
                              }}
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

                    {/* Summary / Notes */}
                    {session.notes || session.summary ? (
                      <div className="grid gap-4 lg:grid-cols-2">
                        {session.summary ? (
                          <div className="rounded-2xl p-5" style={SUBCARD}>
                            <h5
                              className="text-sm font-bold uppercase tracking-[0.2em]"
                              style={{ color: "rgba(255,255,255,0.4)" }}
                            >
                              Summary
                            </h5>
                            <p
                              className="mt-4 whitespace-pre-wrap text-sm leading-7"
                              style={{ color: "rgba(255,255,255,0.65)" }}
                            >
                              {session.summary}
                            </p>
                          </div>
                        ) : null}
                        {session.notes ? (
                          <div className="rounded-2xl p-5" style={SUBCARD}>
                            <h5
                              className="text-sm font-bold uppercase tracking-[0.2em]"
                              style={{ color: "rgba(255,255,255,0.4)" }}
                            >
                              Notes
                            </h5>
                            <p
                              className="mt-4 whitespace-pre-wrap text-sm leading-7"
                              style={{ color: "rgba(255,255,255,0.65)" }}
                            >
                              {session.notes}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {/* Translation result */}
                    {(session[`translated_${translationChoice}`] as string | undefined) ? (
                      <div
                        className="rounded-3xl p-5"
                        style={{
                          background: "rgba(0,212,255,0.05)",
                          border: "1px solid rgba(0,212,255,0.18)",
                        }}
                      >
                        <div
                          className="flex items-center gap-2 text-sm font-semibold"
                          style={{ color: "#00d4ff" }}
                        >
                          <Languages className="h-4 w-4" />
                          Latest translation
                        </div>
                        <p
                          className="mt-4 whitespace-pre-wrap text-sm leading-7"
                          style={{ color: "rgba(255,255,255,0.65)" }}
                        >
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
        <div
          className="rounded-2xl px-8 py-16 text-center text-sm"
          style={{
            border: "1px dashed rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.02)",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          No sessions match your current filters.
        </div>
      )}

      {/* ── Toast ── */}
      {toast ? (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-lg"
          style={{
            background: "rgba(20,20,30,0.92)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
