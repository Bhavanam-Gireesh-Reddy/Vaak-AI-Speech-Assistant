import { ShieldCheck, UserRound } from "lucide-react";
import type { AuthUser } from "@/lib/auth-types";

type UserSummaryProps = {
  user: AuthUser;
  compact?: boolean;
};

export function UserSummary({ user, compact = false }: UserSummaryProps) {
  if (compact) {
    return (
      <div
        className="rounded-2xl p-4"
        style={{
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-start gap-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff" }}
          >
            <UserRound className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-white">{user.name}</p>
            <p className="mt-0.5 truncate text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              {user.email}
            </p>
            <div
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "rgba(52,211,153,0.1)", color: "#34d399" }}
            >
              <ShieldCheck className="h-3 w-3" />
              {user.is_admin ? "Administrator" : "Workspace Member"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-w-0 items-center gap-3 rounded-2xl px-5 py-4"
      style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff" }}
      >
        <UserRound className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold text-white">{user.name}</p>
        <p className="truncate text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          {user.email}
        </p>
      </div>
    </div>
  );
}
