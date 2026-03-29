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

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_26px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
          {label}
        </p>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

function DashboardHero({ user }: { user: AuthUser }) {
  return (
    <section className="grid gap-5 rounded-[30px] border border-white/70 bg-white/90 p-7 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
          <Sparkles className="h-3.5 w-3.5" />
          Workspace
        </div>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
          Sessions, analytics, and admin controls
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Your Next.js frontend now sits on top of the existing FastAPI backend
          with protected routes, shared navigation, and authenticated data
          access.
        </p>
      </div>

      <div className="flex flex-col gap-4 xl:min-w-[420px]">
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

  const totalWords = stats.reduce(
    (sum, session) => sum + (session.word_count ?? 0),
    0,
  );
  const totalMinutes = stats.reduce(
    (sum, session) => sum + getDurationMinutes(session),
    0,
  );
  const averageWords = stats.length ? Math.round(totalWords / stats.length) : 0;
  const averageWpm = totalMinutes
    ? Math.round(totalWords / Math.max(totalMinutes, 1))
    : 0;
  const languageBreakdown = Array.from(
    stats.reduce((map, session) => {
      const label = getLanguageLabel(session.language);
      map.set(label, (map.get(label) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5);
  const modeBreakdown = Array.from(
    stats.reduce((map, session) => {
      const label = getModeLabel(session.mode);
      map.set(label, (map.get(label) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).sort((left, right) => right[1] - left[1]);
  const dailyBuckets = buildDayBuckets(stats, 14);
  const peakDay = Math.max(...dailyBuckets.map((bucket) => bucket.count), 1);

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <DashboardHero user={user} />
        <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 text-sm text-slate-500 shadow-[0_26px_60px_rgba(15,23,42,0.08)]">
          Loading dashboard analytics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-6">
        <DashboardHero user={user} />
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-[0_20px_40px_rgba(244,63,94,0.08)]">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <DashboardHero user={user} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          detail="Tracked across your saved sessions"
          icon={Activity}
          label="Total sessions"
          value={stats.length.toString()}
        />
        <StatCard
          detail="Combined transcript volume"
          icon={ScrollText}
          label="Total words"
          value={totalWords.toLocaleString()}
        />
        <StatCard
          detail="Average transcript size per session"
          icon={Mic2}
          label="Avg. words"
          value={averageWords.toLocaleString()}
        />
        <StatCard
          detail="Based on recorded session duration"
          icon={Clock3}
          label="Avg. WPM"
          value={averageWpm.toString()}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-white/70 bg-white/90 p-7 shadow-[0_26px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
                Activity
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                Last 14 days
              </h3>
            </div>
            <p className="text-sm text-slate-500">
              {Math.round(totalMinutes)} total minutes captured
            </p>
          </div>

          <div className="mt-8 grid grid-cols-14 items-end gap-2">
            {dailyBuckets.map((bucket) => (
              <div key={bucket.date} className="flex flex-col items-center gap-3">
                <div
                  className="w-full rounded-t-2xl bg-gradient-to-t from-sky-600 to-cyan-400"
                  style={{
                    height: `${Math.max((bucket.count / peakDay) * 180, 10)}px`,
                    opacity: bucket.count ? 1 : 0.18,
                  }}
                />
                <div className="text-center">
                  <p className="text-xs font-medium text-slate-700">{bucket.count}</p>
                  <p className="text-[11px] text-slate-400">{bucket.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/90 p-7 shadow-[0_26px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
            Distribution
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            Languages and modes
          </h3>

          <div className="mt-8 space-y-5">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Globe2 className="h-4 w-4 text-sky-700" />
                Top languages
              </div>
              {languageBreakdown.length ? (
                languageBreakdown.map(([label, count]) => (
                  <div key={label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>{label}</span>
                      <span className="font-medium text-slate-900">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-sky-500"
                        style={{
                          width: `${(count / Math.max(stats.length, 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No language data yet.</p>
              )}
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Radar className="h-4 w-4 text-violet-700" />
                Mode mix
              </div>
              <div className="grid gap-3">
                {modeBreakdown.map(([label, count]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  >
                    <span className="text-slate-600">{label}</span>
                    <span className="font-semibold text-slate-950">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white/90 p-7 shadow-[0_26px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
              Recent sessions
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              Latest saved transcripts
            </h3>
          </div>
          <p className="text-sm text-slate-500">
            {recentSessions.length} loaded for quick review
          </p>
        </div>

        <div className="mt-8 grid gap-4">
          {recentSessions.length ? (
            recentSessions.map((session) => (
              <div
                key={session.session_id}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-slate-950">
                      {session.title || "Untitled session"}
                    </h4>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-white px-3 py-1">
                        {getLanguageLabel(session.language)}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1">
                        {getModeLabel(session.mode)}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1">
                        {session.word_count?.toLocaleString() || 0} words
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">
                    {getSessionDateLabel(session.started_at)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
              Your saved sessions will appear here once transcripts are stored.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
