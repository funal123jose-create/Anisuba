import { AdminPage } from "@/components/admin/admin-page";
import { resolvePresentationDataMode } from "@/data/data-mode";
import { adminDemoData } from "@/data/mock/admin";

export default function AdminRoute() {
  return <AdminPage data={adminDemoData} isDemo={resolvePresentationDataMode() === "demo"} />;
}
