"use client";

import {
  Activity,
  Clock3,
  Globe2,
  Mic2,
  Radar,
  ScrollText,
  Sparkles,
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

/* ── Design tokens ───────────────────────────────────────────── */
const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
};

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  accentColor = "#00d4ff",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
  accentColor?: string;
}) {
  return (
    <div className="rounded-2xl p-5 md:p-6" style={CARD}>
      <div className="flex items-center justify-between gap-3">
        <p
          className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: accentColor }}
        >
          {label}
        </p>
        <span
          className="flex h-9 md:h-10 w-9 md:w-10 items-center justify-center rounded-xl"
          style={{ background: `${accentColor}18`, color: accentColor }}
        >
          <Icon className="h-4 w-4 md:h-5 md:w-5" />
        </span>
      </div>
      <p
        className="mt-4 md:mt-6 text-2xl md:text-3xl font-bold tracking-tight text-white"
      >
        {value}
      </p>
      <p className="mt-1 md:mt-2 text-xs md:text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>
        {detail}
      </p>
    </div>
  );
}

function DashboardHero({ user }: { user: AuthUser }) {
  return (
    <section
      className="grid gap-6 rounded-2xl p-6 md:p-8 lg:grid-cols-[1fr_auto] lg:items-center"
      style={{
        background: "linear-gradient(145deg, rgba(124,58,237,0.08), rgba(0,212,255,0.04))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(124,58,237,0.18)",
        boxShadow: "0 0 40px rgba(124,58,237,0.06)",
      }}
    >
      <div className="max-w-3xl">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] md:text-xs font-bold uppercase tracking-widest"
          style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", color: "#a78bfa" }}
        >
          <Sparkles className="h-3 md:h-3.5 w-3 md:w-3.5" />
          Workspace
        </div>
        <h2
          className="mt-3 md:mt-4 text-xl md:text-3xl font-bold tracking-tight text-white"
        >
          Sessions, analytics, and admin controls
        </h2>
        <p className="mt-2 md:mt-3 text-xs md:text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
          Your Next.js frontend sits on top of the FastAPI backend with protected
          routes, shared navigation, and authenticated data access.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:gap-4 lg:min-w-[380px]">
        <UserSummary user={user} />
        <div className="flex justify-end">
          <LogoutButton />
        </div>
      </div>
    </section>
  );
}

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
    <div className="grid gap-6">
      <DashboardHero user={user} />

      {/* ── Stat cards ── */}
      <section className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard detail="Tracked across your saved sessions" icon={Activity}    label="Total sessions" value={stats.length.toString()}          accentColor="#00d4ff" />
        <StatCard detail="Combined transcript volume"         icon={ScrollText}  label="Total words"    value={totalWords.toLocaleString()}      accentColor="#a78bfa" />
        <StatCard detail="Average transcript size per session" icon={Mic2}       label="Avg. words"     value={averageWords.toLocaleString()}    accentColor="#34d399" />
        <StatCard detail="Based on recorded session duration" icon={Clock3}      label="Avg. WPM"       value={averageWpm.toString()}            accentColor="#f472b6" />
      </section>

      {/* ── Activity + Distribution ── */}
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Activity bar chart */}
        <div className="rounded-2xl p-6 md:p-8" style={CARD}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#00d4ff" }}>
                Activity
              </p>
              <h3 className="mt-2 text-xl md:text-2xl font-bold tracking-tight text-white">
                Last 14 days
              </h3>
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              {Math.round(totalMinutes)} min captured
            </p>
          </div>

          <div className="mt-8 grid grid-cols-14 items-end gap-1.5">
            {dailyBuckets.map((bucket) => (
              <div key={bucket.date} className="flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-xl"
                  style={{
                    height: `${Math.max((bucket.count / peakDay) * 160, 8)}px`,
                    background: "linear-gradient(to top, #7c3aed, #00d4ff)",
                    opacity: bucket.count ? 1 : 0.12,
                  }}
                />
                <div className="text-center">
                  <p className="text-[10px] font-semibold text-white">{bucket.count || ""}</p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{bucket.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution */}
        <div className="rounded-2xl p-6 md:p-8" style={CARD}>
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#a78bfa" }}>
            Distribution
          </p>
          <h3 className="mt-2 text-xl md:text-2xl font-bold tracking-tight text-white">
            Languages &amp; modes
          </h3>

          <div className="mt-6 space-y-5">
            {/* Languages */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Globe2 className="h-4 w-4" style={{ color: "#00d4ff" }} />
                Top languages
              </div>
              {languageBreakdown.length ? (
                languageBreakdown.map(([label, count]) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                      <span>{label}</span>
                      <span className="font-semibold text-white">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${(count / Math.max(stats.length, 1)) * 100}%`,
                          background: "linear-gradient(to right, #7c3aed, #00d4ff)",
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>No language data yet.</p>
              )}
            </div>

            {/* Mode mix */}
            <div className="space-y-2.5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Radar className="h-4 w-4" style={{ color: "#a78bfa" }} />
                Mode mix
              </div>
              <div className="grid gap-2">
                {modeBreakdown.map(([label, count]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <span style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
                    <span className="font-bold text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Recent sessions ── */}
      <section className="rounded-2xl p-6 md:p-8" style={CARD}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#00d4ff" }}>
              Recent sessions
            </p>
            <h3 className="mt-2 text-xl md:text-2xl font-bold tracking-tight text-white">
              Latest saved transcripts
            </h3>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
            {recentSessions.length} loaded
          </p>
        </div>

        <div className="mt-6 grid gap-3">
          {recentSessions.length ? (
            recentSessions.map((session) => (
              <div
                key={session.session_id}
                className="rounded-2xl p-5 transition hover:-translate-y-0.5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
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
                          className="rounded-full px-3 py-1 text-xs font-medium"
                          style={{ background: `${color}12`, color, border: `1px solid ${color}22` }}
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
              className="rounded-2xl px-5 py-12 text-center text-sm"
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
