import { Dashboard } from "@/components/dashboard/dashboard";
import { getDashboardPresentationData } from "@/data/dashboard-source";
import { getCurrentUserProfile } from "@/lib/auth/current-user";

export default async function DashboardPage() {
  const profile = await getCurrentUserProfile();
  const { data, mode } = getDashboardPresentationData(profile?.displayName ?? "Usuario");

  return <Dashboard data={data} isDemo={mode === "demo"} />;
}
