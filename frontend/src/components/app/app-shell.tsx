"use client";

import { useState } from "react";
import { Menu, Mic2, X } from "lucide-react";

import { NavigationLinks } from "@/components/app/navigation-links";
import { LogoutButton } from "@/components/app/logout-button";
import { UserSummary } from "@/components/app/user-summary";
import type { AuthUser } from "@/lib/auth-types";

type AppShellProps = {
  user: AuthUser;
  children: React.ReactNode;
};

export function AppShell({ children, user }: AppShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const close = () => setIsMobileOpen(false);

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ background: "#07070f" }}
    >
      {/* ── Fixed ambient background (bleeds through all pages) ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          style={{
            position: "absolute", top: 0, left: 0,
            width: "700px", height: "700px",
            background: "radial-gradient(circle at top left, rgba(124,58,237,0.22) 0%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute", bottom: 0, right: 0,
            width: "600px", height: "600px",
            background: "radial-gradient(circle at bottom right, rgba(0,212,255,0.14) 0%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute", top: "45%", left: "35%",
            width: "900px", height: "500px",
            background: "radial-gradient(ellipse, rgba(124,58,237,0.04) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Dot grid */}
        <div
          style={{
            position: "absolute", inset: 0,
            opacity: 0.028,
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* ── Top horizontal navbar ── */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-10 xl:px-12"
        style={{
          height: "64px",
          background: "rgba(7,7,15,0.92)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* ── Left: Logo ── */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              background: "linear-gradient(135deg,#7c3aed,#00d4ff)",
              boxShadow: "0 0 18px rgba(124,58,237,0.5)",
            }}
          >
            <Mic2 className="h-4 w-4 text-white" />
          </span>
          <div className="hidden sm:block">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.22em] leading-none"
              style={{ color: "#00d4ff" }}
            >
              Vaak AI
            </p>
            <p className="text-[13px] font-semibold text-white leading-tight mt-0.5">
              Speech Assistant
            </p>
          </div>
        </div>

        {/* ── Center: Nav links (desktop) ── */}
        <div className="hidden md:flex flex-1 items-center justify-center">
          <NavigationLinks
            isAdmin={Boolean(user.is_admin)}
            onNavigate={close}
            horizontal
          />
        </div>

        {/* ── Right: User + sign out (desktop) ── */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <UserSummary user={user} navbar />
          <LogoutButton />
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          onClick={() => setIsMobileOpen((v) => !v)}
          className="md:hidden rounded-xl p-2 transition-colors"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.09)",
          }}
          aria-label="Toggle menu"
        >
          {isMobileOpen ? (
            <X className="h-5 w-5 text-white" />
          ) : (
            <Menu className="h-5 w-5 text-white" />
          )}
        </button>
      </header>

      {/* ── Mobile dropdown menu ── */}
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-16 z-30 md:hidden"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={close}
          />
          {/* Menu panel */}
          <div
            className="fixed top-16 left-0 right-0 z-40 md:hidden p-4 space-y-3"
            style={{
              background: "rgba(7,7,15,0.98)",
              backdropFilter: "blur(28px)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <NavigationLinks isAdmin={Boolean(user.is_admin)} onNavigate={close} />
            <div
              className="pt-3 space-y-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
            >
              <UserSummary user={user} compact />
              <div className="flex justify-end">
                <LogoutButton />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Page content ── */}
      <div className="relative z-10">
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-10 xl:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
