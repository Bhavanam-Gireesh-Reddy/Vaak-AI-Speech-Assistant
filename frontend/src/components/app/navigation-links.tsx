"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Headphones,
  LayoutDashboard,
  ListCollapse,
  Sparkles,
  Shield,
} from "lucide-react";

const baseNavigation = [
  { href: "/live",      label: "Live",      icon: Headphones },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history",   label: "History",   icon: ListCollapse },
  { href: "/studio",    label: "Studio",    icon: Sparkles },
];

export function NavigationLinks({
  isAdmin,
  onNavigate,
}: {
  isAdmin: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = isAdmin
    ? [...baseNavigation, { href: "/admin", label: "Admin", icon: Shield }]
    : baseNavigation;

  return (
    <nav className="mt-4 space-y-1.5 lg:mt-6">
      {items.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className="group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 overflow-hidden"
            style={
              isActive
                ? {
                    background: "rgba(124,58,237,0.15)",
                    border: "1px solid rgba(124,58,237,0.35)",
                    color: "#ffffff",
                    boxShadow: "0 0 24px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
                  }
                : {
                    border: "1px solid transparent",
                    color: "rgba(255,255,255,0.45)",
                  }
            }
          >
            {/* Active gradient shimmer */}
            {isActive && (
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: "linear-gradient(90deg, rgba(124,58,237,0.08) 0%, rgba(0,212,255,0.04) 100%)",
                }}
              />
            )}

            {/* Icon */}
            <span
              className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={
                isActive
                  ? {
                      background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(0,212,255,0.2))",
                      boxShadow: "0 0 10px rgba(124,58,237,0.2)",
                    }
                  : {
                      background: "rgba(255,255,255,0.04)",
                    }
              }
            >
              <Icon
                className="h-3.5 w-3.5"
                style={{ color: isActive ? "#a78bfa" : "rgba(255,255,255,0.35)" }}
              />
            </span>

            {/* Label */}
            <span
              className="relative font-semibold"
              style={
                isActive
                  ? {
                      background: "linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.85) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }
                  : {}
              }
            >
              {label}
            </span>

            {/* Active left accent bar */}
            {isActive && (
              <div
                className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
                style={{ background: "linear-gradient(to bottom, #7c3aed, #00d4ff)" }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
