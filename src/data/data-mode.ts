export type PresentationDataMode = "demo" | "live";

export function resolvePresentationDataMode(
  configuredMode = process.env.ANISUBA_DATA_MODE,
  environment = process.env.NODE_ENV,
): PresentationDataMode {
  if (configuredMode === "demo" || configuredMode === "live") return configuredMode;
  return environment === "development" ? "demo" : "live";
}
