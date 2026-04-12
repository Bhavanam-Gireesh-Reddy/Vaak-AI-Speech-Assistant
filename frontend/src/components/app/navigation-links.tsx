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
  {
    href: "/live",
    label: "Live",
    icon: Headphones,
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/history",
    label: "History",
    icon: ListCollapse,
  },
  {
    href: "/studio",
    label: "Studio",
    icon: Sparkles,
  },
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
    ? [
        ...baseNavigation,
        {
          href: "/admin",
          label: "Admin",
          icon: Shield,
        },
      ]
    : baseNavigation;

  return (
    <nav className="mt-6 space-y-2 lg:mt-8">
      {items.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href;

        return (
          <Link
            key={href}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
              isActive
                ? "border-sky-200 bg-sky-50 text-sky-900"
                : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950"
            }`}
            href={href}
            onClick={onNavigate}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
