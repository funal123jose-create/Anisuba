import type { PresentationDataMode } from "@/data/data-mode";
import { notificationsDemoData } from "@/data/mock/notifications";
import { createEmptyNotificationData } from "@/data/notifications-empty";
import { getLibraryPresentationData } from "@/data/library-source";
import { getAniListLibrarySignals } from "@/lib/anilist/client";
import { createClient } from "@/lib/supabase/server";
import type { NotificationData, NotificationItem, NotificationPreference } from "@/types/notifications";

const defaultPreferences: NotificationPreference[] = [
  { id: "episode", label: "Nuevos episodios", enabled: true },
  { id: "season", label: "Nuevas temporadas", enabled: true },
  { id: "reminder", label: "Recordatorios", enabled: true },
  { id: "system", label: "Sistema", enabled: true },
];

export function resolveNotificationsDataMode(
  configuredMode = process.env.ANISUBA_NOTIFICATIONS_DATA_MODE,
): PresentationDataMode {
  return configuredMode === "demo" ? "demo" : "live";
}

function relativeTime(timestamp: number) {
  const delta = timestamp * 1000 - Date.now();
  const days = Math.round(delta / 86_400_000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  if (days > 1) return `En ${days} días`;
  return `Hace ${Math.abs(days)} días`;
}

async function getLiveNotificationsData(): Promise<NotificationData> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return createEmptyNotificationData();
  const userId = authData.user.id;
  const { data: library } = await getLibraryPresentationData();
  if (!library.items.length) {
    return { ...createEmptyNotificationData(), preferences: defaultPreferences };
  }

  const franchiseIds = library.items.map((item) => item.franchiseId);
  const { data: entries } = await supabase
    .from("anime_entries")
    .select("id,franchise_id")
    .in("franchise_id", franchiseIds)
    .order("sequence_number", { ascending: true });
  const firstEntryByFranchise = new Map<string, string>();
  for (const entry of entries ?? []) {
    if (!firstEntryByFranchise.has(entry.franchise_id)) {
      firstEntryByFranchise.set(entry.franchise_id, entry.id);
    }
  }
  const entryIds = [...firstEntryByFranchise.values()];
  const { data: externalIds } = entryIds.length
    ? await supabase
        .from("anime_external_ids")
        .select("entry_id,external_id")
        .eq("provider", "anilist")
        .in("entry_id", entryIds)
    : { data: [] };
  const anilistIdByEntry = new Map(
    (externalIds ?? []).map((row) => [row.entry_id, Number(row.external_id)]),
  );
  let signals = new Map<number, {
    id: number;
    status: string | null;
    nextEpisode: number | null;
    airingAt: number | null;
  }>();
  try {
    const ids = [...anilistIdByEntry.values()].filter(Number.isInteger);
    if (ids.length) signals = (await getAniListLibrarySignals(ids)).signals;
  } catch (error) {
    console.error(
      "Could not load AniList notification signals",
      error instanceof Error ? error.message : "UNKNOWN",
    );
  }

  const generated: NotificationItem[] = [];
  for (const item of library.items) {
    const entryId = firstEntryByFranchise.get(item.franchiseId);
    const anilistId = entryId ? anilistIdByEntry.get(entryId) : undefined;
    const signal = anilistId ? signals.get(anilistId) : undefined;
    if (signal?.nextEpisode && signal.airingAt) {
      generated.push({
        id: `episode:${signal.id}:${signal.nextEpisode}:${signal.airingAt}`,
        type: "episode",
        title: `${item.title}: episodio ${signal.nextEpisode}`,
        description: `AniList informa un nuevo episodio programado para ${new Date(signal.airingAt * 1000).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}.`,
        label: "Próximo episodio",
        timeLabel: relativeTime(signal.airingAt),
        imageUrl: item.coverUrl,
        unread: true,
        action: "view",
        href: `/anime/${item.slug}/temporadas`,
      });
    }
    if (item.status === "waiting_next_season" || signal?.status === "NOT_YET_RELEASED") {
      generated.push({
        id: `season:${anilistId ?? item.franchiseId}`,
        type: "season",
        title: `Novedades de ${item.title}`,
        description: "Este título tiene contenido futuro o está marcado como pendiente de una nueva temporada.",
        label: "Seguimiento de temporada",
        timeLabel: "Pendiente",
        imageUrl: item.coverUrl,
        unread: true,
        action: "view",
        href: `/anime/${item.slug}/temporadas`,
      });
    }
    if (item.status === "plan_to_watch") {
      generated.push({
        id: `reminder:${item.franchiseId}`,
        type: "reminder",
        title: `Tienes pendiente ${item.title}`,
        description: "Continúa organizando tu lista o comienza este anime cuando estés listo.",
        label: "Planeado para ver",
        timeLabel: "En tu biblioteca",
        imageUrl: item.coverUrl,
        unread: true,
        action: "remind",
        href: `/anime/${item.slug}/temporadas`,
      });
    }
  }

  const { data: persistedRows } = await supabase.from("user_notifications")
    .select("notification_key,notification_type,title,description,label,href,image_url,scheduled_for,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  for (const row of persistedRows ?? []) {
    if (generated.some((item) => item.id === row.notification_key)) continue;
    const timestamp = row.scheduled_for
      ? Math.round(new Date(row.scheduled_for).getTime() / 1000)
      : Math.round(new Date(row.created_at).getTime() / 1000);
    generated.push({
      id: row.notification_key,
      type: row.notification_type as NotificationItem["type"],
      title: row.title,
      description: row.description,
      label: row.label,
      timeLabel: relativeTime(timestamp),
      imageUrl: row.image_url || "/images/anime-eclipse-cover-v2.png",
      unread: true,
      action: "view",
      href: row.href ?? "/notificaciones",
    });
  }

  const keys = generated.map((item) => item.id);
  const [stateResult, preferenceResult] = await Promise.all([
    keys.length
      ? supabase.from("user_notification_states")
          .select("notification_key,read_at,remind_at")
          .eq("user_id", userId)
          .in("notification_key", keys)
      : Promise.resolve({ data: [] }),
    supabase.from("user_notification_preferences")
      .select("notification_type,enabled")
      .eq("user_id", userId),
  ]);
  const stateByKey = new Map(
    (stateResult.data ?? []).map((row) => [row.notification_key, row]),
  );
  const preferenceByType = new Map(
    (preferenceResult.data ?? []).map((row) => [row.notification_type, row.enabled]),
  );
  const preferences = defaultPreferences.map((preference) => ({
    ...preference,
    enabled: preferenceByType.get(preference.id) ?? preference.enabled,
  }));
  const enabledTypes = new Set(
    preferences.filter((preference) => preference.enabled).map((preference) => preference.id),
  );
  const items = generated
    .filter((item) => enabledTypes.has(item.type))
    .slice(0, 80)
    .map((item) => ({
      ...item,
      unread: !stateByKey.get(item.id)?.read_at,
    }));

  return {
    totalCount: items.length,
    unreadCount: items.filter((item) => item.unread).length,
    items,
    preferences,
  };
}

export async function getNotificationsPresentationData(): Promise<{
  data: NotificationData;
  mode: PresentationDataMode;
}> {
  const mode = resolveNotificationsDataMode();
  return {
    data: mode === "demo" ? notificationsDemoData : await getLiveNotificationsData(),
    mode,
  };
}
