import { AppShell } from "@/components/layout/app-shell";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth/current-user";
import { canAccessAdminArea } from "@/lib/auth/access";
import { resolvePresentationDataMode } from "@/data/data-mode";

export default async function ProductLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");
  const isDemo = resolvePresentationDataMode() === "demo";
  return (
    <AppShell profile={profile} canAccessAdmin={canAccessAdminArea({ isAdmin: profile.isAdmin, isDemo })}>
      {children}
    </AppShell>
  );
}
