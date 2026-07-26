export function safeAuthDestination(value: string | null | undefined, fallback = "/dashboard") {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

function normalizedOrigin(value: string | null | undefined) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function getAuthSiteOrigin(
  requestOrigin: string | null | undefined,
  configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL,
) {
  return normalizedOrigin(configuredSiteUrl) ?? normalizedOrigin(requestOrigin) ?? "http://localhost:3000";
}
