export function safeAuthDestination(value: string | null | undefined, fallback = "/dashboard") {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

function normalizedOrigin(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://${value}`;
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function isLocalOrigin(value: string | null) {
  if (!value) return false;
  const hostname = new URL(value).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function getAuthSiteOrigin(
  requestOrigin: string | null | undefined,
  configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL,
  vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL,
) {
  const configuredOrigin = normalizedOrigin(configuredSiteUrl);
  const currentOrigin = normalizedOrigin(requestOrigin);
  const vercelOrigin = normalizedOrigin(vercelProductionUrl);

  // Una configuración local nunca debe contaminar enlaces emitidos desde producción.
  if (configuredOrigin && (!isLocalOrigin(configuredOrigin) || isLocalOrigin(currentOrigin))) {
    return configuredOrigin;
  }

  return currentOrigin ?? vercelOrigin ?? configuredOrigin ?? "http://localhost:3000";
}
