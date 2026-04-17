import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import { getServerAuthUser } from "@/lib/server-auth";

export default async function Home() {
  const user = await getServerAuthUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LandingPage isLoggedIn={false} />;
}
