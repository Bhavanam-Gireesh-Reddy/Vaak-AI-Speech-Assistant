"use client";

import {
  Activity,
  Clock3,
  Globe2,
  Mic2,
  Radar,
  ScrollText,
  Sparkles,
  Zap,
} from "lucide-react";

import { LogoutButton } from "@/components/app/logout-button";
import { UserSummary } from "@/components/app/user-summary";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type { AuthUser } from "@/lib/auth-types";
import {
  buildDayBuckets,
  getDurationMinutes,
  getLanguageLabel,
  getModeLabel,
  getSessionDateLabel,
} from "@/lib/session-utils";

/* ── Design tokens ───────────────────────────────────────────────── */
const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
};

const GLOW_CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.025)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(124,58,237,0.2)",
  boxShadow: "0 0 60px rgba(124,58,237,0.08), 0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
};

/* ── Gradient text helper ────────────────────────────────────────── */
const GRADIENT_TEXT: React.CSSProperties = {
  background: "linear-gradient(135deg, #ffffff 20%, #a78bfa 60%, #00d4ff 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

/* ── Stat card ───────────────────────────────────────────────────── */
function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  accentColor = "#00d4ff",
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  detail: string;
  accentColor?: string;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl p-6"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid rgba(255,255,255,0.07)`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Background glow on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at top right, ${accentColor}0a 0%, transparent 60%)`,
        }}
      />

      <div className="flex items-start justify-between gap-3">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.22em]"
          style={{ color: accentColor }}
        >
          {label}
        </p>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: `${accentColor}15`,
            boxShadow: `0 0 16px ${accentColor}25`,
          }}
        >
          <Icon className="h-4 w-4" style={{ color: accentColor }} />
        </span>
      </div>

      <p
        className="mt-5 text-3xl font-bold tracking-tight"
        style={{ ...GRADIENT_TEXT }}
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
        {detail}
      </p>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 h-[2px] w-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(to right, ${accentColor}, transparent)` }}
      />
    </div>
  );
}

/* ── Dashboard Hero ──────────────────────────────────────────────── */
function DashboardHero({ user }: { user: AuthUser }) {
  return (
    <section className="relative overflow-hidden rounded-3xl p-7 md:p-10" style={GLOW_CARD}>
      {/* Inner ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at top left, rgba(124,58,237,0.12) 0%, transparent 55%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-64 w-64"
        style={{
          background: "radial-gradient(circle at bottom right, rgba(0,212,255,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          {/* Eyebrow badge */}
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
            Workspace · Analytics · Sessions
          </div>

          <h2
            className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight"
            style={GRADIENT_TEXT}
          >
            Your AI meeting
            <br />
            workspace
          </h2>
          <p className="mt-3 max-w-lg text-sm md:text-base leading-7" style={{ color: "rgba(255,255,255,0.45)" }}>
            All your transcripts, analytics, and AI-generated insights in one
            unified dashboard. Protected routes, real-time data, zero friction.
          </p>
        </div>

        <div className="flex flex-col gap-4 lg:min-w-[340px]">
          <UserSummary user={user} />
          <div className="flex justify-end">
            <LogoutButton />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Main export ─────────────────────────────────────────────────── */
export function DashboardClientPage({ user }: { user: AuthUser }) {
  const { isLoading, error, stats, recentSessions } = useDashboardData();

  const totalWords   = stats.reduce((s, x) => s + (x.word_count ?? 0), 0);
  const totalMinutes = stats.reduce((s, x) => s + getDurationMinutes(x), 0);
  const averageWords = stats.length ? Math.round(totalWords / stats.length) : 0;
  const averageWpm   = totalMinutes ? Math.round(totalWords / Math.max(totalMinutes, 1)) : 0;

  const languageBreakdown = Array.from(
    stats.reduce((map, s) => {
      const l = getLanguageLabel(s.language);
      map.set(l, (map.get(l) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const modeBreakdown = Array.from(
    stats.reduce((map, s) => {
      const l = getModeLabel(s.mode);
      map.set(l, (map.get(l) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1]);

  const dailyBuckets = buildDayBuckets(stats, 14);
  const peakDay = Math.max(...dailyBuckets.map((b) => b.count), 1);

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <DashboardHero user={user} />
        <div className="rounded-2xl p-8 text-sm" style={{ ...CARD, color: "rgba(255,255,255,0.4)" }}>
          Loading dashboard analytics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-6">
        <DashboardHero user={user} />
        <div
          className="rounded-2xl p-8 text-sm"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}
        >
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:gap-8">
      <DashboardHero user={user} />

      {/* ── Stat cards ── */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Total sessions"
          value={stats.length.toString()}
          detail="Tracked across saved sessions"
          accentColor="#00d4ff"
        />
        <StatCard
          icon={ScrollText}
          label="Total words"
          value={totalWords.toLocaleString()}
          detail="Combined transcript volume"
          accentColor="#a78bfa"
        />
        <StatCard
          icon={Mic2}
          label="Avg. words"
          value={averageWords.toLocaleString()}
          detail="Average per session"
          accentColor="#34d399"
        />
        <StatCard
          icon={Clock3}
          label="Avg. WPM"
          value={averageWpm.toString()}
          detail="Based on recorded duration"
          accentColor="#f472b6"
        />
      </section>

      {/* ── Activity + Distribution ── */}
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">

        {/* Activity bar chart */}
        <div className="relative overflow-hidden rounded-2xl p-7 md:p-8" style={CARD}>
          {/* Section glow */}
          <div
            className="pointer-events-none absolute top-0 left-0 h-40 w-40"
            style={{ background: "radial-gradient(circle at top left, rgba(0,212,255,0.07) 0%, transparent 70%)" }}
          />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{ color: "#00d4ff" }}
              >
                Activity
              </p>
              <h3
                className="mt-2 text-xl md:text-2xl font-bold tracking-tight"
                style={GRADIENT_TEXT}
              >
                Last 14 days
              </h3>
            </div>
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.2)",
                color: "#a78bfa",
              }}
            >
              <Zap className="h-3 w-3" />
              {Math.round(totalMinutes)} min captured
            </div>
          </div>

          <div className="relative mt-8 grid grid-cols-14 items-end gap-1.5">
            {dailyBuckets.map((bucket) => (
              <div key={bucket.date} className="flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg transition-all duration-300 hover:opacity-90"
                  style={{
                    height: `${Math.max((bucket.count / peakDay) * 160, 8)}px`,
                    background: bucket.count
                      ? "linear-gradient(to top, #7c3aed, #00d4ff)"
                      : "rgba(255,255,255,0.05)",
                    boxShadow: bucket.count ? "0 0 12px rgba(0,212,255,0.2)" : "none",
                  }}
                />
                <div className="text-center">
                  <p className="text-[10px] font-bold text-white">{bucket.count || ""}</p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.22)" }}>
                    {bucket.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution */}
        <div className="relative overflow-hidden rounded-2xl p-6 md:p-7" style={CARD}>
          <div
            className="pointer-events-none absolute top-0 right-0 h-32 w-32"
            style={{ background: "radial-gradient(circle at top right, rgba(167,139,250,0.08) 0%, transparent 70%)" }}
          />

          <div className="relative">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{ color: "#a78bfa" }}
            >
              Distribution
            </p>
            <h3
              className="mt-2 text-xl md:text-2xl font-bold tracking-tight"
              style={GRADIENT_TEXT}
            >
              Languages &amp; modes
            </h3>

            <div className="mt-6 space-y-6">
              {/* Languages */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Globe2 className="h-4 w-4" style={{ color: "#00d4ff" }} />
                  Top languages
                </div>
                {languageBreakdown.length ? (
                  languageBreakdown.map(([label, count]) => (
                    <div key={label} className="space-y-1.5">
                      <div
                        className="flex items-center justify-between text-xs"
                        style={{ color: "rgba(255,255,255,0.5)" }}
                      >
                        <span>{label}</span>
                        <span className="font-bold text-white">{count}</span>
                      </div>
                      <div
                        className="h-1.5 rounded-full"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      >
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${(count / Math.max(stats.length, 1)) * 100}%`,
                            background: "linear-gradient(to right, #7c3aed, #00d4ff)",
                            boxShadow: "0 0 8px rgba(0,212,255,0.3)",
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                    No language data yet.
                  </p>
                )}
              </div>

              {/* Mode mix */}
              <div
                className="space-y-2.5 pt-4"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Radar className="h-4 w-4" style={{ color: "#a78bfa" }} />
                  Mode mix
                </div>
                <div className="grid gap-2">
                  {modeBreakdown.map(([label, count]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm transition hover:opacity-90"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <span style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
                      <span
                        className="font-bold text-sm"
                        style={{
                          background: "linear-gradient(90deg,#a78bfa,#00d4ff)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Recent sessions ── */}
      <section className="relative overflow-hidden rounded-2xl p-7 md:p-8" style={CARD}>
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-48 w-48"
          style={{ background: "radial-gradient(circle at bottom right, rgba(0,212,255,0.06) 0%, transparent 70%)" }}
        />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{ color: "#00d4ff" }}
            >
              Recent sessions
            </p>
            <h3
              className="mt-2 text-xl md:text-2xl font-bold tracking-tight"
              style={GRADIENT_TEXT}
            >
              Latest saved transcripts
            </h3>
          </div>
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: "rgba(52,211,153,0.08)",
              border: "1px solid rgba(52,211,153,0.2)",
              color: "#34d399",
            }}
          >
            <Sparkles className="h-3 w-3" />
            {recentSessions.length} loaded
          </div>
        </div>

        <div className="relative mt-6 grid gap-3">
          {recentSessions.length ? (
            recentSessions.map((session) => (
              <div
                key={session.session_id}
                className="group rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <h4 className="text-base font-semibold text-white">
                      {session.title || "Untitled session"}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { text: getLanguageLabel(session.language), color: "#00d4ff" },
                        { text: getModeLabel(session.mode), color: "#a78bfa" },
                        { text: `${session.word_count?.toLocaleString() || 0} words`, color: "#34d399" },
                      ].map(({ text, color }) => (
                        <span
                          key={text}
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          style={{
                            background: `${color}10`,
                            color,
                            border: `1px solid ${color}22`,
                          }}
                        >
                          {text}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="shrink-0 text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
                    {getSessionDateLabel(session.started_at)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div
              className="rounded-2xl px-6 py-14 text-center text-sm"
              style={{
                border: "1px dashed rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.28)",
              }}
            >
              Your saved sessions will appear here once transcripts are stored.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
