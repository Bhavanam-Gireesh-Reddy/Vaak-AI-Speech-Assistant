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
    <nav className="mt-6 space-y-1.5 lg:mt-8">
      {items.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200"
            style={
              isActive
                ? {
                    background: "rgba(124,58,237,0.15)",
                    border: "1px solid rgba(124,58,237,0.3)",
                    color: "#ffffff",
                    boxShadow: "0 0 20px rgba(124,58,237,0.1)",
                  }
                : {
                    border: "1px solid transparent",
                    color: "rgba(255,255,255,0.45)",
                  }
            }
          >
            <Icon
              className="h-4 w-4 shrink-0"
              style={{ color: isActive ? "#a78bfa" : "rgba(255,255,255,0.4)" }}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
