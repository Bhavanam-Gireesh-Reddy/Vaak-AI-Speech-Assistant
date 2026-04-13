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

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError("Please complete your name, email, and password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: "#00d4ff" }}>
          Register
        </p>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-white">Create your account</h2>
          <p className="text-sm leading-6" style={{ color: "rgba(255,255,255,0.45)" }}>
            Set up a clean authentication foundation so the rest of the migration can layer in without rewiring your user flow.
          </p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.65)" }} htmlFor="register-name">
            Full name
          </label>
          <input
            autoComplete="name"
            className={inputClass}
            style={inputStyle}
            id="register-name"
            name="name"
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            type="text"
            value={name}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.65)" }} htmlFor="register-email">
            Email
          </label>
          <input
            autoComplete="email"
            className={inputClass}
            style={inputStyle}
            id="register-email"
            name="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.65)" }} htmlFor="register-password">
            Password
          </label>
          <input
            autoComplete="new-password"
            className={inputClass}
            style={inputStyle}
            id="register-password"
            name="password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
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
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <div
        className="rounded-2xl px-4 py-3 text-sm"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)" }}
      >
        Already registered?{" "}
        <Link className="font-semibold transition-colors hover:opacity-80" style={{ color: "#00d4ff" }} href="/login">
          Sign in here
        </Link>
      </div>
    </div>
  );
}
