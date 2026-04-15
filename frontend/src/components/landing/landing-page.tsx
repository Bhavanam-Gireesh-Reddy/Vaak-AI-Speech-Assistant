import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  FileText,
  Globe2,
  Headphones,
  LayoutDashboard,
  MessageSquare,
  Mic2,
  Network,
  Play,
  ScrollText,
  Sparkles,
  Users,
  Wand2,
  Zap,
} from "lucide-react";

type LandingPageProps = {
  isLoggedIn: boolean;
};

const FEATURE_PILLS = [
  "Live Transcription",
  "11 Languages",
  "AI Studio",
  "Flashcards",
  "Mind Maps",
  "OCR Notes",
  "Sentiment Analysis",
  "Speaker Detection",
  "Podcast Scripts",
  "Transcript Chat",
  "Session History",
];

const LANGUAGE_PAIRS = [
  { flag: "🇮🇳", lang: "हिंदी", delay: "0s" },
  { flag: "🇮🇳", lang: "தமிழ்", delay: "0.3s" },
  { flag: "🇮🇳", lang: "తెలుగు", delay: "0.6s" },
  { flag: "🇮🇳", lang: "ਪੰਜਾਬੀ", delay: "0.9s" },
  { flag: "🇮🇳", lang: "বাংলা", delay: "1.2s" },
  { flag: "🇮🇳", lang: "मराठी", delay: "1.5s" },
  { flag: "🇮🇳", lang: "ಕನ್ನಡ", delay: "1.8s" },
  { flag: "🇮🇳", lang: "മലയാളം", delay: "2.1s" },
  { flag: "🇮🇳", lang: "ગુજરાતી", delay: "2.4s" },
  { flag: "🇮🇳", lang: "ଓଡ଼ିଆ", delay: "2.7s" },
  { flag: "🇮🇳", lang: "অসমীয়া", delay: "3.0s" },
];

const TRANSCRIPT_LINES = [
  { speaker: "S1", text: "Chaliye aaj ke meeting ko shuru karte hain", translated: "Let's start today's meeting", time: "00:01" },
  { speaker: "S2", text: "Haan, main is proposal se bilkul agree karta hoon", translated: "Yes, I completely agree with this proposal", time: "00:08" },
  { speaker: "S1", text: "Quarterly numbers is baar bahut achhe hain", translated: "The quarterly numbers are very good this time", time: "00:15" },
  { speaker: "S2", text: "Team ne is quarter mein kafi mehnat ki hai", translated: "The team worked really hard this quarter", time: "00:23" },
  { speaker: "S1", text: "Next steps ke baare mein baat karte hain ab", translated: "Let's talk about next steps now", time: "00:31" },
  { speaker: "S2", text: "Budget allocation aur timeline fix karna hoga", translated: "We'll need to fix the budget allocation and timeline", time: "00:39" },
  { speaker: "S1", text: "Deployment schedule Q3 mein planned hai", translated: "Deployment schedule is planned for Q3", time: "00:47" },
  { speaker: "S2", text: "Infrastructure scaling bhi is mein include hai", translated: "Infrastructure scaling is also included in this", time: "00:55" },
];

