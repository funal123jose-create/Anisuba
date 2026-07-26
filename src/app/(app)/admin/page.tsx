import { AdminPage } from "@/components/admin/admin-page";
import { resolvePresentationDataMode } from "@/data/data-mode";
import { adminDemoData } from "@/data/mock/admin";
import { canAccessAdminArea } from "@/lib/auth/access";
import { getCurrentUserProfile } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";

export default async function AdminRoute() {
  const profile = await getCurrentUserProfile();
  const isDemo = resolvePresentationDataMode() === "demo";
  if (!profile || !canAccessAdminArea({ isAdmin: profile.isAdmin, isDemo })) redirect("/dashboard");
  return <AdminPage data={adminDemoData} isDemo={isDemo} />;
}
