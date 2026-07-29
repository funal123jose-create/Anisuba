import "server-only";

import { getAniListLibrarySignals } from "@/lib/anilist/client";
import { createAdminClient } from "@/lib/supabase/admin";

export async function synchronizeUserNotifications() {
  const supabase = createAdminClient();
  const { data: libraryRows, error } = await supabase.from("user_library")
    .select("user_id,franchise_id,status,anime_franchises(slug,canonical_title,cover_url)")
    .is("removed_at", null);
  if (error) throw error;
  const franchiseIds = [...new Set((libraryRows ?? []).map((row) => row.franchise_id))];
  const { data: entries } = franchiseIds.length
    ? await supabase.from("anime_entries").select("id,franchise_id").in("franchise_id", franchiseIds).order("sequence_number")
    : { data: [] };
  const firstEntry = new Map<string, string>();
  for (const entry of entries ?? []) if (!firstEntry.has(entry.franchise_id)) firstEntry.set(entry.franchise_id, entry.id);
  const entryIds = [...firstEntry.values()];
  const { data: external } = entryIds.length
    ? await supabase.from("anime_external_ids").select("entry_id,external_id").eq("provider", "anilist").in("entry_id", entryIds)
    : { data: [] };
  const anilistByEntry = new Map((external ?? []).map((row) => [row.entry_id, Number(row.external_id)]));
  const ids = [...anilistByEntry.values()].filter(Number.isInteger);
  const signals = ids.length ? (await getAniListLibrarySignals(ids)).signals : new Map();
  const now = new Date().toISOString();
  const notifications = (libraryRows ?? []).flatMap((row) => {
    const franchise = Array.isArray(row.anime_franchises) ? row.anime_franchises[0] : row.anime_franchises;
    if (!franchise) return [];
    const entryId = firstEntry.get(row.franchise_id);
    const anilistId = entryId ? anilistByEntry.get(entryId) : undefined;
    const signal = anilistId ? signals.get(anilistId) : undefined;
    const base = {
      user_id: row.user_id, franchise_id: row.franchise_id, entry_id: entryId ?? null,
      href: `/anime/${franchise.slug}/temporadas`, image_url: franchise.cover_url,
      source: "scheduler", updated_at: now,
    };
    const result: Array<Record<string, unknown>> = [];
    if (signal?.nextEpisode && signal.airingAt) result.push({
      ...base, notification_key: `episode:${signal.id}:${signal.nextEpisode}:${signal.airingAt}`,
      notification_type: "episode", title: `${franchise.canonical_title}: episodio ${signal.nextEpisode}`,
      description: `Nuevo episodio programado para ${new Date(signal.airingAt * 1000).toLocaleString("es-CO")}.`,
      label: "Próximo episodio", scheduled_for: new Date(signal.airingAt * 1000).toISOString(),
    });
    if (row.status === "waiting_next_season" || signal?.status === "NOT_YET_RELEASED") result.push({
      ...base, notification_key: `season:${anilistId ?? row.franchise_id}`, notification_type: "season",
      title: `Novedades de ${franchise.canonical_title}`, description: "Hay contenido futuro o una temporada en seguimiento.",
      label: "Seguimiento de temporada", scheduled_for: null,
    });
    if (row.status === "plan_to_watch") result.push({
      ...base, notification_key: `reminder:${row.franchise_id}`, notification_type: "reminder",
      title: `Tienes pendiente ${franchise.canonical_title}`, description: "Este título sigue en tu lista para ver.",
      label: "Planeado para ver", scheduled_for: null,
    });
    return result;
  });
  if (notifications.length) {
    const { error: upsertError } = await supabase.from("user_notifications")
      .upsert(notifications, { onConflict: "user_id,notification_key" });
    if (upsertError) throw upsertError;
  }
  let emailsSent = 0;
  const resendKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.NOTIFICATION_EMAIL_FROM;
  if (resendKey && emailFrom) {
    const { data: preferences } = await supabase.from("user_notification_preferences")
      .select("user_id,email_enabled").eq("email_enabled", true);
    for (const preference of preferences ?? []) {
      const { data: pending } = await supabase.from("user_notifications")
        .select("id,title,description,href").eq("user_id", preference.user_id)
        .is("email_sent_at", null).order("created_at").limit(20);
      if (!pending?.length) continue;
      const { data: userResult } = await supabase.auth.admin.getUserById(preference.user_id);
      const email = userResult.user?.email;
      if (!email) continue;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: emailFrom,
          to: [email],
          subject: `AniSuba: ${pending.length} novedades en tu biblioteca`,
          html: `<h1>Novedades en AniSuba</h1>${pending.map((item) => `<p><strong>${item.title}</strong><br>${item.description}<br><a href="${siteUrl}${item.href ?? "/notificaciones"}">Ver en AniSuba</a></p>`).join("")}`,
        }),
      });
      if (!response.ok) continue;
      await supabase.from("user_notifications").update({ email_sent_at: now })
        .in("id", pending.map((item) => item.id));
      emailsSent += 1;
    }
  }
  return { users: new Set((libraryRows ?? []).map((row) => row.user_id)).size, notifications: notifications.length, emailsSent };
}
