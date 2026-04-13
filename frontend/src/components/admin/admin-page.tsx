"use client";

import { useRouter } from "next/navigation";
import {
  Activity,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
  Webhook,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useAdminData } from "@/hooks/use-admin-data";
import { getSessionDateLabel } from "@/lib/session-utils";

/* ── Shared style tokens ───────────────────────────────────────── */
const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.025)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
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
  color: "rgba(255,255,255,0.9)",
};

export function AdminPage({ initialIsAdmin }: { initialIsAdmin: boolean }) {
  const router = useRouter();
  const {
    isLoading,
    error,
    stats,
    users,
    webhookUrl,
    saveWebhook,
    promoteUser,
    deleteUser,
    requestSelfPromote,
  } = useAdminData(initialIsAdmin);
  const [formValue, setFormValue] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormValue(webhookUrl);
  }, [webhookUrl]);

  async function handleSaveWebhook() {
    setIsSubmitting(true);
    try {
      await saveWebhook(formValue.trim());
      setStatus("Webhook saved successfully.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSelfPromote() {
    setIsSubmitting(true);
    try {
      await requestSelfPromote();
      router.refresh();
    } catch (promoteError) {
      setStatus(
        promoteError instanceof Error
          ? promoteError.message
          : "Unable to request admin access.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ── Non-admin gate ─────────────────────────────────────────── */
  if (!initialIsAdmin) {
    return (
      <section
        className="relative overflow-hidden rounded-3xl p-8 md:p-12"
        style={{
          ...CARD,
          border: "1px solid rgba(239,68,68,0.18)",
          boxShadow: "0 0 60px rgba(239,68,68,0.06), 0 24px 80px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at top left, rgba(239,68,68,0.08) 0%, transparent 55%)" }}
        />
        <div className="relative flex items-start gap-5">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5" }}
          >
            <ShieldAlert className="h-6 w-6" />
          </span>
          <div className="space-y-5">
            <div>
              <div
                className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", color: "#fca5a5" }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#ef4444", boxShadow: "0 0 6px #ef4444" }} />
                Restricted Area
              </div>
              <h3 className="text-2xl md:text-3xl font-bold" style={GRADIENT_TEXT}>
                Admin access required
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7" style={{ color: "rgba(255,255,255,0.45)" }}>
                If no administrator exists yet, you can request first-time admin access from here.
                Otherwise, an existing admin needs to promote your account.
              </p>
            </div>
            <button
              className="inline-flex h-11 items-center gap-2 rounded-2xl px-6 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              onClick={() => void handleSelfPromote()}
              style={{ background: "linear-gradient(135deg,#7c3aed,#00d4ff)", boxShadow: "0 0 24px rgba(124,58,237,0.35)" }}
              type="button"
            >
              <ShieldCheck className="h-4 w-4" />
              {isSubmitting ? "Checking access…" : "Request admin access"}
            </button>
            {status ? (
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{status}</p>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  /* ── Admin dashboard ─────────────────────────────────────────── */
  return (
    <div className="grid gap-6 md:gap-8">

      {/* ── Page hero ── */}
      <section
        className="relative overflow-hidden rounded-3xl p-7 md:p-10"
        style={{
          ...CARD,
          border: "1px solid rgba(124,58,237,0.18)",
          boxShadow: "0 0 60px rgba(124,58,237,0.07), 0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at top left, rgba(124,58,237,0.12) 0%, transparent 55%)" }} />
        <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48" style={{ background: "radial-gradient(circle at bottom right, rgba(0,212,255,0.08) 0%, transparent 60%)" }} />
        <div className="relative">
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest"
            style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.22)", color: "#c4b5fd" }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#a78bfa", boxShadow: "0 0 6px #a78bfa" }} />
            Admin · Workspace Control
          </div>
          <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight" style={GRADIENT_TEXT}>
            Administration panel
          </h2>
          <p className="mt-3 max-w-2xl text-sm md:text-base leading-7" style={{ color: "rgba(255,255,255,0.45)" }}>
            Manage users, configure webhooks, and monitor workspace statistics.
          </p>
        </div>
      </section>

      {/* ── Stats row ── */}
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Users,     label: "Total Users",     value: stats?.total_users ?? 0,                       accent: "#00d4ff" },
          { icon: Activity,  label: "Total Sessions",  value: stats?.total_sessions ?? 0,                    accent: "#a78bfa" },
          { icon: FileText,  label: "Total Words",     value: (stats?.total_words ?? 0).toLocaleString(),    accent: "#34d399" },
        ].map(({ icon: Icon, label, value, accent }) => (
          <div
            key={label}
            className="relative overflow-hidden rounded-3xl p-6"
            style={{ ...CARD }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100"
              style={{ background: `radial-gradient(ellipse at top left, ${accent}08 0%, transparent 70%)` }}
            />
            <div className="relative flex items-start justify-between">
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: accent }}
                >
                  {label}
                </p>
                <p className="mt-5 text-4xl font-bold tracking-tight" style={GRADIENT_TEXT}>
                  {value}
                </p>
              </div>
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: `${accent}14`, color: accent, boxShadow: `0 0 16px ${accent}20` }}
              >
                <Icon className="h-5 w-5" />
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* ── Webhook section ── */}
      <section
        className="relative overflow-hidden rounded-3xl p-6 md:p-8"
        style={CARD}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at top left, rgba(0,212,255,0.04) 0%, transparent 55%)" }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff" }}
            >
              <Webhook className="h-4 w-4" />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#00d4ff" }}>
              Webhooks
            </p>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
            Session delivery endpoint
          </h3>
          <p className="text-sm leading-6 mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
            Configure the URL that should receive saved session payloads after transcripts are persisted.
          </p>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <input
              className="h-12 rounded-2xl px-4 text-sm outline-none transition placeholder:text-white/25"
              onChange={(e) => setFormValue(e.target.value)}
              placeholder="https://your-server.com/webhook"
              style={INPUT_STYLE}
              type="url"
              value={formValue}
            />
            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              onClick={() => void handleSaveWebhook()}
              style={{ background: "linear-gradient(135deg,#7c3aed,#00d4ff)", boxShadow: "0 0 20px rgba(124,58,237,0.3)" }}
              type="button"
            >
              {isSubmitting ? "Saving…" : "Save webhook"}
            </button>
          </div>

          {status ? (
            <p className="mt-3 text-xs" style={{ color: "#34d399" }}>{status}</p>
          ) : null}
        </div>
      </section>

      {/* ── Users section ── */}
      <section
        className="relative overflow-hidden rounded-3xl p-6 md:p-8"
        style={CARD}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at top left, rgba(124,58,237,0.04) 0%, transparent 55%)" }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa" }}
            >
              <Users className="h-4 w-4" />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#a78bfa" }}>
              Users
            </p>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-6">
            Workspace members
          </h3>

          {isLoading ? (
            <div className="flex items-center gap-3 py-8" style={{ color: "rgba(255,255,255,0.35)" }}>
              <div className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#a78bfa", borderTopColor: "transparent" }} />
              <span className="text-sm">Loading admin data…</span>
            </div>
          ) : error ? (
            <div
              className="rounded-2xl px-4 py-3 text-sm"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}
            >
              {error}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              <table className="min-w-full">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["User", "Role", "Sessions", "Joined", "Actions"].map((col) => (
                      <th
                        key={col}
                        className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr
                      key={user.user_id}
                      style={{
                        borderBottom: idx < users.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      }}
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-sm text-white">
                            {user.name || "Unnamed user"}
                          </p>
                          <p className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                            {user.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                          style={
                            user.is_admin
                              ? { background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.2)" }
                              : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.07)" }
                          }
                        >
                          {user.is_admin ? <ShieldCheck className="h-3 w-3" /> : <UserCog className="h-3 w-3" />}
                          {user.is_admin ? "Administrator" : "Member"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {user.session_count ?? 0}
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                        {getSessionDateLabel(user.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {!user.is_admin ? (
                            <button
                              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all hover:brightness-110"
                              onClick={() => void promoteUser(user.user_id)}
                              style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff" }}
                              type="button"
                            >
                              <ShieldCheck className="h-3 w-3" />
                              Promote
                            </button>
                          ) : null}
                          <button
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all hover:brightness-110"
                            onClick={() => void deleteUser(user.user_id)}
                            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}
                            type="button"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
