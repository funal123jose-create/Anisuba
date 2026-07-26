import { describe, expect, it } from "vitest";
import { createEmptyHistoryData } from "@/data/history-empty";
import { historyDemoData } from "@/data/mock/history";

describe("history presentation data", () => {
  it("mantiene coherente el resumen mensual", () => {
    expect(historyDemoData.summary.reduce((sum, item) => sum + item.value, 0)).toBe(historyDemoData.monthActivities);
  });
  it("no mezcla actividad demo con el estado live", () => {
    expect(createEmptyHistoryData().events).toEqual([]);
  });
});
