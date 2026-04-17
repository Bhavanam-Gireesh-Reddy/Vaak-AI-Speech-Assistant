"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";

export function LogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    try {
      await logout();
      router.push("/");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.5)",
      }}
      disabled={isSubmitting}
      onClick={handleLogout}
      type="button"
    >
      <LogOut className="h-3.5 w-3.5" />
      {isSubmitting ? "Signing out..." : "Sign out"}
    </button>
  );
}
