import { Sparkles } from "lucide-react";

import { NavigationLinks } from "@/components/app/navigation-links";
import { LogoutButton } from "@/components/app/logout-button";
import { UserSummary } from "@/components/app/user-summary";
import type { AuthUser } from "@/lib/auth-types";

type AppShellProps = {
  user: AuthUser;
  children: React.ReactNode;
};

export function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f1f5f9_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-6 py-6 lg:flex-row lg:px-8">
        <aside className="flex w-full flex-col rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_30px_70px_rgba(15,23,42,0.08)] backdrop-blur lg:min-h-[calc(100vh-3rem)] lg:w-[290px]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
                MeetWise AI
              </p>
              <h1 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                Meeting Assistant
              </h1>
            </div>
          </div>

          <NavigationLinks isAdmin={Boolean(user.is_admin)} />

          <div className="mt-8 space-y-4 border-t border-slate-200 pt-6 lg:mt-auto">
            <UserSummary compact user={user} />
            <div className="flex justify-end">
              <LogoutButton />
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col gap-6">
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
