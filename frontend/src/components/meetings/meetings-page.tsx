"use client";

import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Info,
  LinkIcon,
  LoaderCircle,
  LogOut,
  RefreshCcw,
  Video,
  XCircle,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

/* ── Types ───────────────────────────────────────── */
type Platform = "zoom" | "google" | "webex";

type IntegrationStatus = {
  configured: boolean;
  client_id_set: boolean;
  client_secret_set: boolean;
  connected?: boolean;
};

type Meeting = {
  id: string;
  title: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  join_url: string;
  platform: string;
  status: string;
  organizer?: string;
  attendees?: string[];
  description?: string;
};

/* ── Helpers ──────────────────────────────────────── */
async function readJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text || `HTTP ${res.status}` };
  }
}

function formatTime(iso: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function platformLabel(p: string) {
  const map: Record<string, string> = {
    zoom: "Zoom",
    google: "Google Calendar",
    google_meet: "Google Meet",
    webex: "Webex",
    calendar: "Calendar Event",
  };
  return map[p] || p;
}

function platformColor(p: string) {
  const map: Record<string, string> = {
    zoom: "#2D8CFF",
    google: "#4285F4",
    google_meet: "#00897B",
    webex: "#07C160",
    calendar: "#8B5CF6",
  };
  return map[p] || "#8B5CF6";
}

/* ── Component ───────────────────────────────────── */
export function MeetingsPageClient() {
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<Record<string, IntegrationStatus> | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [transcribing, setTranscribing] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [providerErrors, setProviderErrors] = useState<Record<string, string>>({});

  /* ── Fetch integration status ── */
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/proxy/meetings/status");
      const data = await readJson(res);
      if (data.error) {
        setError(data.error);
        return;
      }
      setStatus(data);
    } catch {
      setError("Failed to load integration status");
    }
  }, []);

  /* ── Fetch all meetings ── */
  const fetchMeetings = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/proxy/meetings/all");
      const data = await readJson(res);
      if (data.error && !data.meetings) {
        setError(data.error);
        setMeetings([]);
        setProviderErrors({});
      } else {
        setMeetings((data.meetings as Meeting[]) || []);
        setProviderErrors((data.errors as Record<string, string>) || {});
      }
    } catch {
      setError("Failed to load meetings from connected platforms");
    } finally {
      setRefreshing(false);
    }
  }, []);

  /* ── Handle OAuth callback ── */
  useEffect(() => {
    const provider = searchParams.get("provider");
    const code = searchParams.get("code");
    if (provider && code) {
      (async () => {
        setConnectingPlatform(provider);
        try {
          const res = await fetch(`/api/proxy/meetings/${provider}/callback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          });
          const data = await readJson(res);
          if (data.ok) {
            setSuccessMsg(`${platformLabel(provider)} connected successfully!`);
            fetchStatus();
            fetchMeetings();
          } else {
            setError(data.error || "Connection failed");
          }
        } catch {
          setError(`Failed to connect ${platformLabel(provider)}`);
        } finally {
          setConnectingPlatform(null);
          // Clean URL
          window.history.replaceState({}, "", "/meetings");
        }
      })();
    }
  }, [searchParams, fetchStatus, fetchMeetings]);

  /* ── Initial load ── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchStatus();
      await fetchMeetings();
      setLoading(false);
    })();
  }, [fetchStatus, fetchMeetings]);

  /* ── Connect platform ── */
  async function connectPlatform(platform: Platform) {
    setConnectingPlatform(platform);
    setError("");
    try {
      const res = await fetch(`/api/proxy/meetings/${platform}/auth`);
      const data = await readJson(res);
      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        setError(data.error || "Failed to get auth URL");
        setConnectingPlatform(null);
      }
    } catch {
      setError(`Failed to connect ${platformLabel(platform)}`);
      setConnectingPlatform(null);
    }
  }

  /* ── Disconnect platform ── */
  async function disconnectPlatform(platform: Platform) {
    try {
      await fetch("/api/proxy/meetings/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      fetchStatus();
      fetchMeetings();
    } catch {
      setError(`Failed to disconnect ${platformLabel(platform)}`);
    }
  }

  /* ── Transcribe meeting ── */
  async function transcribeMeeting(meeting: Meeting) {
    const platform = meeting.platform === "google_meet" ? "zoom" : meeting.platform;
    if (platform !== "zoom" && platform !== "webex") {
      setError("Transcription only available for Zoom and Webex meetings with recordings");
      return;
    }
    setTranscribing(meeting.id);
    setError("");
    try {
      const res = await fetch(`/api/proxy/meetings/${platform}/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting_id: meeting.id }),
      });
      const data = await readJson(res);
      if (data.ok) {
        setSuccessMsg(`Transcript saved: "${data.title}"`);
      } else {
        setError(data.error || "Transcription failed");
      }
    } catch {
      setError("Transcription request failed");
    } finally {
      setTranscribing(null);
    }
  }

  /* ── Render ────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  const now = new Date();
  const meetingEnd = (m: Meeting) => {
    const t = m.end_time || m.start_time;
    return t ? new Date(t) : null;
  };
  const upcomingMeetings = meetings.filter((m) => {
    const end = meetingEnd(m);
    return !end || end >= now;
  });
  const pastMeetings = meetings
    .filter((m) => {
      const end = meetingEnd(m);
      return end && end < now;
    })
    .sort((a, b) => (b.start_time || "").localeCompare(a.start_time || ""));

  const anyConnected = Object.values(status || {}).some((s) => s?.connected);

  const platforms: { key: Platform; label: string; icon: string; description: string }[] = [
    {
      key: "zoom",
      label: "Zoom",
      icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Zoom_Communications_Logo.svg/120px-Zoom_Communications_Logo.svg.png",
      description: "Import meeting recordings & transcripts from Zoom",
    },
    {
      key: "google",
      label: "Google Calendar",
      icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/120px-Google_Calendar_icon_%282020%29.svg.png",
      description: "View upcoming meetings from Google Calendar & Meet",
    },
    {
      key: "webex",
      label: "Webex",
      icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Cisco_Webex_logo.svg/120px-Cisco_Webex_logo.svg.png",
      description: "Import meeting transcripts from Cisco Webex",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{
            background: "linear-gradient(90deg, #fff, rgba(255,255,255,0.7))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Meeting Integrations
        </h1>
        <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          Connect your meeting platforms to import transcripts and view upcoming meetings
        </p>
      </div>

      {/* Status messages */}
      {error && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
        >
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto text-xs opacity-60 hover:opacity-100">
            dismiss
          </button>
        </div>
      )}
      {successMsg && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#86efac" }}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMsg}
          <button onClick={() => setSuccessMsg("")} className="ml-auto text-xs opacity-60 hover:opacity-100">
            dismiss
          </button>
        </div>
      )}

      {/* Platform Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {platforms.map((p) => {
          const s = status?.[p.key];
          const configured = s?.configured ?? false;
          const connected = s?.connected ?? false;

          return (
            <div
              key={p.key}
              className="rounded-2xl p-5 transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: connected
                  ? `1px solid ${platformColor(p.key)}40`
                  : "1px solid rgba(255,255,255,0.06)",
                boxShadow: connected ? `0 0 20px ${platformColor(p.key)}10` : undefined,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold"
                  style={{ background: `${platformColor(p.key)}20`, color: platformColor(p.key) }}
                >
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{p.label}</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {connected ? "Connected" : configured ? "Ready to connect" : "Not configured"}
                  </div>
                </div>
              </div>
              <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
                {p.description}
              </p>

              {connected ? (
                <button
                  onClick={() => disconnectPlatform(p.key)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all hover:bg-red-500/20"
                  style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Disconnect
                </button>
              ) : configured ? (
                <button
                  onClick={() => connectPlatform(p.key)}
                  disabled={connectingPlatform === p.key}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all hover:opacity-90"
                  style={{
                    background: `${platformColor(p.key)}20`,
                    border: `1px solid ${platformColor(p.key)}40`,
                    color: platformColor(p.key),
                  }}
                >
                  {connectingPlatform === p.key ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LinkIcon className="h-3.5 w-3.5" />
                  )}
                  {connectingPlatform === p.key ? "Connecting..." : "Connect"}
                </button>
              ) : (
                <div
                  className="rounded-xl px-3 py-2 text-center text-xs"
                  style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.3)" }}
                >
                  Set API keys in .env to enable
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Onboarding guidance */}
      {anyConnected && (
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3 text-xs"
          style={{
            background: "rgba(59,130,246,0.08)",
            border: "1px solid rgba(59,130,246,0.22)",
            color: "rgba(191,219,254,0.9)",
          }}
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            <div className="font-semibold text-white/80">How to get a transcript</div>
            <div className="leading-relaxed">
              Transcription pulls from the host&apos;s cloud recording after the meeting ends. For
              Zoom, Cloud Recording must be enabled (Zoom Pro or higher). For Webex, recording
              must be turned on during the meeting. Once the meeting is over and the recording
              is processed, it appears below with a <span className="font-semibold">Get Transcript</span> button.
              Free-tier users can also{" "}
              <a href="/studio" className="underline hover:text-white">
                upload an audio file in Studio
              </a>{" "}
              instead.
            </div>
          </div>
        </div>
      )}

      {/* Per-provider fetch errors */}
      {Object.keys(providerErrors).length > 0 && (
        <div
          className="rounded-xl px-4 py-3 text-xs space-y-1"
          style={{
            background: "rgba(234,179,8,0.08)",
            border: "1px solid rgba(234,179,8,0.22)",
            color: "#fde68a",
          }}
        >
          <div className="flex items-center gap-2 font-semibold text-white/80">
            <XCircle className="h-4 w-4" />
            Some meetings could not be loaded
          </div>
          {Object.entries(providerErrors).map(([p, msg]) => (
            <div key={p} className="opacity-80">
              <span className="font-medium">{platformLabel(p)}:</span> {msg}
            </div>
          ))}
        </div>
      )}

      {/* Meetings list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-violet-400" />
            Upcoming Meetings
          </h2>
          <button
            onClick={() => { fetchMeetings(); }}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:bg-white/5 disabled:opacity-50"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            <RefreshCcw className={`h-3 w-3 transition-transform ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {upcomingMeetings.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Calendar className="mx-auto h-10 w-10 mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              No upcoming meetings
            </p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
              {anyConnected
                ? "Schedule a meeting in your calendar to see it here"
                : "Connect a platform above to see your meetings here"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingMeetings.map((m) => (
              <MeetingRow
                key={`${m.platform}-${m.id}`}
                m={m}
                transcribing={transcribing === m.id}
                onTranscribe={() => transcribeMeeting(m)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent past meetings */}
      {pastMeetings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-white/40" />
            Recent Meetings (last 7 days)
          </h2>
          <div className="space-y-2">
            {pastMeetings.map((m) => (
              <MeetingRow
                key={`${m.platform}-${m.id}`}
                m={m}
                transcribing={transcribing === m.id}
                onTranscribe={() => transcribeMeeting(m)}
                past
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

/* ── Meeting row ─────────────────────────────────── */
function MeetingRow({
  m,
  transcribing,
  onTranscribe,
  past = false,
}: {
  m: Meeting;
  transcribing: boolean;
  onTranscribe: () => void;
  past?: boolean;
}) {
  return (
    <div
      className="group flex items-center gap-4 rounded-xl px-4 py-3 transition-all hover:bg-white/[0.03]"
      style={{
        border: "1px solid rgba(255,255,255,0.06)",
        opacity: past ? 0.75 : 1,
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
        style={{ background: `${platformColor(m.platform)}15`, color: platformColor(m.platform) }}
      >
        <Video className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-white">{m.title}</span>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
            style={{ background: `${platformColor(m.platform)}15`, color: platformColor(m.platform) }}
          >
            {platformLabel(m.platform)}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {formatTime(m.start_time)}
          </span>
          {m.duration ? (
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              {m.duration} min
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!past && m.join_url && (
          <a
            href={m.join_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:bg-white/5"
            style={{ color: platformColor(m.platform) }}
          >
            <ExternalLink className="h-3 w-3" />
            Join
          </a>
        )}
        {(m.platform === "zoom" || m.platform === "webex") && (
          <button
            onClick={onTranscribe}
            disabled={transcribing}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:bg-violet-500/10"
            style={{ color: "#a78bfa", border: "1px solid rgba(124,58,237,0.2)" }}
          >
            {transcribing ? (
              <LoaderCircle className="h-3 w-3 animate-spin" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            {transcribing ? "Transcribing..." : "Get Transcript"}
          </button>
        )}
      </div>
    </div>
  );
}
