"use client";

import { useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";

import { NavigationLinks } from "@/components/app/navigation-links";
import { LogoutButton } from "@/components/app/logout-button";
import { UserSummary } from "@/components/app/user-summary";
import type { AuthUser } from "@/lib/auth-types";

type AppShellProps = {
  user: AuthUser;
  children: React.ReactNode;
};

export function AppShell({ children, user }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f1f5f9_100%)]">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/70 bg-white/85 px-4 py-4 backdrop-blur lg:hidden md:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-700">
              MeetWise AI
            </p>
            <h1 className="text-sm font-semibold text-slate-950">Meeting Assistant</h1>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-lg p-2 hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6 text-slate-950" />
          ) : (
            <Menu className="h-6 w-6 text-slate-950" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 top-[60px] z-30 bg-black/50 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Main Container */}
      <div className="flex min-h-[calc(100vh-60px)] flex-col lg:min-h-screen">
        {/* Sidebar - Desktop and Mobile */}
        <aside
          className={`fixed inset-y-0 top-[60px] left-0 z-30 w-64 transform overflow-y-auto rounded-none border-r border-white/70 bg-white/85 p-4 shadow-lg backdrop-blur transition-transform duration-300 ease-in-out sm:p-6 lg:static lg:top-0 lg:inset-auto lg:w-[290px] lg:transform-none lg:rounded-[28px] lg:border lg:border-l-0 lg:shadow-[0_30px_70px_rgba(15,23,42,0.08)] ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Desktop Header - Only visible on large screens */}
          <div className="mb-6 hidden items-center gap-3 lg:flex">
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

          <NavigationLinks
            isAdmin={Boolean(user.is_admin)}
            onNavigate={closeMobileMenu}
          />

          <div className="mt-8 space-y-4 border-t border-slate-200 pt-6 lg:mt-auto">
            <UserSummary compact user={user} />
            <div className="flex justify-end">
              <LogoutButton />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:gap-6 lg:px-8">
          <main className="mx-auto w-full max-w-7xl">{children}</main>
        </div>
      </div>
    </div>
  );
}
