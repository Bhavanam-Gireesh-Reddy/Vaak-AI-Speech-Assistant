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
  CheckSquare,
  Upload,
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

/* ── Types ──────────────────────────────────────────────────────── */
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
  action_items?: Array<{
    action: string;
    owner?: string;
    due_date?: string;
    priority?: "high" | "medium" | "low";
    status?: string;
  }>;
  uploaded_notes?: Array<{
    timestamp: string;
    text: string;
    file_type: string;
    confidence: string;
  }>;
  [key: string]: unknown;
};

/* ── Design tokens ───────────────────────────────────────────────── */
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

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.85)",
};

const SELECT_STYLE: React.CSSProperties = {
  background: "rgba(20,20,30,0.95)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.85)",
  colorScheme: "dark",
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

/* ── Helpers ─────────────────────────────────────────────────────── */
async function readJson<T>(response: Response) {
  try {
    if (response.status === 204) {
      return {} as T;
    }
    const text = await response.text();
    if (!text) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Empty response`);
      }
      return {} as T;
    }
    const payload = JSON.parse(text) as T & { error?: string };
    if (!response.ok) {
      throw new Error(payload.error ?? `HTTP ${response.status}: Request failed.`);
    }
    return payload as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`JSON parse error: ${error.message}`);
    }
    throw error;
  }
}

/* ── Sub-components ──────────────────────────────────────────────── */
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
      className={`relative overflow-hidden rounded-2xl p-5 md:p-6 ${className ?? ""}`}
      style={CARD}
    >
      {/* Subtle top-left corner glow */}
      <div
        className="pointer-events-none absolute top-0 left-0 h-24 w-24"
        style={{ background: "radial-gradient(circle at top left, rgba(124,58,237,0.06) 0%, transparent 70%)" }}
      />
      <div className="relative flex flex-col gap-2 sm:gap-3 md:gap-4">
        <div className="min-w-0">
          <h3
            className="text-sm sm:text-base md:text-lg font-bold"
            style={GRADIENT_TEXT}
          >
            {title}
          </h3>
          {subtitle ? (
            <p
              className="mt-0.5 sm:mt-1 md:mt-2 text-xs sm:text-xs md:text-sm leading-4 sm:leading-5 md:leading-6"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? <div className="self-start">{actions}</div> : null}
      </div>
      <div className={`relative mt-4 md:mt-6 ${bodyClassName ?? ""}`}>{children}</div>
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
    <div
      className="relative overflow-hidden flex h-full min-h-[100px] md:min-h-[120px] lg:min-h-[140px] flex-col justify-between rounded-2xl p-4 md:p-5"
      style={CARD}
    >
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-16 w-16"
        style={{ background: "radial-gradient(circle at bottom right, rgba(0,212,255,0.06) 0%, transparent 70%)" }}
      />
      <p
        className="text-[8px] xsm:text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.18em] md:tracking-[0.24em]"
        style={{ color: "#00d4ff" }}
      >
        {label}
      </p>
      <p
        className="mt-2 sm:mt-3 md:mt-4 lg:mt-6 text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight"
        style={GRADIENT_TEXT}
      >
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
      className="inline-flex h-9 sm:h-10 items-center justify-center gap-2 rounded-xl sm:rounded-2xl px-3 sm:px-4 text-xs sm:text-sm font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      style={
        primary
          ? {
              background: "linear-gradient(135deg,#7c3aed,#00d4ff)",
              boxShadow: "0 0 20px rgba(124,58,237,0.3)",
              color: "#fff",
            }
          : {
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
            }
      }
      disabled={busy || disabled}
      onClick={onClick}
      type="button"
    >
      {busy ? <LoaderCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

/* ── Mind map helpers ────────────────────────────────────────────── */
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
      <pre
        className="min-h-[260px] whitespace-pre-wrap break-words rounded-2xl p-6 font-mono text-sm leading-relaxed"
        style={{ ...SUBCARD, color: "rgba(255,255,255,0.55)" }}
      >
        {mermaid || "No mind map generated yet."}
      </pre>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        <div
          className="max-w-full rounded-full px-6 py-3 text-center text-sm font-bold text-white shadow-sm"
          style={{
            background: "linear-gradient(135deg,#7c3aed,#00d4ff)",
            boxShadow: "0 0 24px rgba(124,58,237,0.3)",
          }}
        >
          {title}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {derivedOutline.map((node, index) => (
          <div
            key={`${node.text ?? "branch"}-${index}`}
            className="rounded-2xl p-6"
            style={SUBCARD}
          >
            <p
              className="text-xs font-bold uppercase tracking-[0.24em]"
              style={{ color: "#00d4ff" }}
            >
              Branch {index + 1}
            </p>
            <h4 className="mt-3 text-lg font-semibold text-white">
              {node.text || "Untitled branch"}
            </h4>

            {node.children?.length ? (
              <div className="mt-4 space-y-3">
                {node.children.map((child, childIndex) => (
                  <div
                    key={`${child.text ?? "child"}-${childIndex}`}
                    className="rounded-2xl p-4"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <p className="text-sm font-semibold leading-6 text-white">
                      {child.text || "Supporting point"}
                    </p>
                    {child.children?.length ? (
                      <ul
                        className="mt-3 space-y-2 text-sm leading-6"
                        style={{ color: "rgba(255,255,255,0.55)" }}
                      >
                        {child.children.map((leaf, leafIndex) => (
                          <li
                            key={`${leaf.text ?? "leaf"}-${leafIndex}`}
                            className="rounded-xl px-3 py-2"
                            style={{ background: "rgba(255,255,255,0.03)" }}
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
              <p
                className="mt-4 text-sm leading-6"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Add more detail by regenerating the mind map for this session.
              </p>
            )}
          </div>
        ))}
      </div>

      {mermaid ? (
        <details
          className="rounded-2xl p-5"
          style={SUBCARD}
        >
          <summary
            className="cursor-pointer text-sm font-semibold"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            Mermaid source
          </summary>
          <pre
            className="mt-4 whitespace-pre-wrap break-words rounded-2xl p-4 font-mono text-xs leading-6"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.55)",
            }}
          >
            {mermaid}
          </pre>
        </details>
      ) : null}
    </div>
  );
}

/* ── Main page component ─────────────────────────────────────────── */
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

  async function generateActionItems() {
    if (!detail) return;
    setBusyKey("action_items");
    setError("");
    try {
      const response = await fetch(`/api/sessions/${detail.session_id}/action-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = await readJson<{
        action_items: Array<{
          action: string;
          owner?: string;
          due_date?: string;
          priority?: "high" | "medium" | "low";
          status?: string;
        }>;
      }>(response);
      updateDetail({ action_items: payload.action_items ?? [] });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to extract action items.");
    } finally {
      setBusyKey("");
    }
  }

  async function handleOCRUpload(file: File | undefined) {
    if (!file || !detail) return;
    setBusyKey("ocr");
    setError("");
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageData = (event.target?.result as string).split(",")[1];
        if (!imageData) {
          setError("Invalid image file.");
          return;
        }
        try {
          const response = await fetch(`/api/sessions/${detail.session_id}/upload-notes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image_data: imageData,
              file_type: file.type,
            }),
          });

          const payload = await readJson<{
            success: boolean;
            extracted_text?: string;
            character_count?: number;
            error?: string;
            setup_guide?: Record<string, unknown>;
          }>(response);

          if (!payload.success) {
            const errorMsg = payload.error || "OCR processing failed";
            if (payload.setup_guide) {
              setError(
                `${errorMsg}\n\nSetup guide:\n${Object.entries(payload.setup_guide)
                  .map(([key, val]) => `${key}: ${val}`)
                  .join("\n")}`
              );
            } else {
              setError(errorMsg);
            }
            setBusyKey("");
            return;
          }

          const existingNotes = detail.uploaded_notes ?? [];
          existingNotes.push({
            timestamp: new Date().toISOString(),
            text: payload.extracted_text || "",
            file_type: file.type,
            confidence: "high",
          });
          updateDetail({ uploaded_notes: existingNotes });
        } catch (uploadError) {
          setError(uploadError instanceof Error ? uploadError.message : "OCR upload failed.");
        } finally {
          setBusyKey("");
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setError(error instanceof Error ? error.message : "File reading failed.");
      setBusyKey("");
    }
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
    <div className="grid gap-4 md:gap-8 overflow-x-hidden pb-6 md:pb-8">
      {/* ── Page header ── */}
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
          style={{ background: "radial-gradient(ellipse at top left, rgba(124,58,237,0.12) 0%, transparent 55%)" }}
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-48 w-48"
          style={{ background: "radial-gradient(circle at bottom right, rgba(0,212,255,0.08) 0%, transparent 60%)" }}
        />

        <div className="relative">
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest"
            style={{
              background: "rgba(167,139,250,0.08)",
              border: "1px solid rgba(167,139,250,0.22)",
              color: "#c4b5fd",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "#a78bfa", boxShadow: "0 0 6px #a78bfa" }}
            />
            AI Studio · Study Workspace
          </div>
          <h2
            className="text-2xl md:text-4xl font-bold leading-tight tracking-tight"
            style={GRADIENT_TEXT}
          >
            Native AI study
            <br />
            workspace
          </h2>
          <p
            className="mt-3 max-w-2xl text-sm md:text-base leading-7"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Browse sessions, generate AI artifacts, chat with your transcript,
            translate to any language, and import from YouTube — all wired to your
            existing backend.
          </p>
        </div>
      </section>

      {/* ── Error banner ── */}
      {error ? (
        <div
          className="rounded-2xl px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm leading-5 md:leading-6"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#fca5a5",
          }}
        >
          {error}
        </div>
      ) : null}

      {/* ══════════════════════════════════════════════════════════════════
          ROW 1 — YouTube Import  |  Sessions list
      ══════════════════════════════════════════════════════════════════ */}
      <section className="grid gap-5">
        {/* YouTube import */}
        <StudioCard
          subtitle={youtubeStatus}
          title="YouTube import"
          actions={
            <ActionButton busy={busyKey === "youtube"} onClick={importYouTubeSession} primary>
              <Video className="h-4 w-4" />
              Import
            </ActionButton>
          }
        >
          <div className="space-y-3">
            <select
              className="h-11 w-full rounded-2xl px-4 text-sm outline-none transition"
              style={SELECT_STYLE}
              onChange={(e) => setYoutubeBrowser(e.target.value)}
              value={youtubeBrowser}
            >
              <option value="">No sign-in</option>
              <option disabled={isHostedEnvironment} value="chrome">Use Chrome cookies{isHostedEnvironment ? " (local only)" : ""}</option>
              <option disabled={isHostedEnvironment} value="edge">Use Edge cookies{isHostedEnvironment ? " (local only)" : ""}</option>
              <option disabled={isHostedEnvironment} value="firefox">Use Firefox cookies{isHostedEnvironment ? " (local only)" : ""}</option>
              <option disabled={isHostedEnvironment} value="brave">Use Brave cookies{isHostedEnvironment ? " (local only)" : ""}</option>
              <option disabled={isHostedEnvironment} value="safari">Use Safari cookies{isHostedEnvironment ? " (local only)" : ""}</option>
              <option value="paste">Paste cookies</option>
            </select>
            {isHostedEnvironment ? (
              <p className="rounded-2xl px-4 py-3 text-sm leading-6"
                style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#fde68a" }}>
                Browser-cookie import works only on local machines. On the deployed app, use{" "}
                <span className="font-semibold">Paste cookies</span> or <span className="font-semibold">No sign-in</span>.
              </p>
            ) : null}
            {youtubeBrowser === "paste" ? (
              <textarea
                className="min-h-[90px] w-full rounded-2xl px-4 py-3 text-sm outline-none transition placeholder:text-white/25"
                style={INPUT_STYLE}
                onChange={(e) => setYoutubeCookies(e.target.value)}
                placeholder="Paste Netscape-format cookies"
                value={youtubeCookies}
              />
            ) : null}
            <input
              className="h-11 w-full rounded-2xl px-4 text-sm outline-none transition placeholder:text-white/25"
              style={INPUT_STYLE}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Paste a YouTube URL"
              value={youtubeUrl}
            />
          </div>
        </StudioCard>

        {/* Sessions list */}
        <StudioCard
          title="Sessions"
          actions={
            <button
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
              onClick={() => void loadSessions()}
              type="button"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Refresh
            </button>
          }
        >
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }} />
            <input
              className="h-11 w-full rounded-2xl pl-11 pr-4 text-sm outline-none transition placeholder:text-white/25"
              style={INPUT_STYLE}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or transcript"
              value={search}
            />
          </label>
          <div className="mt-4 grid gap-2 max-h-72 overflow-y-auto pr-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            {filteredSessions.length ? (
              filteredSessions.map((session) => (
                <button
                  key={session.session_id}
                  className="w-full rounded-2xl p-4 text-left transition"
                  style={
                    session.session_id === selectedId
                      ? { background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }
                      : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }
                  }
                  onClick={() => void openSession(session.session_id)}
                  type="button"
                >
                  <p className="text-sm font-semibold text-white truncate">{session.title || "Untitled session"}</p>
                  <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{getSessionDateLabel(session.started_at)}</p>
                  <p className="mt-1 text-xs font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {getModeLabel(session.mode)} · {(session.word_count ?? 0).toLocaleString()} words
                  </p>
                </button>
              ))
            ) : (
              <div className="col-span-full rounded-2xl px-4 py-5 text-sm" style={{ ...SUBCARD, color: "rgba(255,255,255,0.35)" }}>
                No sessions match this search yet.
              </div>
            )}
          </div>
        </StudioCard>
      </section>

      {/* ── No session selected placeholder ── */}
      {!detail ? (
        <div className="rounded-3xl p-10 text-center text-sm leading-6" style={{ ...CARD, color: "rgba(255,255,255,0.4)" }}>
          Select a session above to unlock translations, AI artifacts, and transcript chat.
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════════════════
              ROW 2 — Session info  |  4 metric cards
          ══════════════════════════════════════════════════════════════════ */}
          <section className="grid gap-5">
            <StudioCard
              subtitle={
                detail.source_type === "youtube"
                  ? `Imported from YouTube${detail.source_channel ? ` via ${detail.source_channel}` : ""}.`
                  : "Transcript-derived study workspace for this saved session."
              }
              title={detail.title || "Untitled session"}
            >
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { text: getSessionDateLabel(detail.started_at), color: "rgba(255,255,255,0.5)" },
                  { text: getModeLabel(detail.mode), color: "#a78bfa" },
                  { text: getLanguageLabel(detail.language), color: "#00d4ff" },
                ].map(({ text, color }) => (
                  <span key={text} className="rounded-full px-3 py-1"
                    style={{ background: `${color}12`, color, border: `1px solid ${color}20` }}>
                    {text}
                  </span>
                ))}
                {detail.custom_vocabulary?.length ? (
                  <span className="rounded-full px-3 py-1"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {detail.custom_vocabulary.length} custom terms
                  </span>
                ) : null}
              </div>
            </StudioCard>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <MetricCard label="Words" value={(detail.word_count ?? 0).toLocaleString()} />
              <MetricCard label="Sentences" value={(detail.sentence_count ?? 0).toLocaleString()} />
              <MetricCard label="Speakers" value={(detail.speakers?.length ?? 0).toLocaleString()} />
              <MetricCard label="Avg sentiment" value={(detail.sentiment_summary?.average_score ?? 0).toFixed(2)} />
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              ROW 3 — Summary & Notes  (full width)
          ══════════════════════════════════════════════════════════════════ */}
          <StudioCard title="Summary and notes">
            <pre className="min-h-[200px] whitespace-pre-wrap break-words rounded-3xl p-5 font-mono text-sm leading-7"
              style={{ ...SUBCARD, color: "rgba(255,255,255,0.65)" }}>
              {[
                detail.summary ? `SUMMARY\n${detail.summary}` : "",
                detail.notes ? `NOTES\n${detail.notes}` : "",
                `TRANSCRIPT PREVIEW\n${(transcript || "No transcript stored yet.").slice(0, 1200)}${transcript.length > 1200 ? "\n\n..." : ""}`,
              ].filter(Boolean).join("\n\n")}
            </pre>
          </StudioCard>

          {/* ══════════════════════════════════════════════════════════════════
              ROW 3b — Speakers  (full width)
          ══════════════════════════════════════════════════════════════════ */}
          <StudioCard title="Speakers">
            {detail.speakers?.length ? (
              <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
                {detail.speakers.map((speaker, index) => (
                  <div key={`${speaker.speaker ?? "speaker"}-${index}`}
                    className="flex gap-3 rounded-2xl p-3" style={SUBCARD}>
                    <span className="flex h-fit min-w-[80px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em]"
                      style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff" }}>
                      {speaker.speaker || "Speaker"}
                    </span>
                    <p className="break-words text-sm leading-6" style={{ color: "rgba(255,255,255,0.65)" }}>
                      {speaker.text || ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl p-4 text-sm" style={{ ...SUBCARD, color: "rgba(255,255,255,0.35)" }}>
                Speaker detection is not available for this session yet.
              </div>
            )}
          </StudioCard>

          {/* ══════════════════════════════════════════════════════════════════
              ROW 3c — Sentiment Analysis  (full width)
          ══════════════════════════════════════════════════════════════════ */}
          <StudioCard title="Sentiment analysis">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Overall", value: (detail.sentiment_summary?.overall ?? "neutral").toUpperCase() },
                { label: "Pos/Neu/Neg", value: `${detail.sentiment_summary?.counts?.positive ?? 0}/${detail.sentiment_summary?.counts?.neutral ?? 0}/${detail.sentiment_summary?.counts?.negative ?? 0}` },
                { label: "Timeline", value: `${(detail.sentiment_timeline?.length ?? 0).toLocaleString()} pts` },
              ].map(({ label, value }) => (
                <div key={label} className="flex min-h-[100px] flex-col justify-between rounded-2xl p-4" style={SUBCARD}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
                  <p className="text-base font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          </StudioCard>

          {/* ══════════════════════════════════════════════════════════════════
              ROW 4 — Translation  (full width)
          ══════════════════════════════════════════════════════════════════ */}
          <StudioCard title="Multi-language output"
              subtitle="Generate and cache translated transcript output on demand."
              actions={
                <div className="flex flex-wrap items-center gap-3">
                  <select className="h-10 rounded-2xl px-3 text-sm outline-none transition"
                    style={SELECT_STYLE}
                    onChange={(e) => setTranslationTarget(e.target.value)}
                    value={translationTarget}>
                    {translationOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <ActionButton busy={busyKey === "translate"} onClick={translateCurrent}>
                    <Languages className="h-4 w-4" />
                    Generate
                  </ActionButton>
                </div>
              }>
              <pre className="min-h-[220px] whitespace-pre-wrap break-words rounded-3xl p-5 font-mono text-sm leading-7"
                style={{ ...SUBCARD, color: "rgba(255,255,255,0.65)" }}>
                {translationValue || 'Choose a language and click "Generate".'}
              </pre>
            </StudioCard>

          {/* ══════════════════════════════════════════════════════════════════
              ROW 4b — Rich Notes  (full width)
          ══════════════════════════════════════════════════════════════════ */}
            <StudioCard title="Rich notes"
              subtitle="Extract detailed study notes from the selected session."
              actions={
                <div className="flex flex-wrap gap-3">
                  <ActionButton busy={busyKey === "rich_notes"} onClick={() => void generateArtifact("rich_notes")}>
                    <FileText className="h-4 w-4" />
                    Generate
                  </ActionButton>
                  <ActionButton onClick={() => void copyRichNotes()}>
                    <Copy className="h-4 w-4" />
                    Copy
                  </ActionButton>
                </div>
              }>
              <pre className="min-h-[220px] whitespace-pre-wrap break-words rounded-3xl p-5 font-mono text-sm leading-7"
                style={{ ...SUBCARD, color: "rgba(255,255,255,0.65)" }}>
                {detail.rich_notes || "No rich notes generated yet."}
              </pre>
            </StudioCard>

          {/* ══════════════════════════════════════════════════════════════════
              ROW 5 — Flashcards  (full width)
          ══════════════════════════════════════════════════════════════════ */}
            <StudioCard title="Flashcards"
              subtitle="Create revision cards grounded in the transcript."
              actions={
                <div className="flex flex-wrap gap-2">
                  <ActionButton busy={busyKey === "flashcards"} onClick={() => void generateArtifact("flashcards")}>
                    <GraduationCap className="h-4 w-4" />
                    Generate
                  </ActionButton>
                  <ActionButton disabled={flashcardIndex === 0 || !flashcards.length}
                    onClick={() => setFlashcardIndex((c) => Math.max(c - 1, 0))}>
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </ActionButton>
                  <ActionButton disabled={!flashcards.length || flashcardIndex >= flashcards.length - 1}
                    onClick={() => setFlashcardIndex((c) => Math.min(c + 1, Math.max(flashcards.length - 1, 0)))}>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </ActionButton>
                </div>
              }>
              {currentFlashcard ? (
                <div className="h-full rounded-3xl p-5" style={SUBCARD}>
                  <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: "#00d4ff" }}>
                    Card {flashcardIndex + 1} of {flashcards.length}
                  </p>
                  <h4 className="mt-4 text-lg font-semibold text-white">{currentFlashcard.question || "Question"}</h4>
                  <p className="mt-4 break-words text-sm leading-7" style={{ color: "rgba(255,255,255,0.65)" }}>
                    <span className="font-semibold text-white">Answer:</span>{" "}{currentFlashcard.answer || ""}
                  </p>
                  {currentFlashcard.explanation ? (
                    <p className="mt-4 break-words text-sm leading-7" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {currentFlashcard.explanation}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-3xl p-5 text-sm" style={{ ...SUBCARD, color: "rgba(255,255,255,0.35)" }}>
                  No flashcards yet.
                </div>
              )}
            </StudioCard>

          {/* ══════════════════════════════════════════════════════════════════
              ROW 5b — Quiz  (full width)
          ══════════════════════════════════════════════════════════════════ */}
            <StudioCard title="Quiz"
              subtitle="Build a transcript-grounded multiple-choice quiz."
              actions={
                <div className="flex flex-wrap gap-2">
                  <ActionButton busy={busyKey === "quiz"} onClick={() => void generateArtifact("quiz")}>
                    <Sparkles className="h-4 w-4" />
                    Generate
                  </ActionButton>
                  <ActionButton disabled={quizIndex === 0 || !quizQuestions.length}
                    onClick={() => setQuizIndex((c) => Math.max(c - 1, 0))}>
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </ActionButton>
                  <ActionButton disabled={!quizQuestions.length || quizIndex >= quizQuestions.length - 1}
                    onClick={() => setQuizIndex((c) => Math.min(c + 1, Math.max(quizQuestions.length - 1, 0)))}>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </ActionButton>
                </div>
              }>
              {currentQuiz ? (
                <div className="h-full rounded-3xl p-5" style={SUBCARD}>
                  <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: "#a78bfa" }}>
                    Question {quizIndex + 1} of {quizQuestions.length}
                  </p>
                  <h4 className="mt-4 text-lg font-semibold text-white">{currentQuiz.question || "Quiz question"}</h4>
                  <div className="mt-4 space-y-2">
                    {(currentQuiz.options ?? []).map((option, index) => (
                      <div key={`${option}-${index}`} className="rounded-2xl px-4 py-3 text-sm"
                        style={index === currentQuiz.answer_index
                          ? { background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399" }
                          : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)" }}>
                        {String.fromCharCode(65 + index)}. {option}
                      </div>
                    ))}
                  </div>
                  {currentQuiz.explanation ? (
                    <p className="mt-4 break-words text-sm leading-7" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {currentQuiz.explanation}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-3xl p-5 text-sm" style={{ ...SUBCARD, color: "rgba(255,255,255,0.35)" }}>
                  No quiz generated yet.
                </div>
              )}
            </StudioCard>

          {/* ══════════════════════════════════════════════════════════════════
              ROW 6 — Podcast  (full width)
          ══════════════════════════════════════════════════════════════════ */}
            <StudioCard title="Podcast"
              subtitle="Generate a compact spoken recap from the selected transcript."
              actions={
                <div className="flex flex-wrap gap-3">
                  <ActionButton busy={busyKey === "podcast"} onClick={() => void generateArtifact("podcast")}>
                    <Mic2 className="h-4 w-4" />
                    Generate
                  </ActionButton>
                  <ActionButton onClick={playPodcast}>
                    <PlayCircle className="h-4 w-4" />
                    Play script
                  </ActionButton>
                </div>
              }>
              <div className="rounded-3xl p-4" style={SUBCARD}>
                <div className="grid gap-3">
                  {detail.podcast?.script?.length ? (
                    detail.podcast.script.slice(0, 6).map((line, index) => (
                      <div key={`${line.speaker ?? "speaker"}-${index}`}
                        className="rounded-2xl p-4 text-sm leading-7"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.65)" }}>
                        <span className="font-semibold text-white">{line.speaker || "Host"}:</span>{" "}{line.line || ""}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No podcast script generated yet.</p>
                  )}
                </div>
              </div>
            </StudioCard>

          {/* ══════════════════════════════════════════════════════════════════
              ROW 6b — Mind Map  (full width)
          ══════════════════════════════════════════════════════════════════ */}
            <StudioCard title="Mind map"
              subtitle="Generate a structured visual map of the session."
              actions={
                <div className="flex flex-wrap gap-3">
                  <ActionButton busy={busyKey === "mindmap"} onClick={() => void generateArtifact("mindmap")}>
                    <Network className="h-4 w-4" />
                    Generate
                  </ActionButton>
                  <ActionButton onClick={downloadMindMap}>
                    <Download className="h-4 w-4" />
                    Download
                  </ActionButton>
                </div>
              }>
              <MindMapPreview
                mermaid={detail.mind_map?.mermaid}
                outline={detail.mind_map?.outline}
                title={detail.mind_map?.title || detail.title || "Mind Map"}
              />
            </StudioCard>

          {/* ══════════════════════════════════════════════════════════════════
              ROW 7 — Transcript Chat  (full width)
          ══════════════════════════════════════════════════════════════════ */}
          <StudioCard bodyClassName="h-full" title="Transcript chat"
            subtitle="Ask questions against the selected transcript and keep the conversation grounded in session context.">
            <div className="space-y-4">
              <div className="max-h-[360px] space-y-3 overflow-y-auto rounded-3xl p-5" style={SUBCARD}>
                {chatHistory.length ? (
                  chatHistory.map((message, index) => (
                    <div key={`${message.role}-${index}`} className="rounded-2xl px-4 py-3 text-sm leading-7"
                      style={message.role === "user"
                        ? { background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.18)" }
                        : { background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.18)" }}>
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em]"
                        style={{ color: message.role === "user" ? "#00d4ff" : "#a78bfa" }}>
                        {message.role}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.75)" }}>
                        {message.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl px-4 py-3 text-sm" style={{ ...SUBCARD, color: "rgba(255,255,255,0.35)" }}>
                    Ask anything about this transcript and the backend will answer using the selected session context.
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <textarea
                  className="min-h-[110px] flex-1 rounded-3xl px-4 py-3 text-sm outline-none transition placeholder:text-white/25"
                  style={INPUT_STYLE}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about decisions, action items, concepts, or follow-ups."
                  value={chatInput}
                />
                <div className="sm:w-[180px] sm:self-end">
                  <ActionButton busy={busyKey === "chat"} onClick={() => void sendChat()} primary>
                    <MessageSquareText className="h-4 w-4" />
                    Ask Studio
                  </ActionButton>
                </div>
              </div>
            </div>
          </StudioCard>

          {/* ══════════════════════════════════════════════════════════════════
              ROW 8 — Action Items  (full width)
          ══════════════════════════════════════════════════════════════════ */}
                <StudioCard
                  title="Action Items"
                  subtitle="Extract tasks and action items from the meeting transcript."
                  actions={
                    <ActionButton
                      busy={busyKey === "action_items"}
                      onClick={() => void generateActionItems()}
                    >
                      <CheckSquare className="h-4 w-4" />
                      Extract
                    </ActionButton>
                  }
                >
                  {detail.action_items && detail.action_items.length > 0 ? (
                    <div className="space-y-3">
                      {detail.action_items.map(
                        (item: {
                          action: string;
                          owner?: string;
                          due_date?: string;
                          priority?: string;
                          status?: string;
                        }, index: number) => (
                          <div
                            key={index}
                            className="rounded-3xl p-4"
                            style={SUBCARD}
                          >
                            <div className="flex items-start gap-3">
                              <CheckSquare
                                className="h-5 w-5 flex-shrink-0 mt-1"
                                style={{ color: "#00d4ff" }}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-white">{item.action}</p>
                                {item.owner && (
                                  <p
                                    className="text-xs mt-1"
                                    style={{ color: "rgba(255,255,255,0.45)" }}
                                  >
                                    Owner: {item.owner}
                                  </p>
                                )}
                                {item.due_date && (
                                  <p
                                    className="text-xs"
                                    style={{ color: "rgba(255,255,255,0.45)" }}
                                  >
                                    Due: {item.due_date}
                                  </p>
                                )}
                                <div className="mt-2 flex gap-2">
                                  <span
                                    className="text-[10px] font-bold px-2 py-1 rounded-full"
                                    style={
                                      item.priority === "high"
                                        ? { background: "rgba(239,68,68,0.12)", color: "#fca5a5" }
                                        : item.priority === "medium"
                                          ? { background: "rgba(251,191,36,0.12)", color: "#fde68a" }
                                          : { background: "rgba(52,211,153,0.12)", color: "#34d399" }
                                    }
                                  >
                                    {item.priority?.toUpperCase() || "MEDIUM"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <div
                      className="rounded-3xl p-5 text-sm"
                      style={{ ...SUBCARD, color: "rgba(255,255,255,0.35)" }}
                    >
                      No action items extracted yet. Click Extract to generate.
                    </div>
                  )}
                </StudioCard>

          {/* ══════════════════════════════════════════════════════════════════
              ROW 8b — OCR Notes  (full width)
          ══════════════════════════════════════════════════════════════════ */}
                <StudioCard
                  title="Handwritten Notes (OCR)"
                  subtitle="Upload and extract text from handwritten notes or images."
                >
                  <div className="space-y-4">
                    <div
                      className="rounded-3xl p-6 text-center transition cursor-pointer hover:opacity-90"
                      style={{
                        border: "2px dashed rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.02)",
                      }}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e: Event) => {
                          const target = e.target as HTMLInputElement;
                          void handleOCRUpload(target.files?.[0]);
                        };
                        input.click();
                      }}
                    >
                      <Upload
                        className="h-8 w-8 mx-auto mb-2"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      />
                      <p className="text-sm font-semibold text-white">
                        Click to upload image
                      </p>
                      <p
                        className="text-xs mt-1"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      >
                        PNG, JPG, or PDF up to 10MB
                      </p>
                    </div>

                    {detail.uploaded_notes && detail.uploaded_notes.length > 0 && (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {detail.uploaded_notes.map(
                          (
                            note: {
                              timestamp: string;
                              text: string;
                              file_type: string;
                              confidence: string;
                            },
                            index: number,
                          ) => (
                            <div
                              key={index}
                              className="rounded-3xl p-4"
                              style={SUBCARD}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <p
                                  className="text-xs"
                                  style={{ color: "rgba(255,255,255,0.4)" }}
                                >
                                  {new Date(note.timestamp).toLocaleString()}
                                </p>
                                <span
                                  className="text-[10px] font-bold px-2 py-1 rounded-full"
                                  style={
                                    note.confidence === "high"
                                      ? { background: "rgba(52,211,153,0.12)", color: "#34d399" }
                                      : note.confidence === "medium"
                                        ? { background: "rgba(251,191,36,0.12)", color: "#fde68a" }
                                        : { background: "rgba(239,68,68,0.12)", color: "#fca5a5" }
                                  }
                                >
                                  {(note.confidence || "medium").toUpperCase()}
                                </span>
                              </div>
                              <p
                                className="text-xs mb-2"
                                style={{ color: "rgba(255,255,255,0.35)" }}
                              >
                                Type: {note.file_type} • Characters: {(note.text || "").length}
                              </p>
                              <p
                                className="text-sm break-words whitespace-pre-wrap"
                                style={{ color: "rgba(255,255,255,0.65)" }}
                              >
                                {note.text}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </StudioCard>
            </>
          )}
    </div>
  );
}
