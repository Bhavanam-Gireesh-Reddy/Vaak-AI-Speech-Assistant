import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  FileText,
  Flame,
  Globe2,
  Headphones,
  LayoutDashboard,
  Layers,
  MessageSquare,
  Mic2,
  Network,
  Play,
  Radio,
  ScrollText,
  Sparkles,
  Upload,
  Users,
  Video,
  Wand2,
  Zap,
} from "lucide-react";

type LandingPageProps = {
  isLoggedIn: boolean;
};

const FEATURES = [
  {
    icon: Radio,
    color: "sky",
    title: "Live Transcription",
    description:
      "Sub-150ms latency real-time speech-to-text via WebSocket streaming. Hear yourself transcribed as you speak.",
  },
  {
    icon: Globe2,
    color: "emerald",
    title: "11 Indian Languages",
    description:
      "Supports Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, Odia, Punjabi & more.",
  },
  {
    icon: Wand2,
    color: "violet",
    title: "AI Study Notes",
    description:
      "Auto-generates rich Markdown notes with tables, LaTeX equations, and Mermaid diagrams from any session.",
  },
  {
    icon: Brain,
    color: "pink",
    title: "Flashcards & Quizzes",
    description:
      "Turn transcripts into interactive animated flashcard carousels and stacked quiz decks instantly.",
  },
  {
    icon: Network,
    color: "amber",
    title: "Mind Maps",
    description:
      "Generate visual Mermaid mind maps to explore key concepts and relationships in your content.",
  },
  {
    icon: MessageSquare,
    color: "cyan",
    title: "Chat with Transcript",
    description:
      "Ask questions directly about your session content — grounded, context-aware AI answers only.",
  },
  {
    icon: Video,
    color: "rose",
    title: "YouTube Import",
    description:
      "Pull captions from any YouTube video into the study workflow with smart bot-protection bypass.",
  },
  {
    icon: Upload,
    color: "teal",
    title: "OCR from Images",
    description:
      "Upload handwritten notes or lecture slides — extract text via Tesseract or EasyOCR automatically.",
  },
  {
    icon: Users,
    color: "indigo",
    title: "Speaker Identification",
    description:
      "Inferred multi-speaker turn detection shown live and saved to session metadata.",
  },
  {
    icon: Flame,
    color: "orange",
    title: "Sentiment Analysis",
    description:
      "Real-time tone tracking across transcript segments — monitor emotional cadence as it unfolds.",
  },
  {
    icon: Mic2,
    color: "sky",
    title: "4 Transcription Modes",
    description:
      "Translate, Transcribe, Codemix (Hinglish), or Verbatim — choose the output format that fits your need.",
  },
  {
    icon: Layers,
    color: "violet",
    title: "AI Podcast Scripts",
    description:
      "Convert any session into a polished multi-speaker podcast script ready for recording.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Start recording",
    description:
      "Click Start, allow microphone access, and choose your language and mode. Live transcription begins instantly.",
    icon: Mic2,
  },
  {
    step: "02",
    title: "Session is analysed",
    description:
      "When you stop, Groq LLM automatically generates a title, summary, keywords, and study notes.",
    icon: Sparkles,
  },
  {
    step: "03",
    title: "Explore in Studio",
    description:
      "Open any saved session in AI Studio to generate flashcards, quizzes, mind maps, podcasts, and more.",
    icon: BookOpen,
  },
];

const STATS = [
  { value: "<150ms", label: "Transcription latency" },
  { value: "11", label: "Indian languages" },
  { value: "4", label: "Transcription modes" },
  { value: "6+", label: "AI Studio tools" },
];

