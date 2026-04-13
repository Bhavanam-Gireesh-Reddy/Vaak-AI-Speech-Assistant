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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: "#07070f" }}>

      {/* ── Ambient Background (fixed — bleeds through all pages) ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Purple glow — top-left */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "700px",
            height: "700px",
            background: "radial-gradient(circle at top left, rgba(124,58,237,0.22) 0%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />
        {/* Cyan glow — bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle at bottom right, rgba(0,212,255,0.14) 0%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />
        {/* Mid purple accent */}
        <div
          style={{
            position: "absolute",
            top: "45%",
            left: "35%",
            width: "900px",
            height: "500px",
            background: "radial-gradient(ellipse, rgba(124,58,237,0.04) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Dot grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.028,
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* ── Mobile Header ── */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between px-3 py-3 sm:px-4 sm:py-3.5 md:px-6 lg:hidden"
        style={{
          background: "rgba(7,7,15,0.9)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg,#7c3aed,#00d4ff)", boxShadow: "0 0 16px rgba(124,58,237,0.4)" }}
          >
            <Mic2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
          </span>
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest" style={{ color: "#00d4ff" }}>
              MeetWise AI
            </p>
            <h1 className="text-xs sm:text-sm font-semibold text-white">Meeting Assistant</h1>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-xl p-2 transition-colors"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5 text-white" />
          ) : (
            <Menu className="h-5 w-5 text-white" />
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 top-[54px] sm:top-[60px] z-30 lg:hidden"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={closeMobileMenu}
        />
      )}

      {/* ── Main Container ── */}
      <div className="relative z-10 flex min-h-[calc(100vh-54px)] sm:min-h-[calc(100vh-60px)] flex-col lg:min-h-screen">

        {/* ── Sidebar ── */}
        <aside
          className={`fixed inset-y-0 top-[54px] sm:top-[60px] left-0 z-30 w-56 sm:w-64 transform overflow-y-auto p-4 md:p-5 transition-transform duration-300 ease-in-out lg:static lg:top-0 lg:inset-auto lg:w-72 lg:transform-none ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
          style={{
            background: "rgba(7,7,15,0.92)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            borderRight: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Desktop logo */}
          <div className="mb-2 hidden items-center gap-3 lg:flex">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{
                background: "linear-gradient(135deg,#7c3aed,#00d4ff)",
                boxShadow: "0 0 20px rgba(124,58,237,0.4)",
              }}
            >
              <Mic2 className="h-5 w-5 text-white" />
            </span>
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.22em]"
                style={{ color: "#00d4ff" }}
              >
                MeetWise AI
              </p>
              <h1 className="text-base font-bold tracking-tight text-white">
                Meeting Assistant
              </h1>
            </div>
          </div>

          {/* Nav divider */}
          <div
            className="hidden lg:block mb-5 mt-5"
            style={{ height: "1px", background: "linear-gradient(to right, rgba(124,58,237,0.3), rgba(0,212,255,0.2), transparent)" }}
          />

          <NavigationLinks isAdmin={Boolean(user.is_admin)} onNavigate={closeMobileMenu} />

          <div
            className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 pt-4 sm:pt-5 lg:mt-auto"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <UserSummary compact user={user} />
            <div className="flex justify-end">
              <LogoutButton />
            </div>
          </div>
        </aside>

        {/* ── Page Content ── */}
        <div className="flex flex-1 flex-col overflow-x-hidden">
          <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 md:p-8 lg:p-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
