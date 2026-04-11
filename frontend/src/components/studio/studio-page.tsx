"use client";

import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  GraduationCap,
  Languages,
  LoaderCircle,
  MessageSquareText,
  Mic2,
  Network,
  PlayCircle,
  RefreshCcw,
  Search,
  Sparkles,
  Video,
} from "lucide-react";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useState,
} from "react";

import {
  getLanguageLabel,
  getModeLabel,
  getPrimaryTranscript,
  getSessionDateLabel,
} from "@/lib/session-utils";

type SessionItem = {
  session_id: string;
  title?: string;
  transcript?: string;
  summary?: string;
  notes?: string;
  source_channel?: string;
  started_at?: string;
  mode?: string;
  word_count?: number;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type MindMapNode = {
  text?: string;
  children?: MindMapNode[];
};

type SessionDetail = SessionItem & {
  language?: string;
  corrected_transcript?: string;
  filtered_transcript?: string;
  sentence_count?: number;
  source_type?: string;
  custom_vocabulary?: string[];
  speakers?: Array<{ speaker?: string; text?: string }>;
  sentiment_summary?: {
    overall?: string;
    average_score?: number;
    counts?: { positive?: number; neutral?: number; negative?: number };
  };
  sentiment_timeline?: unknown[];
  flashcards?: Array<{ question?: string; answer?: string; explanation?: string }>;
  quiz?: {
    title?: string;
    questions?: Array<{
      question?: string;
      options?: string[];
      answer_index?: number;
      explanation?: string;
    }>;
  } | null;
  podcast?: {
    title?: string;
    hook?: string;
    script?: Array<{ speaker?: string; line?: string }>;
  } | null;
  mind_map?: { title?: string; mermaid?: string; outline?: MindMapNode[] } | null;
  rich_notes?: string | null;
  chat_history?: ChatMessage[];
  [key: string]: unknown;
};

const translationOptions = [
  ["same", "Original transcript"],
  ["en", "English"],
  ["hi", "Hindi"],
  ["ta", "Tamil"],
  ["te", "Telugu"],
  ["kn", "Kannada"],
  ["ml", "Malayalam"],
  ["bn", "Bengali"],
  ["mr", "Marathi"],
  ["gu", "Gujarati"],
  ["pa", "Punjabi"],
  ["or", "Odia"],
  ["fr", "French"],
  ["es", "Spanish"],
  ["de", "German"],
  ["ja", "Japanese"],
  ["ar", "Arabic"],
] as const;

async function readJson<T>(response: Response) {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }
  return payload as T;
}