const COLOR_MAP: Record<string, { bg: string; text: string; ring: string }> = {
  sky: { bg: "bg-sky-50", text: "text-sky-600", ring: "ring-sky-100" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100" },
  violet: { bg: "bg-violet-50", text: "text-violet-600", ring: "ring-violet-100" },
  pink: { bg: "bg-pink-50", text: "text-pink-600", ring: "ring-pink-100" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-600", ring: "ring-cyan-100" },
  rose: { bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-100" },
  teal: { bg: "bg-teal-50", text: "text-teal-600", ring: "ring-teal-100" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", ring: "ring-indigo-100" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", ring: "ring-orange-100" },
};

export function LandingPage({ isLoggedIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── Navbar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-white shadow-lg shadow-sky-500/30">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-sky-400">
                MeetWise AI
              </p>
              <p className="text-sm font-semibold text-white leading-none">
                Meeting Assistant
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {["Features", "How it works", "Studio"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="rounded-xl px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-950 pb-24 pt-20 sm:pb-32 sm:pt-28">
        {/* Background glow blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-sky-600/20 blur-[120px]" />
          <div className="absolute -right-40 top-10 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[120px]" />
          <div className="absolute bottom-0 left-1/2 h-[300px] w-[800px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[100px]" />
        </div>

        {/* Grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-sky-400">
            <Zap className="h-3 w-3" />
            Powered by Sarvam AI · Groq LLM
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Real-time transcription
            <br />
            <span className="bg-gradient-to-r from-sky-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
              for every Indian voice
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
            Sub-150ms speech-to-text across 11 Indian languages. Auto-generate
            study notes, flashcards, mind maps, and podcast scripts — all from a
            single session.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {isLoggedIn ? (
              <Link
                href="/live"
                className="inline-flex items-center gap-2.5 rounded-2xl bg-sky-500 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-sky-500/40 transition hover:bg-sky-400 hover:shadow-sky-400/40"
              >
                <Play className="h-4 w-4" />
                Start transcribing
              </Link>
            ) : (
              <Link
                href="/register"
                className="inline-flex items-center gap-2.5 rounded-2xl bg-sky-500 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-sky-500/40 transition hover:bg-sky-400 hover:shadow-sky-400/40"
              >
                <Play className="h-4 w-4" />
                Start for free
              </Link>
            )}
            <Link
              href={isLoggedIn ? "/studio" : "/login"}
              className="inline-flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:border-white/30 hover:bg-white/10"
            >
              <Sparkles className="h-4 w-4" />
              Explore AI Studio
            </Link>
          </div>

          {/* Waveform visual */}
          <div className="mx-auto mt-16 flex max-w-lg items-end justify-center gap-1 sm:gap-1.5">
            {[
              40, 65, 85, 55, 90, 70, 45, 80, 60, 95, 50, 75, 85, 40, 70,
              60, 88, 45, 72, 95, 55, 80, 65, 40, 78, 90, 50, 68, 85, 45,
            ].map((height, i) => (
              <div
                key={i}
                className="w-1.5 sm:w-2 rounded-full bg-gradient-to-t from-sky-600 to-cyan-400"
                style={{
                  height: `${height * 0.7}px`,
                  opacity: 0.6 + (height / 95) * 0.4,
                  animation: `waveform ${0.8 + (i % 5) * 0.15}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Live waveform · Real-time VAD · ~16 kHz PCM streaming
          </p>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-slate-200 lg:grid-cols-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="px-6 py-8 text-center sm:py-10">
              <p className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {value}
              </p>
              <p className="mt-1.5 text-xs font-medium uppercase tracking-widest text-slate-500">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ───────────────────────────────────────── */}
      <section id="features" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-sky-700">
              <Sparkles className="h-3 w-3" />
              Everything you need
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Built for the way you learn
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-500">
              From live capture to AI-powered study tools — every feature is
              designed to reduce the gap between hearing and understanding.
            </p>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {FEATURES.map(({ icon: Icon, color, title, description }) => {
              const c = COLOR_MAP[color] ?? COLOR_MAP.sky;
              return (
                <div
                  key={title}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <span
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-4 ${c.bg} ${c.text} ${c.ring}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-slate-950">
                    {title}
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    {description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-violet-700">
              <Zap className="h-3 w-3" />
              Three steps
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              From speech to insights instantly
            </h2>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {STEPS.map(({ step, title, description, icon: Icon }, i) => (
              <div key={step} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="absolute right-0 top-8 hidden h-px w-1/2 translate-x-full bg-gradient-to-r from-slate-300 to-transparent sm:block" />
                )}
                <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-xs font-bold text-white">
                      {step}
                    </span>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-950">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Studio highlight ────────────────────────────────────── */}
      <section id="studio" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-2xl">
            {/* Inner glow */}
            <div className="pointer-events-none absolute -top-20 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
            <div className="relative grid gap-0 lg:grid-cols-2">
              {/* Text */}
              <div className="p-10 sm:p-14 lg:p-16">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-violet-400">
                  <Sparkles className="h-3 w-3" />
                  AI Studio
                </div>
                <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Your transcripts become{" "}
                  <span className="text-violet-400">learning material</span>
                </h2>
                <p className="mt-4 text-base leading-8 text-slate-400">
                  One session, infinite outputs. AI Studio transforms any saved
                  transcript into study assets — all grounded in what was actually
                  said, nothing hallucinated.
                </p>
                <ul className="mt-8 space-y-3">
                  {[
                    { icon: Brain, label: "Interactive flashcard carousels" },
                    { icon: FileText, label: "Rich Markdown study notes" },
                    { icon: Network, label: "Mermaid mind maps" },
                    { icon: MessageSquare, label: "Chat with your transcript" },
                    { icon: Headphones, label: "Multi-speaker podcast scripts" },
                    { icon: ScrollText, label: "Structured quiz decks" },
                  ].map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-3 text-sm text-slate-300">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>
                <Link
                  href={isLoggedIn ? "/studio" : "/register"}
                  className="mt-10 inline-flex items-center gap-2 rounded-2xl bg-violet-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-400"
                >
                  <Sparkles className="h-4 w-4" />
                  {isLoggedIn ? "Open Studio" : "Try AI Studio"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Visual card grid */}
              <div className="flex items-center justify-center p-10 sm:p-14 lg:p-12">
                <div className="grid w-full max-w-sm gap-3">
                  {[
                    { color: "sky", icon: Radio, title: "Live Session", detail: "Hindi → English · 12 min" },
                    { color: "violet", icon: Brain, title: "12 Flashcards generated", detail: "Animated carousel · Tap to reveal" },
                    { color: "emerald", icon: Network, title: "Mind Map ready", detail: "Mermaid diagram · 8 nodes" },
                    { color: "amber", icon: FileText, title: "Study Notes", detail: "Markdown + LaTeX equations" },
                  ].map(({ color, icon: Icon, title, detail }) => {
                    const c = COLOR_MAP[color] ?? COLOR_MAP.sky;
                    return (
                      <div
                        key={title}
                        className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur"
                      >
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c.bg} ${c.text}`}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{title}</p>
                          <p className="truncate text-xs text-slate-400">{detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="bg-slate-950 py-20 sm:py-28">
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/15 blur-[80px]" />
          </div>
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-400">
              Get started today
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Every word, captured and understood
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-slate-400">
              Join MeetWise AI and never lose a spoken idea again. Free to start,
              works instantly in your browser — no downloads required.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {isLoggedIn ? (
                <Link
                  href="/live"
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-sky-500 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-sky-500/40 transition hover:bg-sky-400"
                >
                  <Play className="h-4 w-4" />
                  Start a new session
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2.5 rounded-2xl bg-sky-500 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-sky-500/40 transition hover:bg-sky-400"
                  >
                    Create free account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-semibold text-white">MeetWise AI</span>
          </div>
          <p className="text-xs text-slate-500">
            Powered by Sarvam AI · Groq · MongoDB · FastAPI · Next.js
          </p>
          <div className="flex gap-4 text-xs text-slate-500">
            <Link href="/login" className="transition hover:text-white">Sign in</Link>
            <Link href="/register" className="transition hover:text-white">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
