import { defineConfig, devices } from "@playwright/test";

const localBrowser = process.platform === "win32" ? { channel: "msedge" as const } : {};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], ...localBrowser } },
    { name: "mobile", use: { ...devices["Pixel 7"], ...localBrowser } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
