import { ShieldCheck, UserRound } from "lucide-react";

import type { AuthUser } from "@/lib/auth-types";

type UserSummaryProps = {
  user: AuthUser;
  compact?: boolean;
};

export function UserSummary({
  user,
  compact = false,
}: UserSummaryProps) {
  if (compact) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <UserRound className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-950">
              {user.name}
            </p>
            <p className="mt-1 truncate text-sm text-slate-600">{user.email}</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              {user.is_admin ? "Administrator" : "Workspace Member"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[26px] border border-slate-200 bg-slate-50/90 px-5 py-4">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-sky-100 text-sky-700">
        <UserRound className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold text-slate-950">{user.name}</p>
        <p className="truncate text-sm text-slate-500">{user.email}</p>
      </div>
    </div>
  );
}
