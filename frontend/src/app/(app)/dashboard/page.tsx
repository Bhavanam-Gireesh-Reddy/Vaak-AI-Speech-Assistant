import { redirect } from "next/navigation";

import { DashboardClientPage } from "@/components/dashboard/dashboard-page";
import { getServerAuthUser } from "@/lib/server-auth";

export default async function DashboardPage() {
  const user = await getServerAuthUser();

  if (!user) {
    redirect("/login");
  }

  return <DashboardClientPage user={user} />;
}
