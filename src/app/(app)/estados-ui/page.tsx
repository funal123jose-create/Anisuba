import { InterfaceStatesPage } from "@/components/ui/interface-states-page";
import { resolvePresentationDataMode } from "@/data/data-mode";
import { canAccessDeveloperTools } from "@/lib/auth/access";
import { getCurrentUserProfile } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";

export default async function InterfaceStatesRoute() {
  const profile = await getCurrentUserProfile();
  const isDemo = resolvePresentationDataMode() === "demo";
  if (!profile || !canAccessDeveloperTools({ isAdmin: profile.isAdmin, isDemo })) redirect("/dashboard");
  return <InterfaceStatesPage />;
}
