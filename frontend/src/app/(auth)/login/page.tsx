import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getServerAuthUser } from "@/lib/server-auth";

export default async function LoginPage() {
  const user = await getServerAuthUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      alternateHref="/register"
      alternateLabel="Create an account"
      alternateText="Need access for a new teammate?"
      description="Move from static templates to a more durable frontend foundation without sacrificing clarity, speed, or trust."
      eyebrow="Authentication"
      title="A smarter way into your Vaak AI workspace"
    >
      <LoginForm />
    </AuthShell>
  );
}
