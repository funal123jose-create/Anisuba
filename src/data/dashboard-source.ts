import { createEmptyDashboardData } from "@/data/dashboard-empty";
import { dashboardData } from "@/data/mock/dashboard";
import { resolvePresentationDataMode, type PresentationDataMode } from "@/data/data-mode";
import type { DashboardData } from "@/types/dashboard";

export function createDemoDashboardData(name: string): DashboardData {
  return {
    ...dashboardData,
    user: {
      ...dashboardData.user,
      name,
    },
  };
}

export function getDashboardPresentationData(name: string): {
  data: DashboardData;
  mode: PresentationDataMode;
} {
  const mode = resolvePresentationDataMode();

  return {
    data: mode === "demo" ? createDemoDashboardData(name) : createEmptyDashboardData(name),
    mode,
  };
}
