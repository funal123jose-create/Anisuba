import { describe, expect, it } from "vitest";
import { statisticsDemoData } from "@/data/mock/statistics";
import { createEmptyStatisticsData } from "@/data/statistics-empty";

describe("statistics presentation data", () => {
  it("mantiene coherente la distribución de estados", () => {
    expect(statisticsDemoData.statusDistribution.reduce((sum, item) => sum + item.value, 0)).toBe(168);
  });

  it("separa los insights demo del estado live vacío", () => {
    expect(createEmptyStatisticsData().trend).toEqual([]);
    expect(createEmptyStatisticsData().metrics.every((metric) => metric.change === "Sin actividad")).toBe(true);
  });
});
