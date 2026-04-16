"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";

const inputClass =
  "h-12 w-full rounded-2xl px-4 text-sm text-white outline-none transition placeholder:text-white/25";

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const inputFocusStyle = `focus:ring-2`;

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Please fill in both your email and password.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: "#00d4ff" }}>
          Sign In
        </p>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-white">Welcome back</h2>
          <p className="text-sm leading-6" style={{ color: "rgba(255,255,255,0.45)" }}>
            Access your transcription workspace, account settings, and session history.
          </p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.65)" }} htmlFor="login-email">
            Email
          </label>
          <input
            autoComplete="email"
            className={`${inputClass} ${inputFocusStyle}`}
            style={inputStyle}
            id="login-email"
            name="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.65)" }} htmlFor="login-password">
            Password
          </label>
          <input
            autoComplete="current-password"
            className={`${inputClass} ${inputFocusStyle}`}
            style={inputStyle}
            id="login-password"
            name="password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            type="password"
            value={password}
          />
        </div>

        {error && (
          <div
            className="rounded-2xl px-4 py-3 text-sm"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}
          >
            {error}
          </div>
        )}

        <button
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#7c3aed,#00d4ff)", boxShadow: "0 0 30px rgba(124,58,237,0.3)" }}
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div
        className="rounded-2xl px-4 py-3 text-sm"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)" }}
      >
        New to Vaak AI?{" "}
        <Link className="font-semibold transition-colors hover:opacity-80" style={{ color: "#00d4ff" }} href="/register">
          Create your account
        </Link>
      </div>
    </div>
  );
}
