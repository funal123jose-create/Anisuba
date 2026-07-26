import { describe, expect, it } from "vitest";
import {
  createDemoDashboardData,
} from "@/data/dashboard-source";
import { resolvePresentationDataMode } from "@/data/data-mode";

describe("dashboard data mode", () => {
  it("respeta una configuración explícita", () => {
    expect(resolvePresentationDataMode("demo", "production")).toBe("demo");
    expect(resolvePresentationDataMode("live", "development")).toBe("live");
  });

  it("usa demo en desarrollo y live en producción por defecto", () => {
    expect(resolvePresentationDataMode(undefined, "development")).toBe("demo");
    expect(resolvePresentationDataMode(undefined, "production")).toBe("live");
  });

  it("mantiene la identidad real al presentar el escenario ficticio", () => {
    const data = createDemoDashboardData("Perfil Real");

    expect(data.user.name).toBe("Perfil Real");
    expect(data.metrics[0].value).toBe("156");
  });
});
