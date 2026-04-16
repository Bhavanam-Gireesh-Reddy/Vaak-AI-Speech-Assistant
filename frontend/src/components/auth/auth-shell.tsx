import Link from "next/link";
import { ArrowRight, AudioWaveform, Mic2, ShieldCheck, Sparkles } from "lucide-react";

type AuthShellProps = {
  alternateHref: string;
  alternateLabel: string;
  alternateText: string;
  description: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
};

const highlights = [
  {
    icon: AudioWaveform,
    title: "Reliable speech workflows",
    description: "Modernize transcription access without changing your backend contract.",
    color: "#00d4ff",
  },
  {
    icon: ShieldCheck,
    title: "Stable auth foundation",
    description: "JWTs stay in first-party cookies so local development remains predictable.",
    color: "#34d399",
  },
  {
    icon: Sparkles,
    title: "Production-grade polish",
    description: "A premium dark interface designed to feel credible from day one.",
    color: "#a78bfa",
  },
];

export function AuthShell({
  alternateHref,
  alternateLabel,
  alternateText,
  children,
  description,
  eyebrow,
  title,
}: AuthShellProps) {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "#07070f" }}
    >
      {/* Ambient glows */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-[600px] w-[600px]"
        style={{
          background: "radial-gradient(circle at top left, rgba(124,58,237,0.2) 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[500px] w-[500px]"
        style={{
          background: "radial-gradient(circle at bottom right, rgba(0,212,255,0.1) 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />

      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:flex-row lg:px-10 lg:py-10 lg:gap-6">
        {/* ── Left panel ── */}
        <section
          className="flex w-full flex-col justify-between rounded-3xl p-8 md:p-10 lg:w-[54%]"
          style={{
            background: "rgba(255,255,255,0.025)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div className="space-y-8">
            {/* Logo pill */}
            <div
              className="inline-flex w-fit items-center gap-3 rounded-full px-4 py-2 text-sm font-medium text-white"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: "linear-gradient(135deg,#7c3aed,#00d4ff)" }}
              >
                <Mic2 className="h-4 w-4 text-white" />
              </span>
              Vaak AI
            </div>

            <div className="space-y-5">
              <p
                className="text-xs font-bold uppercase tracking-[0.24em]"
                style={{ color: "#00d4ff" }}
              >
                {eyebrow}
              </p>
              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  {title}
                </h1>
                <p className="max-w-xl text-base leading-7 sm:text-lg" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {description}
                </p>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="grid gap-3">
              {highlights.map(({ description: desc, icon: Icon, title: t, color }) => (
                <div
                  key={t}
                  className="rounded-2xl p-5"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `${color}18`, color }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="space-y-1">
                      <h2 className="text-sm font-semibold text-white">{t}</h2>
                      <p className="text-xs leading-5" style={{ color: "rgba(255,255,255,0.45)" }}>{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alternate link footer */}
          <div
            className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl px-5 py-4 text-sm"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.65)" }}>{alternateText}</span>
            <Link
              className="inline-flex items-center gap-2 font-semibold transition-colors hover:opacity-80"
              style={{ color: "#00d4ff" }}
              href={alternateHref}
            >
              {alternateLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* ── Right panel (form) ── */}
        <section className="flex w-full items-center justify-center py-10 lg:w-[46%] lg:py-0">
          <div
            className="w-full max-w-lg rounded-3xl p-8 sm:p-10"
            style={{
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 24px 70px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