function StudioCard({
  children,
  title,
  subtitle,
  actions,
  bodyClassName,
  className,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  bodyClassName?: string;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur lg:p-7 ${className ?? ""}`}
    >
      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          {subtitle ? (
            <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="self-start">{actions}</div> : null}
      </div>
      <div className={`mt-6 ${bodyClassName ?? ""}`}>{children}</div>
    </section>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex h-full min-h-[132px] flex-col justify-between rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  busy,
  children,
  disabled = false,
  onClick,
  primary = false,
}: {
  busy?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition ${
        primary
          ? "bg-slate-950 text-white hover:bg-slate-800"
          : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
      } disabled:cursor-not-allowed disabled:opacity-60`}
      disabled={busy || disabled}
      onClick={onClick}
      type="button"
    >
      {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

function cleanMindMapLabel(value: string) {
  return value.replace(/\s+/g, " ").replace(/[`"]/g, "").trim();
}

function normalizeMindMapOutline(nodes: MindMapNode[] | undefined): MindMapNode[] {
  if (!Array.isArray(nodes)) {
    return [];
  }

  return nodes
    .map((node) => ({
      text: cleanMindMapLabel(String(node?.text ?? "")),
      children: normalizeMindMapOutline(node?.children),
    }))
    .filter((node) => node.text);
}

function parseMindMapFromMermaid(mermaid: string | undefined, title: string): MindMapNode[] {
  if (!mermaid?.trim()) {
    return [];
  }

  const lines = mermaid
    .replace(/^mindmap\s*/i, "")
    .split("\n")
    .map((line) => line.replace(/\r/g, "").replace(/\t/g, "  "))
    .filter((line) => line.trim());

  const root: MindMapNode[] = [];
  const stack: Array<{ level: number; node: MindMapNode }> = [];

  for (const rawLine of lines) {
    const indent = rawLine.length - rawLine.trimStart().length;
    const level = Math.max(Math.floor(indent / 2), 0);
    const text = cleanMindMapLabel(
      rawLine
        .trim()
        .replace(/^[A-Za-z0-9_]+\(\((.*)\)\)$/, "$1")
        .replace(/^[A-Za-z0-9_]+\[(.*)\]$/, "$1")
        .replace(/^[A-Za-z0-9_]+\{(.*)\}$/, "$1"),
    );

    if (!text) {
      continue;
    }

    const node: MindMapNode = { text, children: [] };
    while (stack.length && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (!stack.length) {
      root.push(node);
    } else {
      const parent = stack[stack.length - 1].node;
      parent.children = [...(parent.children ?? []), node];
    }

    stack.push({ level, node });
  }

  const normalized = normalizeMindMapOutline(root);
  if (normalized[0]?.text?.toLowerCase() === title.toLowerCase()) {
    return normalizeMindMapOutline(normalized[0].children);
  }
  return normalized;
}

function MindMapPreview({
  title,
  mermaid,
  outline,
}: {
  title: string;
  mermaid?: string;
  outline?: MindMapNode[];
}) {
  const normalizedOutline = normalizeMindMapOutline(outline);
  const derivedOutline =
    normalizedOutline.length > 0
      ? normalizedOutline
      : parseMindMapFromMermaid(mermaid, title);

  if (!derivedOutline.length) {
    return (
      <pre className="min-h-[260px] whitespace-pre-wrap break-words rounded-3xl border border-slate-200 bg-slate-50 p-5 font-mono text-sm leading-7 text-slate-700">
        {mermaid || "No mind map generated yet."}
      </pre>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        <div className="max-w-full rounded-full bg-slate-950 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm">
          {title}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {derivedOutline.map((node, index) => (
          <div
            key={`${node.text ?? "branch"}-${index}`}
            className="rounded-[28px] border border-slate-200 bg-slate-50 p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
              Branch {index + 1}
            </p>
            <h4 className="mt-3 text-lg font-semibold text-slate-950">
              {node.text || "Untitled branch"}
            </h4>

            {node.children?.length ? (
              <div className="mt-4 space-y-3">
                {node.children.map((child, childIndex) => (
                  <div
                    key={`${child.text ?? "child"}-${childIndex}`}
                    className="rounded-2xl border border-white bg-white/85 p-4"
                  >
                    <p className="text-sm font-semibold leading-6 text-slate-900">
                      {child.text || "Supporting point"}
                    </p>
                    {child.children?.length ? (
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                        {child.children.map((leaf, leafIndex) => (
                          <li
                            key={`${leaf.text ?? "leaf"}-${leafIndex}`}
                            className="rounded-2xl bg-slate-50 px-3 py-2"
                          >
                            {leaf.text || "Detail"}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-500">
                Add more detail by regenerating the mind map for this session.
              </p>
            )}
          </div>
        ))}
      </div>

      {mermaid ? (
        <details className="rounded-3xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            Mermaid source
          </summary>
          <pre className="mt-4 whitespace-pre-wrap break-words rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-600">
            {mermaid}
          </pre>
        </details>
      ) : null}
    </div>
  );
}

export function StudioPageClient() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [search, setSearch] = useState("");
  const [translationTarget, setTranslationTarget] = useState("same");
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeBrowser, setYoutubeBrowser] = useState("");
  const [youtubeCookies, setYoutubeCookies] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [isHostedEnvironment, setIsHostedEnvironment] = useState(false);
  const [youtubeStatus, setYoutubeStatus] = useState(
    "Import a YouTube transcript and turn it into a normal study session.",
  );
  const deferredSearch = useDeferredValue(search);

  const filteredSessions = sessions.filter((session) => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return true;
    const hay = [
      session.title,
      session.transcript,
      session.summary,
      session.notes,
      session.source_channel,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  useEffect(() => {
    setIsHostedEnvironment(
      typeof window !== "undefined" &&
        !["localhost", "127.0.0.1"].includes(window.location.hostname),
    );
  }, []);

  useEffect(() => {
    async function initializeStudio() {
      try {
        const response = await fetch("/api/sessions", { cache: "no-store" });
        const payload = await readJson<SessionItem[]>(response);
        startTransition(() => setSessions(Array.isArray(payload) ? payload : []));

        const firstSessionId = payload[0]?.session_id;
        if (!firstSessionId) {
          return;
        }

        setSelectedId(firstSessionId);
        const detailResponse = await fetch(`/api/sessions/${firstSessionId}`, {
          cache: "no-store",
        });
        const detailPayload = await readJson<SessionDetail>(detailResponse);
        startTransition(() => {
          setDetail(detailPayload);
          setChatHistory(
            Array.isArray(detailPayload.chat_history)
              ? detailPayload.chat_history
              : [],
          );
        });
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load studio sessions.",
        );
      }
    }

    void initializeStudio();
  }, []);

  async function loadSessions(preferredId?: string) {
    setError("");
    const response = await fetch("/api/sessions", { cache: "no-store" });
    const payload = await readJson<SessionItem[]>(response);
    startTransition(() => setSessions(Array.isArray(payload) ? payload : []));
    const nextId = preferredId ?? selectedId ?? payload[0]?.session_id ?? null;
    if (nextId) {
      await openSession(nextId);
    }
  }

  async function openSession(sessionId: string) {
    setSelectedId(sessionId);
    setBusyKey("session");
    setError("");
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        cache: "no-store",
      });
      const payload = await readJson<SessionDetail>(response);
      startTransition(() => {
        setDetail(payload);
        setChatHistory(Array.isArray(payload.chat_history) ? payload.chat_history : []);
        setFlashcardIndex(0);
        setQuizIndex(0);
      });
    } catch (sessionError) {
      setError(
        sessionError instanceof Error
          ? sessionError.message
          : "Unable to open that session.",
      );
    } finally {
      setBusyKey("");
    }
  }

  function updateDetail(next: Partial<SessionDetail>) {
    setDetail((current) => (current ? { ...current, ...next } : current));
  }

  async function generateArtifact(
    kind: "flashcards" | "quiz" | "podcast" | "mindmap" | "rich_notes",
  ) {
    if (!detail) return;
    setBusyKey(kind);
    setError("");
    try {
      const response = await fetch(`/api/sessions/${detail.session_id}/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = await readJson<Record<string, unknown>>(response);
      if (kind === "flashcards") {
        setFlashcardIndex(0);
        updateDetail({ flashcards: (payload.flashcards as SessionDetail["flashcards"]) ?? [] });
      }
      if (kind === "quiz") {
        setQuizIndex(0);
        updateDetail({ quiz: (payload.quiz as SessionDetail["quiz"]) ?? null });
      }
      if (kind === "podcast") updateDetail({ podcast: (payload.podcast as SessionDetail["podcast"]) ?? null });
      if (kind === "mindmap") updateDetail({ mind_map: (payload.mind_map as SessionDetail["mind_map"]) ?? null });
      if (kind === "rich_notes") updateDetail({ rich_notes: (payload.rich_notes as string) ?? "" });
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Generation failed.",
      );
    } finally {
      setBusyKey("");
    }
  }

  async function translateCurrent() {
    if (!detail) return;
    setBusyKey("translate");
    setError("");
    try {
      const response = await fetch(`/api/sessions/${detail.session_id}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_lang: translationTarget }),
      });
      const payload = await readJson<{ translated: string }>(response);
      updateDetail({ [`translated_${translationTarget}`]: payload.translated });
    } catch (translationError) {
      setError(
        translationError instanceof Error
          ? translationError.message
          : "Translation failed.",
      );
    } finally {
      setBusyKey("");
    }
  }

  async function sendChat() {
    if (!detail) return;
    const message = chatInput.trim();
    if (!message) return;
    const previousHistory = chatHistory;
    const optimisticHistory = [
      ...chatHistory,
      { role: "user" as const, content: message },
    ];
    setChatInput("");
    setChatHistory(optimisticHistory);
    setBusyKey("chat");
    setError("");
    try {
      const response = await fetch(`/api/sessions/${detail.session_id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: chatHistory }),
      });
      const payload = await readJson<{ answer: string; chat_history: ChatMessage[] }>(
        response,
      );
      setChatHistory(
        Array.isArray(payload.chat_history)
          ? payload.chat_history
          : [...optimisticHistory, { role: "assistant", content: payload.answer }],
      );
    } catch (chatError) {
      setChatHistory(previousHistory);
      setError(chatError instanceof Error ? chatError.message : "Chat failed.");
    } finally {
      setBusyKey("");
    }
  }

  async function importYouTubeSession() {
    if (!youtubeUrl.trim()) {
      setError("Paste a YouTube URL first.");
      return;
    }
    setBusyKey("youtube");
    setError("");
    setYoutubeStatus("Importing transcript and creating a study session...");
    try {
      const response = await fetch("/api/youtube/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: youtubeUrl.trim(),
          auth_browser: youtubeBrowser,
          cookies_content: youtubeBrowser === "paste" ? youtubeCookies.trim() : "",
        }),
      });
      const payload = await readJson<{ session_id: string }>(response);
      setYoutubeUrl("");
      setYoutubeCookies("");
      await loadSessions(payload.session_id);
      setYoutubeStatus(
        "Import a YouTube transcript and turn it into a normal study session.",
      );
    } catch (importError) {
      const message =
        importError instanceof Error ? importError.message : "Import failed.";
      setError(message);
      setYoutubeStatus(message);
    } finally {
      setBusyKey("");
    }
  }

  async function copyRichNotes() {
    if (!detail?.rich_notes) {
      setError("Generate rich notes first.");
      return;
    }
    try {
      await navigator.clipboard.writeText(detail.rich_notes);
    } catch {
      setError("Unable to copy the current notes.");
    }
  }

  function playPodcast() {
    if (!detail?.podcast?.script?.length) {
      setError("Generate a podcast script first.");
      return;
    }
    if (!("speechSynthesis" in window)) {
      setError("Browser speech synthesis is not available.");
      return;
    }
    window.speechSynthesis.cancel();
    const script = detail.podcast.script
      .map((line) => `${line.speaker || "Host"} says. ${line.line || ""}`)
      .join(" ");
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(script));
  }

  function downloadMindMap() {
    if (!detail?.mind_map?.mermaid) {
      setError("Generate a mind map first.");
      return;
    }
    const blob = new Blob([detail.mind_map.mermaid], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(detail.title || "mindmap").replace(/[^a-z0-9]+/gi, "_")}.mmd`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  const transcript = detail ? getPrimaryTranscript(detail) : "";
  const translationValue =
    detail && translationTarget !== "same"
      ? String(detail[`translated_${translationTarget}`] ?? "")
      : transcript || detail?.summary || "";
  const flashcards = detail?.flashcards ?? [];
  const quizQuestions = detail?.quiz?.questions ?? [];
  const currentFlashcard = flashcards[flashcardIndex];
  const currentQuiz = quizQuestions[quizIndex];

  return (
    <div className="grid gap-8 overflow-x-hidden pb-8">
      <section className="rounded-[30px] border border-white/70 bg-white/90 p-7 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
          Studio
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
          Native AI study workspace
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          The Studio route now runs as real Next.js UI with session browsing, AI
          generation, transcript chat, translation, and YouTube import wired to
          your existing backend.
        </p>
      </section>

      {error ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-6 py-4 text-sm leading-6 text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid items-start gap-8 2xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5 2xl:sticky 2xl:top-6">
          <StudioCard
            subtitle={youtubeStatus}
            title="YouTube import"
            actions={
              <ActionButton
                busy={busyKey === "youtube"}
                onClick={importYouTubeSession}
                primary
              >
                <Video className="h-4 w-4" />
                Import
              </ActionButton>
            }
          >
            <div className="space-y-3">
              <select
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                onChange={(event) => setYoutubeBrowser(event.target.value)}
                value={youtubeBrowser}
              >
                <option value="">No sign-in</option>
                <option disabled={isHostedEnvironment} value="chrome">
                  Use Chrome cookies{isHostedEnvironment ? " (local only)" : ""}
                </option>
                <option disabled={isHostedEnvironment} value="edge">
                  Use Edge cookies{isHostedEnvironment ? " (local only)" : ""}
                </option>
                <option disabled={isHostedEnvironment} value="firefox">
                  Use Firefox cookies{isHostedEnvironment ? " (local only)" : ""}
                </option>
                <option disabled={isHostedEnvironment} value="brave">
                  Use Brave cookies{isHostedEnvironment ? " (local only)" : ""}
                </option>
                <option disabled={isHostedEnvironment} value="safari">
                  Use Safari cookies{isHostedEnvironment ? " (local only)" : ""}
                </option>
                <option value="paste">Paste cookies</option>
              </select>
              {isHostedEnvironment ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                  Browser-cookie import works only on local development machines.
                  On the deployed app, use <span className="font-semibold">Paste cookies</span> or{" "}
                  <span className="font-semibold">No sign-in</span>.
                </p>
              ) : null}
              {youtubeBrowser === "paste" ? (
                <textarea
                  className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  onChange={(event) => setYoutubeCookies(event.target.value)}
                  placeholder="Paste Netscape-format cookies"
                  value={youtubeCookies}
                />
              ) : null}
              <input
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                onChange={(event) => setYoutubeUrl(event.target.value)}
                placeholder="Paste a YouTube URL"
                value={youtubeUrl}
              />
            </div>
          </StudioCard>
          <StudioCard
            title="Sessions"
            actions={
              <button
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                onClick={() => void loadSessions()}
                type="button"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Refresh
              </button>
            }
          >
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title or transcript"
                value={search}
              />
            </label>
            <div className="mt-4 max-h-[calc(100vh-24rem)] space-y-3 overflow-y-auto pr-1">
              {filteredSessions.length ? (
                filteredSessions.map((session) => (
                  <button
                    key={session.session_id}
                    className={`w-full rounded-3xl border p-4 text-left transition ${
                      session.session_id === selectedId
                        ? "border-sky-200 bg-sky-50"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                    }`}
                    onClick={() => void openSession(session.session_id)}
                    type="button"
                  >
                    <p className="text-sm font-semibold text-slate-950">
                      {session.title || "Untitled session"}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {getSessionDateLabel(session.started_at)}
                    </p>
                    <p className="mt-2 text-xs font-medium text-slate-600">
                      {getModeLabel(session.mode)} ·{" "}
                      {(session.word_count ?? 0).toLocaleString()} words
                    </p>
                  </button>
                ))
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  No sessions match this search yet.
                </div>
              )}
            </div>
          </StudioCard>
        </aside>

        <div className="min-w-0 space-y-8">
          {!detail ? (
            <div className="rounded-[30px] border border-white/70 bg-white/90 p-10 text-center text-sm leading-6 text-slate-500 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur">
              Select a session to unlock translations, AI artifacts, and transcript chat.
            </div>
          ) : (
            <>
              <section className="grid items-stretch gap-5 2xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
                <StudioCard
                  subtitle={
                    detail.source_type === "youtube"
                      ? `Imported from YouTube${detail.source_channel ? ` via ${detail.source_channel}` : ""}.`
                      : "Transcript-derived study workspace for this saved session."
                  }
                  title={detail.title || "Untitled session"}
                >
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {getSessionDateLabel(detail.started_at)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {getModeLabel(detail.mode)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {getLanguageLabel(detail.language)}
                    </span>
                    {detail.custom_vocabulary?.length ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        {detail.custom_vocabulary.length} custom terms
                      </span>
                    ) : null}
                  </div>
                </StudioCard>

                <div className="grid auto-rows-fr gap-4 sm:grid-cols-2">
                  <MetricCard
                    label="Words"
                    value={(detail.word_count ?? 0).toLocaleString()}
                  />
                  <MetricCard
                    label="Sentences"
                    value={(detail.sentence_count ?? 0).toLocaleString()}
                  />
                  <MetricCard
                    label="Speakers"
                    value={(detail.speakers?.length ?? 0).toLocaleString()}
                  />
                  <MetricCard
                    label="Avg sentiment"
                    value={(detail.sentiment_summary?.average_score ?? 0).toFixed(2)}
                  />
                </div>
              </section>

              <section className="grid items-stretch gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.92fr)]">
                <StudioCard
                  bodyClassName="h-full"
                  className="h-full"
                  title="Summary and notes"
                >
                  <pre className="h-full min-h-[340px] whitespace-pre-wrap break-words rounded-3xl border border-slate-200 bg-slate-50 p-5 font-mono text-sm leading-7 text-slate-700">
                    {[
                      detail.summary ? `SUMMARY\n${detail.summary}` : "",
                      detail.notes ? `NOTES\n${detail.notes}` : "",
                      `TRANSCRIPT PREVIEW\n${(transcript || "No transcript stored yet.").slice(0, 1800)}${transcript.length > 1800 ? "\n\n..." : ""}`,
                    ]
                      .filter(Boolean)
                      .join("\n\n")}
                  </pre>
                </StudioCard>

                <StudioCard
                  bodyClassName="h-full"
                  className="h-full"
                  title="Speakers and sentiment"
                >
                  <div className="flex h-full min-h-[340px] flex-col gap-4">
                    {detail.speakers?.length ? (
                      <div className="space-y-3 overflow-y-auto pr-1">
                        {detail.speakers.map((speaker, index) => (
                        <div
                          key={`${speaker.speaker ?? "speaker"}-${index}`}
                          className="flex gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <span className="flex h-fit min-w-[84px] items-center justify-center rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">
                            {speaker.speaker || "Speaker"}
                          </span>
                          <p className="break-words text-sm leading-7 text-slate-700">
                            {speaker.text || ""}
                          </p>
                        </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        Speaker detection is not available for this session yet.
                      </div>
                    )}
                    <div className="mt-auto grid gap-3 sm:grid-cols-3">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Overall
                        </p>
                        <p className="mt-3 font-semibold text-slate-950">
                          {(detail.sentiment_summary?.overall ?? "neutral").toUpperCase()}
                        </p>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Positive / Neutral / Negative
                        </p>
                        <p className="mt-3 font-semibold text-slate-950">
                          {(detail.sentiment_summary?.counts?.positive ?? 0)} /{" "}
                          {(detail.sentiment_summary?.counts?.neutral ?? 0)} /{" "}
                          {(detail.sentiment_summary?.counts?.negative ?? 0)}
                        </p>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Timeline
                        </p>
                        <p className="mt-3 font-semibold text-slate-950">
                          {(detail.sentiment_timeline?.length ?? 0).toLocaleString()} points
                        </p>
                      </div>
                    </div>
                  </div>
                </StudioCard>
              </section>

              <StudioCard
                bodyClassName="h-full"
                className="h-full"
                title="Multi-language output"
                subtitle="Generate and cache translated transcript output on demand."
                actions={
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <select
                      className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      onChange={(event) => setTranslationTarget(event.target.value)}
                      value={translationTarget}
                    >
                      {translationOptions.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <ActionButton
                      busy={busyKey === "translate"}
                      onClick={translateCurrent}
                    >
                      <Languages className="h-4 w-4" />
                      Generate
                    </ActionButton>
                  </div>
                }
              >
                <pre className="min-h-[220px] whitespace-pre-wrap break-words rounded-3xl border border-slate-200 bg-slate-50 p-5 font-mono text-sm leading-7 text-slate-700">
                  {translationValue || 'Choose a language and click "Generate".'}
                </pre>
              </StudioCard>
              <StudioCard
                bodyClassName="h-full"
                className="h-full"
                title="Rich notes"
                subtitle="Extract detailed study notes from the selected session."
                actions={
                  <div className="flex flex-wrap gap-3">
                    <ActionButton
                      busy={busyKey === "rich_notes"}
                      onClick={() => void generateArtifact("rich_notes")}
                    >
                      <FileText className="h-4 w-4" />
                      Generate
                    </ActionButton>
                    <ActionButton onClick={() => void copyRichNotes()}>
                      <Copy className="h-4 w-4" />
                      Copy
                    </ActionButton>
                  </div>
                }
              >
                <pre className="min-h-[280px] whitespace-pre-wrap break-words rounded-3xl border border-slate-200 bg-slate-50 p-5 font-mono text-sm leading-7 text-slate-700">
                  {detail.rich_notes || "No rich notes generated yet."}
                </pre>
              </StudioCard>

              <section className="grid items-stretch gap-5 xl:grid-cols-2">
                <StudioCard
                  bodyClassName="h-full"
                  className="h-full"
                  title="Flashcards"
                  subtitle="Create revision cards grounded in the transcript."
                  actions={
                    <div className="flex flex-wrap gap-3">
                      <ActionButton
                        busy={busyKey === "flashcards"}
                        onClick={() => void generateArtifact("flashcards")}
                      >
                        <GraduationCap className="h-4 w-4" />
                        Generate
                      </ActionButton>
                      <ActionButton
                        disabled={flashcardIndex === 0 || !flashcards.length}
                        onClick={() => setFlashcardIndex((current) => Math.max(current - 1, 0))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Prev
                      </ActionButton>
                      <ActionButton
                        disabled={!flashcards.length || flashcardIndex >= flashcards.length - 1}
                        onClick={() =>
                          setFlashcardIndex((current) =>
                            Math.min(current + 1, Math.max(flashcards.length - 1, 0)),
                          )
                        }
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </ActionButton>
                    </div>
                  }
                >
                  {currentFlashcard ? (
                    <div className="h-full rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                        Card {flashcardIndex + 1} of {flashcards.length}
                      </p>
                      <h4 className="mt-4 text-lg font-semibold text-slate-950">
                        {currentFlashcard.question || "Question"}
                      </h4>
                      <p className="mt-4 break-words text-sm leading-7 text-slate-700">
                        <span className="font-semibold text-slate-950">Answer:</span>{" "}
                        {currentFlashcard.answer || ""}
                      </p>
                      {currentFlashcard.explanation ? (
                        <p className="mt-4 break-words text-sm leading-7 text-slate-500">
                          {currentFlashcard.explanation}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                      No flashcards yet.
                    </div>
                  )}
                </StudioCard>

                <StudioCard
                  bodyClassName="h-full"
                  className="h-full"
                  title="Quiz"
                  subtitle="Build a transcript-grounded multiple-choice quiz."
                  actions={
                    <div className="flex flex-wrap gap-3">
                      <ActionButton
                        busy={busyKey === "quiz"}
                        onClick={() => void generateArtifact("quiz")}
                      >
                        <Sparkles className="h-4 w-4" />
                        Generate
                      </ActionButton>
                      <ActionButton
                        disabled={quizIndex === 0 || !quizQuestions.length}
                        onClick={() => setQuizIndex((current) => Math.max(current - 1, 0))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Prev
                      </ActionButton>
                      <ActionButton
                        disabled={!quizQuestions.length || quizIndex >= quizQuestions.length - 1}
                        onClick={() =>
                          setQuizIndex((current) =>
                            Math.min(current + 1, Math.max(quizQuestions.length - 1, 0)),
                          )
                        }
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </ActionButton>
                    </div>
                  }
                >
                  {currentQuiz ? (
                    <div className="h-full rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                        Question {quizIndex + 1} of {quizQuestions.length}
                      </p>
                      <h4 className="text-lg font-semibold text-slate-950">
                        {currentQuiz.question || "Quiz question"}
                      </h4>
                      <div className="mt-4 space-y-2">
                        {(currentQuiz.options ?? []).map((option, index) => (
                          <div
                            key={`${option}-${index}`}
                            className={`rounded-2xl border px-4 py-3 text-sm ${
                              index === currentQuiz.answer_index
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-slate-200 bg-white text-slate-700"
                            }`}
                          >
                            {String.fromCharCode(65 + index)}. {option}
                          </div>
                        ))}
                      </div>
                      {currentQuiz.explanation ? (
                        <p className="mt-4 break-words text-sm leading-7 text-slate-500">
                          {currentQuiz.explanation}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                      No quiz generated yet.
                    </div>
                  )}
                </StudioCard>
              </section>

              <StudioCard
                bodyClassName="h-full"
                className="h-full"
                title="Podcast"
                subtitle="Generate a compact spoken recap from the selected transcript."
                actions={
                  <div className="flex flex-wrap gap-3">
                    <ActionButton
                      busy={busyKey === "podcast"}
                      onClick={() => void generateArtifact("podcast")}
                    >
                      <Mic2 className="h-4 w-4" />
                      Generate
                    </ActionButton>
                    <ActionButton onClick={playPodcast}>
                      <PlayCircle className="h-4 w-4" />
                      Play script
                    </ActionButton>
                  </div>
                }
              >
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-3 xl:grid-cols-2">
                    {detail.podcast?.script?.length ? (
                      detail.podcast.script.slice(0, 6).map((line, index) => (
                        <div
                          key={`${line.speaker ?? "speaker"}-${index}`}
                          className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-700"
                        >
                          <span className="font-semibold text-slate-950">
                            {line.speaker || "Host"}:
                          </span>{" "}
                          {line.line || ""}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No podcast script generated yet.
                      </p>
                    )}
                  </div>
                </div>
              </StudioCard>

              <StudioCard
                title="Mind map"
                subtitle="Generate a structured visual map of the session so the main branches and supporting ideas are easier to scan."
                actions={
                  <div className="flex flex-wrap gap-3">
                    <ActionButton
                      busy={busyKey === "mindmap"}
                      onClick={() => void generateArtifact("mindmap")}
                    >
                      <Network className="h-4 w-4" />
                      Generate
                    </ActionButton>
                    <ActionButton onClick={downloadMindMap}>
                      <Download className="h-4 w-4" />
                      Download map
                    </ActionButton>
                  </div>
                }
              >
                <MindMapPreview
                  mermaid={detail.mind_map?.mermaid}
                  outline={detail.mind_map?.outline}
                  title={detail.mind_map?.title || detail.title || "Mind Map"}
                />
              </StudioCard>

              <StudioCard
                bodyClassName="h-full"
                title="Transcript chat"
                subtitle="Ask questions against the selected transcript and keep the conversation grounded in session context."
              >
                <div className="space-y-4">
                  <div className="max-h-[360px] space-y-3 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    {chatHistory.length ? (
                      chatHistory.map((message, index) => (
                        <div
                          key={`${message.role}-${index}`}
                          className={`rounded-2xl border px-4 py-3 text-sm leading-7 ${
                            message.role === "user"
                              ? "border-sky-200 bg-sky-50 text-slate-800"
                              : "border-violet-200 bg-violet-50 text-slate-800"
                          }`}
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            {message.role}
                          </p>
                          <p className="mt-2 whitespace-pre-wrap">{message.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                        Ask anything about this transcript and the backend will answer using the selected session context.
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <textarea
                      className="min-h-[110px] flex-1 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      onChange={(event) => setChatInput(event.target.value)}
                      placeholder="Ask about decisions, action items, concepts, or follow-ups."
                      value={chatInput}
                    />
                    <div className="sm:w-[180px] sm:self-end">
                      <ActionButton
                        busy={busyKey === "chat"}
                        onClick={() => void sendChat()}
                        primary
                      >
                        <MessageSquareText className="h-4 w-4" />
                        Ask Studio
                      </ActionButton>
                    </div>
                  </div>
                </div>
              </StudioCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