const STUDIO_TOOLS = [
  { icon: Brain, label: "Flashcards", color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: ScrollText, label: "Study Notes", color: "text-sky-400", bg: "bg-sky-500/10" },
  { icon: Network, label: "Mind Maps", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { icon: MessageSquare, label: "Transcript Chat", color: "text-rose-400", bg: "bg-rose-500/10" },
  { icon: Headphones, label: "Podcast Script", color: "text-amber-400", bg: "bg-amber-500/10" },
  { icon: FileText, label: "Quiz Deck", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { icon: Wand2, label: "OCR Notes", color: "text-teal-400", bg: "bg-teal-500/10" },
];

const HOW_STEPS = [
  { number: "01", title: "Open Live workspace", body: "Select your language, pick a mode — translate, transcribe, codemix, or verbatim — then hit Start.", icon: Mic2 },
  { number: "02", title: "Speak naturally", body: "Your words appear in under 150ms. VAD detects silence, waveform pulses in real time.", icon: Zap },
  { number: "03", title: "Get AI insights", body: "Session ends → Groq generates a title, summary, keywords, and full study notes automatically.", icon: Sparkles },
  { number: "04", title: "Explore in Studio", body: "Turn any saved session into flashcards, mind maps, quizzes, podcast scripts, or chat with it.", icon: BookOpen },
];

const BOKEH_DOTS = [
  { size: 8, top: "10%", left: "16%", color: "#00d4ff", delay: "0s", dur: "2.4s" },
  { size: 6, top: "16%", right: "14%", color: "#a78bfa", delay: "0.4s", dur: "2.1s" },
  { size: 5, bottom: "22%", left: "10%", color: "#34d399", delay: "0.8s", dur: "2.7s" },
  { size: 7, bottom: "14%", right: "16%", color: "#f472b6", delay: "1.2s", dur: "2.3s" },
  { size: 4, top: "48%", left: "3%", color: "#fbbf24", delay: "0.6s", dur: "3s" },
  { size: 5, top: "44%", right: "3%", color: "#00d4ff", delay: "0.2s", dur: "2.6s" },
] as { size: number; color: string; delay: string; dur: string; top?: string; left?: string; right?: string; bottom?: string; }[];

export function LandingPage({ isLoggedIn }: LandingPageProps) {
  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "#07070f", color: "#fff", fontFamily: "var(--font-geist-sans), sans-serif" }}
    >
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-5 py-4 sm:px-8 md:px-12 lg:px-16"
        style={{
          background: "rgba(7,7,15,0.82)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg,#7c3aed,#00d4ff)" }}
          >
            <Mic2 className="h-4 w-4 text-white" />
          </span>
          <span className="text-sm font-bold tracking-tight text-white">MeetWise AI</span>
        </div>

        {/* Nav links */}
        <nav className="hidden items-center gap-1 md:flex">
          {[
            { label: "Features", href: "#features" },
            { label: "Pipeline", href: "#pipeline" },
            { label: "Studio", href: "#studio" },
            { label: "How it works", href: "#how" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="rounded-lg px-4 py-2 text-sm transition-colors hover:text-white"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        {isLoggedIn ? (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
            style={{ background: "linear-gradient(135deg,#7c3aed,#00d4ff)", color: "#fff" }}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-xl px-4 py-2 text-sm transition-colors hover:text-white sm:block"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
              style={{ background: "linear-gradient(135deg,#7c3aed,#00d4ff)", color: "#fff" }}
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[95vh] flex-col items-center justify-center overflow-hidden px-4 pb-28 pt-16 text-center">
        {/* Ambient glow blobs */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
          style={{
            width: "1000px",
            height: "650px",
            background: "radial-gradient(ellipse 60% 55% at 50% 0%, rgba(124,58,237,0.32) 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute left-1/4 top-1/3"
          style={{
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle, rgba(0,212,255,0.1) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="pointer-events-none absolute right-1/4 top-1/4"
          style={{
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />

        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Badge */}
        <div
          className="relative mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
          style={{
            background: "rgba(0,212,255,0.08)",
            border: "1px solid rgba(0,212,255,0.22)",
            color: "#67e8f9",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "#00d4ff", boxShadow: "0 0 6px #00d4ff", animation: "pulse 2s ease-in-out infinite" }}
          />
          Live · Sub-150ms · Sarvam AI · Groq LLM
        </div>

        {/* Headline */}
        <h1 className="relative mx-auto max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          <span style={{ color: "#fff" }}>Transcribe. Translate.</span>
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #a78bfa 0%, #00d4ff 50%, #a78bfa 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "gradientShift 4s linear infinite",
            }}
          >
            Understand.
          </span>
        </h1>

        <p
          className="relative mx-auto mt-6 max-w-xl text-base leading-relaxed sm:text-lg"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          Real-time AI meeting assistant for every Indian voice. Stream 16kHz PCM audio over WebSocket
          — words appear as you speak. 11 languages, zero delay.
        </p>

        {/* CTAs */}
        <div className="relative mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={isLoggedIn ? "/live" : "/register"}
            className="inline-flex items-center gap-2.5 rounded-2xl px-7 py-3.5 text-sm font-bold transition hover:opacity-90"
            style={{
              background: "linear-gradient(135deg,#7c3aed,#00d4ff)",
              color: "#fff",
              boxShadow: "0 0 40px rgba(0,212,255,0.25), 0 0 80px rgba(124,58,237,0.2)",
            }}
          >
            <Play className="h-4 w-4" />
            {isLoggedIn ? "Start transcribing" : "Start for free"}
          </Link>
          <Link
            href={isLoggedIn ? "/studio" : "/login"}
            className="inline-flex items-center gap-2.5 rounded-2xl px-7 py-3.5 text-sm font-semibold transition hover:bg-white/[0.07]"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.75)",
            }}
          >
            <Sparkles className="h-4 w-4" />
            Explore AI Studio
          </Link>
        </div>

        {/* ── Sound Core ── */}
        <div className="relative mt-20 flex flex-col items-center">
          {/* Expanding pulse rings */}
          <div
            className="pointer-events-none absolute"
            style={{ width: "400px", height: "400px", top: "-50px", left: "50%", transform: "translateX(-50%)" }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-full"
                style={{
                  border: "1px solid rgba(0,212,255,0.18)",
                  animation: "pulseRing 3s ease-out infinite",
                  animationDelay: `${i * 1}s`,
                }}
              />
            ))}
          </div>

          {/* Core container */}
          <div
            className="relative flex items-center justify-center"
            style={{ width: "300px", height: "300px" }}
          >
            {/* Ambient halo */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, rgba(124,58,237,0.05) 55%, transparent 75%)",
                filter: "blur(16px)",
                animation: "pulse 3s ease-in-out infinite",
              }}
            />

            {/* Rotating orbital rings */}
            <div
              className="absolute rounded-full"
              style={{
                width: "224px",
                height: "224px",
                border: "1px solid rgba(124,58,237,0.28)",
                animation: "spin 16s linear infinite",
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                width: "172px",
                height: "172px",
                border: "1px dashed rgba(0,212,255,0.18)",
                animation: "spin 10s linear infinite reverse",
              }}
            />

            {/* ── Vocal Orb Core ── */}
            <div
              className="relative flex items-center justify-center rounded-full"
              style={{
                width: "112px",
                height: "112px",
                background:
                  "radial-gradient(circle at 35% 30%, rgba(167,139,250,0.95), rgba(124,58,237,0.65) 55%, rgba(7,7,15,0.75))",
                boxShadow:
                  "0 0 80px rgba(0,212,255,0.35), 0 0 160px rgba(124,58,237,0.22), inset 0 1px 1px rgba(255,255,255,0.35)",
              }}
            >
              {/* Inner equalizer bars */}
              <div className="flex items-center gap-[3px]">
                {[50, 80, 100, 65, 90, 72, 55].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: "3px",
                      height: `${h * 0.33}px`,
                      background: "linear-gradient(to top, #00d4ff, rgba(255,255,255,0.92))",
                      borderRadius: "2px",
                      animation: `equalizer ${0.38 + (i % 5) * 0.13}s ease-in-out infinite alternate`,
                      animationDelay: `${i * 0.06}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Bokeh particles */}
            {BOKEH_DOTS.map((dot, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${dot.size}px`,
                  height: `${dot.size}px`,
                  background: dot.color,
                  top: dot.top,
                  left: dot.left,
                  right: dot.right,
                  bottom: dot.bottom,
                  boxShadow: `0 0 ${dot.size * 3}px ${dot.color}`,
                  animation: `float ${dot.dur} ease-in-out infinite alternate`,
                  animationDelay: dot.delay,
                }}
              />
            ))}
          </div>

          {/* Waveform bars below orb */}
          <div className="mt-5 flex items-end justify-center gap-[3px]">
            {[25,42,60,46,76,54,88,66,94,70,52,82,97,56,40,70,54,84,38,64,80,50,68,44,58].map((h, i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: "5px",
                  height: `${h * 0.44}px`,
                  background: "linear-gradient(to top, #7c3aed, #00d4ff)",
                  opacity: 0.42 + (h / 97) * 0.58,
                  animation: `waveform ${0.55 + (i % 7) * 0.09}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.055}s`,
                }}
              />
            ))}
          </div>
          <p
            className="mt-3 text-xs font-mono tracking-wider"
            style={{ color: "rgba(0,212,255,0.4)" }}
          >
            16kHz PCM · Voice Activity Detection · WebSocket Stream
          </p>
        </div>
      </section>

      {/* ── Feature Marquee ────────────────────────────────────────────────── */}
      <section
        className="overflow-hidden py-8"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          className="flex gap-3"
          style={{ animation: "marquee 28s linear infinite", width: "max-content" }}
        >
          {[...FEATURE_PILLS, ...FEATURE_PILLS].map((pill, i) => (
            <span
              key={i}
              className="inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-widest"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background:
                    i % 3 === 0 ? "#a78bfa" : i % 3 === 1 ? "#00d4ff" : "#34d399",
                }}
              />
              {pill}
            </span>
          ))}
        </div>
      </section>

      {/* ── Neural Pipeline ────────────────────────────────────────────────── */}
      <section id="pipeline" className="px-4 py-24 sm:px-8 md:px-12 lg:px-16">
        <div className="mx-auto max-w-6xl">
          {/* Label */}
          <div className="mb-4 flex items-center gap-3">
            <span
              className="h-px flex-1"
              style={{ background: "linear-gradient(to right, transparent, rgba(0,212,255,0.2))" }}
            />
            <span
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: "rgba(0,212,255,0.55)" }}
            >
              Neural Pipeline
            </span>
            <span
              className="h-px flex-1"
              style={{ background: "linear-gradient(to left, transparent, rgba(0,212,255,0.2))" }}
            />
          </div>
          <h2 className="mb-3 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            From Voice to Text in{" "}
            <span style={{ color: "#00d4ff" }}>150ms</span>
          </h2>
          <p
            className="mb-14 text-center text-sm"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            Audio streams through three stages — your words are live before you finish speaking
          </p>

          {/* Pipeline nodes + SVG connectors */}
          <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-start">

            {/* ── Node 1: Mic Input ── */}
            <div
              className="relative flex-1 overflow-hidden rounded-2xl p-6"
              style={{
                background: "rgba(0,212,255,0.035)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(0,212,255,0.16)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-30"
                style={{
                  background: "radial-gradient(circle, rgba(0,212,255,0.4) 0%, transparent 70%)",
                  filter: "blur(24px)",
                }}
              />
              <div className="mb-4 flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: "#00d4ff", boxShadow: "0 0 8px #00d4ff", animation: "pulse 1.5s ease-in-out infinite" }}
                />
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: "#00d4ff" }}
                >
                  Active
                </span>
              </div>
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.22)" }}
              >
                <Mic2 className="h-7 w-7" style={{ color: "#00d4ff", filter: "drop-shadow(0 0 6px #00d4ff)" }} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">Mic Input</h3>
              <p className="mb-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                Browser MediaStream API captures 16kHz mono PCM audio. Voice Activity Detection filters silence in real time.
              </p>
              <div
                className="rounded-xl px-3 py-2 font-mono text-xs"
                style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.1)", color: "rgba(0,212,255,0.65)" }}
              >
                16kHz · PCM · VAD · WebSocket
              </div>
            </div>

            {/* ── Connector 1→2 ── */}
            <div className="flex h-10 w-full items-center lg:h-auto lg:w-16 lg:flex-col lg:justify-center lg:pt-16">
              <div className="relative flex h-[2px] w-full flex-1 items-center overflow-hidden rounded-full lg:h-[60px] lg:w-[2px]">
                <div
                  className="absolute inset-0"
                  style={{ background: "rgba(124,58,237,0.15)" }}
                />
                {/* Flowing gradient - horizontal on mobile, vertical on desktop via background-image direction */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, #7c3aed 40%, #00d4ff 60%, transparent 100%)",
                    backgroundSize: "200% 100%",
                    animation: "connectorFlow 2s linear infinite",
                  }}
                />
              </div>
              {/* Arrow chevron */}
              <div className="mx-1.5 flex-shrink-0 lg:my-1.5 lg:rotate-90" style={{ color: "rgba(0,212,255,0.55)" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7h9M7.5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* ── Node 2: Neural Processor ── */}
            <div
              className="relative flex-1 overflow-hidden rounded-2xl p-6"
              style={{
                background: "rgba(124,58,237,0.06)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(124,58,237,0.22)",
                boxShadow: "0 8px 32px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full opacity-30"
                style={{
                  background: "radial-gradient(circle, rgba(124,58,237,0.5) 0%, transparent 70%)",
                  filter: "blur(24px)",
                }}
              />
              <div className="mb-4 flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: "#a78bfa", boxShadow: "0 0 8px #7c3aed", animation: "pulse 1.8s ease-in-out infinite" }}
                />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "#a78bfa" }}>
                  Processing
                </span>
              </div>
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}
              >
                <Brain className="h-7 w-7" style={{ color: "#a78bfa", filter: "drop-shadow(0 0 6px #7c3aed)" }} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">Neural Processor</h3>
              <p className="mb-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                Sarvam AI Whisper-based model processes audio chunks. Groq LLM adds context, speaker detection and translation.
              </p>
              <div
                className="rounded-xl px-3 py-2 font-mono text-xs"
                style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.12)", color: "rgba(167,139,250,0.7)" }}
              >
                Sarvam AI · Groq · &lt;150ms
              </div>
            </div>

            {/* ── Connector 2→3 ── */}
            <div className="flex h-10 w-full items-center lg:h-auto lg:w-16 lg:flex-col lg:justify-center lg:pt-16">
              <div className="relative flex h-[2px] w-full flex-1 items-center overflow-hidden rounded-full lg:h-[60px] lg:w-[2px]">
                <div className="absolute inset-0" style={{ background: "rgba(52,211,153,0.15)" }} />
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, #7c3aed 40%, #00d4ff 60%, transparent 100%)",
                    backgroundSize: "200% 100%",
                    animation: "connectorFlow 2s linear infinite",
                    animationDelay: "0.6s",
                  }}
                />
              </div>
              <div className="mx-1.5 flex-shrink-0 lg:my-1.5 lg:rotate-90" style={{ color: "rgba(0,212,255,0.55)" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7h9M7.5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* ── Node 3: Live Text ── */}
            <div
              className="relative flex-1 overflow-hidden rounded-2xl p-6"
              style={{
                background: "rgba(52,211,153,0.04)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(52,211,153,0.18)",
                boxShadow: "0 8px 32px rgba(52,211,153,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-25"
                style={{
                  background: "radial-gradient(circle, rgba(52,211,153,0.5) 0%, transparent 70%)",
                  filter: "blur(24px)",
                }}
              />
              <div className="mb-4 flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: "#34d399", boxShadow: "0 0 8px #34d399", animation: "pulse 2s ease-in-out infinite" }}
                />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "#34d399" }}>
                  Output
                </span>
              </div>
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.22)" }}
              >
                <ScrollText className="h-7 w-7" style={{ color: "#34d399", filter: "drop-shadow(0 0 6px #34d399)" }} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">Live Text</h3>
              <p className="mb-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                Transcript streams to your screen as you speak. Full JSON metadata with speaker, language, and confidence score.
              </p>
              <div
                className="rounded-xl px-3 py-2 font-mono text-xs"
                style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.1)", color: "rgba(52,211,153,0.65)" }}
              >
                JSON · Speaker · Confidence · Timestamps
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bento Grid ─────────────────────────────────────────────────────── */}
      <section id="features" className="px-4 py-24 sm:px-8 md:px-12 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.08))" }} />
            <span className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.3)" }}>
              Core capabilities
            </span>
            <span className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, rgba(255,255,255,0.08))" }} />
          </div>
          <h2 className="mb-14 text-center text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Everything in one place
          </h2>

          {/* ── Bento Grid ── */}
          <div className="grid gap-4 lg:grid-cols-12">

            {/* ── Translation Card (7 cols) ── */}
            <div
              className="relative overflow-hidden rounded-2xl p-6 lg:col-span-7"
              style={{
                background: "rgba(255,255,255,0.03)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(0,212,255,0.12)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              {/* Glow accents */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full" style={{ background: "radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)", filter: "blur(30px)" }} />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)", filter: "blur(30px)" }} />

              <div className="relative">
                <div
                  className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                  style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#67e8f9" }}
                >
                  <Globe2 className="h-3 w-3" />
                  Real-time Translation
                </div>
                <h3 className="mb-1.5 text-xl font-bold text-white">11 Indian Languages → English</h3>
                <p className="mb-6 text-sm" style={{ color: "rgba(255,255,255,0.42)" }}>
                  Simultaneous translation as you speak. No post-processing delay — every word in, every word out.
                </p>

                {/* Language grid with floating animation */}
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {LANGUAGE_PAIRS.slice(0, 8).map(({ flag, lang, delay }) => (
                    <div
                      key={lang}
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        animation: "flagFloat 3.5s ease-in-out infinite",
                        animationDelay: delay,
                      }}
                    >
                      <span className="text-base leading-none">{flag}</span>
                      <span className="truncate text-xs font-semibold text-white">{lang}</span>
                    </div>
                  ))}
                </div>

                {/* Arrow bar */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-px flex-1" style={{ background: "linear-gradient(to right, rgba(0,212,255,0.3), transparent)" }} />
                  <span className="text-xs font-mono" style={{ color: "rgba(0,212,255,0.5)" }}>→ English</span>
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full"
                    style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)" }}
                  >
                    <span className="text-xs">🇬🇧</span>
                  </span>
                </div>
              </div>
            </div>

            {/* ── Right column: two stat cards (5 cols) ── */}
            <div className="flex flex-col gap-4 lg:col-span-5">
              {/* Latency stat card */}
              <div
                className="relative flex-1 overflow-hidden rounded-2xl p-6"
                style={{
                  background: "rgba(124,58,237,0.06)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(124,58,237,0.2)",
                  boxShadow: "0 8px 32px rgba(124,58,237,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)", filter: "blur(20px)" }} />
                <p className="relative mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(167,139,250,0.6)" }}>
                  Transcription Latency
                </p>
                <p
                  className="relative text-5xl font-bold tracking-tight"
                  style={{
                    background: "linear-gradient(90deg,#a78bfa,#00d4ff)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  &lt;150ms
                </p>
                <p className="relative mt-2 text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>
                  Sub-second · Words appear as spoken
                </p>
                {/* Mini waveform */}
                <div className="relative mt-4 flex items-end gap-[2px]">
                  {[35,55,80,60,90,70,45,75,95,60,40,70].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: "4px",
                        height: `${h * 0.35}px`,
                        background: "linear-gradient(to top, #7c3aed, #00d4ff)",
                        borderRadius: "2px",
                        opacity: 0.5 + (h / 95) * 0.5,
                        animation: `waveform ${0.5 + (i % 5) * 0.1}s ease-in-out infinite alternate`,
                        animationDelay: `${i * 0.07}s`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Language count stat card */}
              <div
                className="relative flex-1 overflow-hidden rounded-2xl p-6"
                style={{
                  background: "rgba(0,212,255,0.04)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(0,212,255,0.14)",
                  boxShadow: "0 8px 32px rgba(0,212,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <div className="pointer-events-none absolute -bottom-10 -right-10 h-36 w-36 rounded-full" style={{ background: "radial-gradient(circle, rgba(0,212,255,0.2) 0%, transparent 70%)", filter: "blur(20px)" }} />
                <p className="relative mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(0,212,255,0.55)" }}>
                  Indian Languages
                </p>
                <p
                  className="relative text-5xl font-bold tracking-tight"
                  style={{ color: "#00d4ff", textShadow: "0 0 40px rgba(0,212,255,0.4)" }}
                >
                  11
                </p>
                <p className="relative mt-2 text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>
                  Hindi, Tamil, Telugu + 8 more
                </p>
                {/* Mode pills */}
                <div className="relative mt-3 flex flex-wrap gap-1.5">
                  {["Translate", "Transcribe", "Codemix", "Verbatim"].map((mode) => (
                    <span
                      key={mode}
                      className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                      style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.14)", color: "rgba(0,212,255,0.7)" }}
                    >
                      {mode}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Dynamic Transcript Window (full width) ── */}
            <div
              className="relative overflow-hidden rounded-2xl lg:col-span-12"
              style={{
                background: "rgba(255,255,255,0.025)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              {/* Window title bar */}
              <div
                className="flex items-center gap-3 border-b px-5 py-3"
                style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.025)" }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: "#ef4444", boxShadow: "0 0 6px rgba(239,68,68,0.7)", animation: "pulse 1s ease-in-out infinite" }}
                />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Live Transcript
                </span>
                <div className="ml-auto flex items-center gap-3">
                  <span className="hidden text-[10px] font-mono sm:block" style={{ color: "rgba(255,255,255,0.2)" }}>
                    hi-IN → en · Speaker Diarization ON
                  </span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
                  >
                    ● REC 00:55
                  </span>
                </div>
              </div>

              {/* Scrolling transcript */}
              <div className="relative overflow-hidden" style={{ height: "220px" }}>
                {/* Fade masks */}
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10" style={{ background: "linear-gradient(to bottom, rgba(10,10,20,0.92), transparent)" }} />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10" style={{ background: "linear-gradient(to top, rgba(10,10,20,0.92), transparent)" }} />

                <div style={{ animation: "transcriptScroll 16s linear infinite" }}>
                  {[...TRANSCRIPT_LINES, ...TRANSCRIPT_LINES].map((line, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 border-b px-5 py-3"
                      style={{
                        borderColor: "rgba(255,255,255,0.04)",
                        background:
                          i % TRANSCRIPT_LINES.length === 4
                            ? "rgba(0,212,255,0.04)"
                            : "transparent",
                      }}
                    >
                      {/* Speaker badge */}
                      <span
                        className="mt-0.5 inline-flex h-5 w-6 shrink-0 items-center justify-center rounded text-[9px] font-bold"
                        style={{
                          background:
                            line.speaker === "S1"
                              ? "rgba(124,58,237,0.2)"
                              : "rgba(0,212,255,0.15)",
                          color: line.speaker === "S1" ? "#a78bfa" : "#00d4ff",
                        }}
                      >
                        {line.speaker}
                      </span>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-white">{line.text}</p>
                        <p className="mt-0.5 text-[11px]" style={{ color: "rgba(0,212,255,0.55)" }}>
                          {line.translated}
                        </p>
                      </div>

                      {/* Timestamp */}
                      <span className="shrink-0 text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                        {line.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Live Terminal (7 cols) ── */}
            <div
              className="relative overflow-hidden rounded-2xl lg:col-span-7"
              style={{
                background: "#080d0a",
                border: "1px solid rgba(52,211,153,0.16)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(52,211,153,0.05)",
              }}
            >
              {/* Terminal header */}
              <div
                className="flex items-center gap-2 border-b px-4 py-2.5"
                style={{ borderColor: "rgba(52,211,153,0.1)", background: "rgba(52,211,153,0.025)" }}
              >
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ef4444", opacity: 0.65 }} />
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#f59e0b", opacity: 0.65 }} />
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#22c55e", opacity: 0.65 }} />
                </div>
                <span className="ml-2 text-xs font-mono" style={{ color: "rgba(52,211,153,0.55)" }}>
                  transcript_stream.json
                </span>
                <span
                  className="ml-auto h-1.5 w-1.5 rounded-full"
                  style={{ background: "#34d399", boxShadow: "0 0 6px #34d399", animation: "pulse 1.5s ease-in-out infinite" }}
                />
              </div>

              {/* JSON output */}
              <div className="px-5 py-4 font-mono text-[11px] leading-[1.7]" style={{ color: "#34d399" }}>
                <p>
                  <span style={{ color: "rgba(52,211,153,0.45)" }}>$</span>{" "}
                  <span style={{ color: "rgba(255,255,255,0.55)" }}>meetwise stream --session sws_a3f9b2c1</span>
                </p>
                <p className="mt-2" style={{ color: "rgba(52,211,153,0.4)" }}>{"{"}</p>
                <p className="pl-4">
                  <span style={{ color: "#67e8f9" }}>{'"session_id"'}</span>
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>: </span>
                  <span style={{ color: "#fbbf24" }}>{'"sws_a3f9b2c1"'}</span>
                  <span style={{ color: "rgba(255,255,255,0.25)" }}>,</span>
                </p>
                <p className="pl-4">
                  <span style={{ color: "#67e8f9" }}>{'"timestamp"'}</span>
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>: </span>
                  <span style={{ color: "#a78bfa" }}>1715284974</span>
                  <span style={{ color: "rgba(255,255,255,0.25)" }}>,</span>
                </p>
                <p className="pl-4">
                  <span style={{ color: "#67e8f9" }}>{'"speaker"'}</span>
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>: </span>
                  <span style={{ color: "#fbbf24" }}>{'"Speaker 1"'}</span>
                  <span style={{ color: "rgba(255,255,255,0.25)" }}>,</span>
                </p>
                <p className="pl-4">
                  <span style={{ color: "#67e8f9" }}>{'"text"'}</span>
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>: </span>
                  <span style={{ color: "#fbbf24" }}>{'"Chaliye meeting shuru karte hain"'}</span>
                  <span style={{ color: "rgba(255,255,255,0.25)" }}>,</span>
                </p>
                <p className="pl-4">
                  <span style={{ color: "#67e8f9" }}>{'"language"'}</span>
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>: </span>
                  <span style={{ color: "#fbbf24" }}>{'"hi-IN"'}</span>
                  <span style={{ color: "rgba(255,255,255,0.25)" }}>,</span>
                </p>
                <p className="pl-4">
                  <span style={{ color: "#67e8f9" }}>{'"confidence"'}</span>
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>: </span>
                  <span style={{ color: "#34d399" }}>0.97</span>
                  <span style={{ color: "rgba(255,255,255,0.25)" }}>,</span>
                </p>
                <p className="pl-4">
                  <span style={{ color: "#67e8f9" }}>{'"latency_ms"'}</span>
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>: </span>
                  <span style={{ color: "#34d399" }}>142</span>
                  <span style={{ color: "rgba(255,255,255,0.25)" }}>,</span>
                </p>
                <p className="pl-4">
                  <span style={{ color: "#67e8f9" }}>{'"translated"'}</span>
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>: </span>
                  <span style={{ color: "#fbbf24" }}>{'"Let\'s start the meeting"'}</span>
                </p>
                <p style={{ color: "rgba(52,211,153,0.4)" }}>{"}"}</p>
                <p className="mt-1">
                  <span style={{ color: "rgba(52,211,153,0.4)" }}>▶ </span>
                  <span style={{ color: "rgba(52,211,153,0.6)" }}>Streaming next chunk</span>
                  <span style={{ animation: "terminalBlink 1s step-end infinite" }}>_</span>
                </p>
              </div>
            </div>

            {/* ── Modes card (5 cols) ── */}
            <div
              className="overflow-hidden rounded-2xl p-6 lg:col-span-5"
              style={{
                background: "rgba(255,255,255,0.025)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.28)" }}>
                Transcription Modes
              </p>
              <h3 className="mb-5 text-lg font-bold text-white">Four ways to capture speech</h3>
              <div className="space-y-3">
                {[
                  { mode: "Translate", desc: "Any Indian language → clean English", color: "#00d4ff" },
                  { mode: "Transcribe", desc: "Exact original language, as spoken", color: "#a78bfa" },
                  { mode: "Codemix", desc: "Natural Hinglish / mixed-language", color: "#34d399" },
                  { mode: "Verbatim", desc: "Every word including uh, um, hmm", color: "#f472b6" },
                ].map(({ mode, desc, color }) => (
                  <div key={mode} className="flex items-center gap-3">
                    <span
                      className="h-1.5 w-5 shrink-0 rounded-full"
                      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                    />
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-white">{mode}</span>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
                        {" · "}{desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Studio link */}
              <Link
                href={isLoggedIn ? "/live" : "/register"}
                className="mt-6 inline-flex items-center gap-2 text-xs font-semibold transition-opacity hover:opacity-70"
                style={{ color: "#00d4ff" }}
              >
                Start transcribing
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* ── Stats row ── */}
          <div
            className="mt-4 grid grid-cols-2 overflow-hidden rounded-2xl lg:grid-cols-4"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {[
              { val: "<150ms", label: "Transcription latency", color: "#00d4ff" },
              { val: "11", label: "Indian languages", color: "#a78bfa" },
              { val: "4", label: "Transcription modes", color: "#34d399" },
              { val: "8+", label: "AI Studio tools", color: "#f472b6" },
            ].map(({ val, label, color }, i) => (
              <div
                key={label}
                className="px-8 py-8 text-center"
                style={{
                  borderRight: i < 3 ? "1px solid rgba(255,255,255,0.07)" : undefined,
                  borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.07)" : undefined,
                  background: "rgba(255,255,255,0.012)",
                }}
              >
                <p className="text-3xl font-bold tracking-tight" style={{ color }}>
                  {val}
                </p>
                <p className="mt-1 text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Studio ──────────────────────────────────────────────────────── */}
      <section id="studio" className="px-4 py-24 sm:px-8 md:px-12 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div
            className="relative overflow-hidden rounded-3xl p-8 sm:p-12 lg:p-16"
            style={{
              background: "linear-gradient(145deg, rgba(124,58,237,0.1), rgba(0,212,255,0.05))",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(124,58,237,0.2)",
              boxShadow: "0 0 60px rgba(124,58,237,0.08)",
            }}
          >
            {/* Background glows */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%)", filter: "blur(40px)" }} />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(0,212,255,0.14) 0%, transparent 70%)", filter: "blur(40px)" }} />

            <div className="relative grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              {/* Left text */}
              <div>
                <div
                  className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
                  style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" }}
                >
                  <Sparkles className="h-3 w-3" />
                  AI Studio
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  One session.
                  <br />
                  <span
                    style={{
                      background: "linear-gradient(90deg,#a78bfa,#00d4ff)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Infinite outputs.
                  </span>
                </h2>
                <p className="mt-4 text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.48)" }}>
                  Every saved transcript becomes a launchpad. AI Studio turns what was said into
                  flashcards, mind maps, quizzes, podcast scripts, and rich study notes — all
                  grounded in your actual content.
                </p>
                <Link
                  href={isLoggedIn ? "/studio" : "/register"}
                  className="mt-8 inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg,#7c3aed,#00d4ff)",
                    color: "#fff",
                    boxShadow: "0 0 30px rgba(124,58,237,0.35)",
                  }}
                >
                  {isLoggedIn ? "Open Studio" : "Try AI Studio"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Right tool grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                {STUDIO_TOOLS.map(({ icon: Icon, label, color, bg }) => (
                  <div
                    key={label}
                    className="group flex flex-col items-center gap-3 rounded-2xl p-4 text-center transition hover:-translate-y-0.5"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ${color}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.58)" }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section id="how" className="px-4 py-24 sm:px-8 md:px-12 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.08))" }} />
            <span className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.28)" }}>
              How it works
            </span>
            <span className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, rgba(255,255,255,0.08))" }} />
          </div>
          <h2 className="mb-16 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            From voice to insight in minutes
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_STEPS.map(({ number, title, body, icon: Icon }, i) => (
              <div key={number} className="relative">
                {/* Animated connector */}
                {i < HOW_STEPS.length - 1 && (
                  <div className="absolute right-0 top-9 hidden h-[2px] w-1/2 translate-x-full overflow-hidden lg:block" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div
                      className="absolute inset-0"
                      style={{
                        background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.5), transparent)",
                        backgroundSize: "200% 100%",
                        animation: "connectorFlow 2.5s linear infinite",
                        animationDelay: `${i * 0.4}s`,
                      }}
                    />
                  </div>
                )}

                <div
                  className="h-full rounded-2xl p-6 transition hover:-translate-y-0.5"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="mb-5 flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
                      style={{
                        background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(0,212,255,0.3))",
                        border: "1px solid rgba(124,58,237,0.3)",
                        color: "#a78bfa",
                      }}
                    >
                      {number}
                    </span>
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)" }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="px-4 py-24 sm:px-8 md:px-12 lg:px-16">
        <div
          className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl px-8 py-20 text-center"
          style={{
            background: "rgba(255,255,255,0.02)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(124,58,237,0.2)",
          }}
        >
          {/* Glow */}
          <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.28) 0%, transparent 65%)" }} />
          <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(0,212,255,0.1) 0%, transparent 65%)" }} />

          <div className="relative">
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
              style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", color: "#a78bfa" }}
            >
              <Users className="h-3 w-3" />
              Start today
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Every word captured.
              <br />
              Every insight unlocked.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-base" style={{ color: "rgba(255,255,255,0.42)" }}>
              No downloads. Works in your browser. Free to start. Begin
              transcribing in under 30 seconds.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {isLoggedIn ? (
                <Link
                  href="/live"
                  className="inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-sm font-bold transition hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg,#7c3aed,#00d4ff)",
                    color: "#fff",
                    boxShadow: "0 0 40px rgba(0,212,255,0.25), 0 0 80px rgba(124,58,237,0.2)",
                  }}
                >
                  <Play className="h-4 w-4" />
                  Start a session
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-sm font-bold transition hover:opacity-90"
                    style={{
                      background: "linear-gradient(135deg,#7c3aed,#00d4ff)",
                      color: "#fff",
                      boxShadow: "0 0 40px rgba(0,212,255,0.25), 0 0 80px rgba(124,58,237,0.2)",
                    }}
                  >
                    Create free account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-sm font-semibold"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.65)",
                    }}
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer
        className="px-4 py-10 sm:px-8 md:px-12 lg:px-16"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: "linear-gradient(135deg,#7c3aed,#00d4ff)" }}
            >
              <Mic2 className="h-3.5 w-3.5 text-white" />
            </span>
            <span className="text-sm font-bold text-white">MeetWise AI</span>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
            Sarvam AI · Groq LLM · MongoDB · FastAPI · Next.js
          </p>
          <div className="flex gap-5 text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
            <Link href="/login" className="transition-colors hover:text-white">Sign in</Link>
            <Link href="/register" className="transition-colors hover:text-white">Register</Link>
          </div>
        </div>
      </footer>

      {/* ── Keyframes ──────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes waveform {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%       { opacity: 1; transform: scale(1.08); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes float {
          from { transform: translateY(0px); }
          to   { transform: translateY(-12px); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes equalizer {
          from { transform: scaleY(0.25); }
          to   { transform: scaleY(1); }
        }
        @keyframes connectorFlow {
          0%   { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes transcriptScroll {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes flagFloat {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50%       { transform: translateY(-6px) rotate(1deg); }
        }
        @keyframes terminalBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
