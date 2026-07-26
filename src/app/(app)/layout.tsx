import { AppShell } from "@/components/layout/app-shell";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth/current-user";

export default async function ProductLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");
  return <AppShell profile={profile}>{children}</AppShell>;
}
