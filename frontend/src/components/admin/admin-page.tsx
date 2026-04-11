"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert, ShieldCheck, Users, Webhook } from "lucide-react";
import { useEffect, useState } from "react";

import { useAdminData } from "@/hooks/use-admin-data";
import { getSessionDateLabel } from "@/lib/session-utils";

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
      setStatus("Webhook saved.");
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

  if (!initialIsAdmin) {
    return (
      <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 shadow-[0_20px_40px_rgba(245,158,11,0.08)]">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-amber-600">
            <ShieldAlert className="h-6 w-6" />
          </span>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
                Admin access
              </p>
              <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                This area is restricted to administrators
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                If no administrator exists yet, you can request first-time admin
                access from here. Otherwise, an existing admin needs to promote
                your account.
              </p>
            </div>

            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isSubmitting}
              onClick={() => void handleSelfPromote()}
              type="button"
            >
              <ShieldCheck className="h-4 w-4" />
              {isSubmitting ? "Checking access..." : "Request admin access"}
            </button>

            {status ? <p className="text-sm text-slate-600">{status}</p> : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: Users,
            label: "Total users",
            value: stats?.total_users ?? 0,
          },
          {
            icon: ShieldCheck,
            label: "Total sessions",
            value: stats?.total_sessions ?? 0,
          },
          {
            icon: Webhook,
            label: "Total words",
            value: stats?.total_words?.toLocaleString() ?? "0",
          },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_26px_60px_rgba(15,23,42,0.08)] backdrop-blur"
          >
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
          </div>
        ))}
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white/90 p-7 shadow-[0_26px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
          Webhooks
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
          Session delivery endpoint
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Configure the URL that should receive saved session payloads after
          transcripts are persisted.
        </p>

        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <input
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            onChange={(event) => setFormValue(event.target.value)}
            placeholder="https://your-server.com/webhook"
            type="url"
            value={formValue}
          />
          <button
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isSubmitting}
            onClick={() => void handleSaveWebhook()}
            type="button"
          >
            {isSubmitting ? "Saving..." : "Save webhook"}
          </button>
        </div>

        {status ? <p className="mt-3 text-sm text-slate-500">{status}</p> : null}
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white/90 p-7 shadow-[0_26px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
              Users
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              Workspace members
            </h3>
          </div>
        </div>

        {isLoading ? (
          <p className="mt-8 text-sm text-slate-500">Loading admin data...</p>
        ) : error ? (
          <p className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : (
          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Sessions</th>
                  <th className="px-5 py-4">Joined</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {user.name || "Unnamed user"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {user.is_admin ? "Administrator" : "Member"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {user.session_count ?? 0}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {getSessionDateLabel(user.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {!user.is_admin ? (
                          <button
                            className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                            onClick={() => void promoteUser(user.user_id)}
                            type="button"
                          >
                            Promote
                          </button>
                        ) : null}
                        <button
                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                          onClick={() => void deleteUser(user.user_id)}
                          type="button"
                        >
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
      </section>
    </div>
  );
}
