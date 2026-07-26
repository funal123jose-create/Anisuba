import { describe, expect, it } from "vitest";
import { profileDemoData } from "@/data/mock/profile";
import { createEmptyProfileData } from "@/data/profile-empty";

describe("profile presentation data", () => {
  it("mantiene completo el perfil de demostración", () => {
    expect(profileDemoData.stats).toHaveLength(5);
    expect(profileDemoData.favorites).toHaveLength(5);
    expect(profileDemoData.currentLibrary).toHaveLength(5);
  });

  it("no mezcla actividad demo con el estado live", () => {
    const liveData = createEmptyProfileData();
    expect(liveData.favorites).toEqual([]);
    expect(liveData.recentActivity).toEqual([]);
    expect(liveData.currentLibrary).toEqual([]);
    expect(liveData.stats.every((stat) => stat.value === "0" || stat.value === "0 h" || stat.value === "Hoy")).toBe(true);
  });
});
