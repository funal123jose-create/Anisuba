import { describe, expect, it } from "vitest";
import { canAccessAdminArea } from "@/lib/auth/access";

describe("canAccessAdminArea", () => {
  it("allows administrators in production", () => {
    expect(canAccessAdminArea({ isAdmin: true, isDemo: false, environment: "production" })).toBe(true);
  });

  it("denies regular users in production even when demo data is configured", () => {
    expect(canAccessAdminArea({ isAdmin: false, isDemo: true, environment: "production" })).toBe(false);
  });

  it("keeps the approved demo review available outside production", () => {
    expect(canAccessAdminArea({ isAdmin: false, isDemo: true, environment: "development" })).toBe(true);
  });

  it("denies regular users when the local app is using live data", () => {
    expect(canAccessAdminArea({ isAdmin: false, isDemo: false, environment: "development" })).toBe(false);
  });
});
