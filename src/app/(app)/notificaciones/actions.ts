"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const keySchema = z.string().trim().min(3).max(180);
const preferenceSchema = z.object({
  type: z.enum(["episode", "season", "reminder", "system"]),
  enabled: z.boolean(),
});

async function authenticatedClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, userId: data.user?.id ?? null };
}

export async function markNotificationReadAction(key: string) {
  const parsed = keySchema.safeParse(key);
  if (!parsed.success) return { ok: false };
  const { supabase, userId } = await authenticatedClient();
  if (!userId) return { ok: false };
  const now = new Date().toISOString();
  const { error } = await supabase.from("user_notification_states").upsert({
    user_id: userId,
    notification_key: parsed.data,
    read_at: now,
    updated_at: now,
  }, { onConflict: "user_id,notification_key" });
  if (!error) revalidatePath("/notificaciones");
  return { ok: !error };
}

export async function markNotificationsReadAction(keys: string[]) {
  const parsed = z.array(keySchema).max(100).safeParse(keys);
  if (!parsed.success) return { ok: false };
  const { supabase, userId } = await authenticatedClient();
  if (!userId) return { ok: false };
  const now = new Date().toISOString();
  const { error } = await supabase.from("user_notification_states").upsert(
    parsed.data.map((key) => ({
      user_id: userId,
      notification_key: key,
      read_at: now,
      updated_at: now,
    })),
    { onConflict: "user_id,notification_key" },
  );
  if (!error) revalidatePath("/notificaciones");
  return { ok: !error };
}

export async function saveNotificationReminderAction(key: string) {
  const parsed = keySchema.safeParse(key);
  if (!parsed.success) return { ok: false };
  const { supabase, userId } = await authenticatedClient();
  if (!userId) return { ok: false };
  const now = new Date();
  const remindAt = new Date(now.getTime() + 7 * 86_400_000).toISOString();
  const { error } = await supabase.from("user_notification_states").upsert({
    user_id: userId,
    notification_key: parsed.data,
    remind_at: remindAt,
    updated_at: now.toISOString(),
  }, { onConflict: "user_id,notification_key" });
  if (!error) revalidatePath("/notificaciones");
  return { ok: !error };
}

export async function updateNotificationPreferenceAction(input: {
  type: "episode" | "season" | "reminder" | "system";
  enabled: boolean;
}) {
  const parsed = preferenceSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { supabase, userId } = await authenticatedClient();
  if (!userId) return { ok: false };
  const { error } = await supabase.from("user_notification_preferences").upsert({
    user_id: userId,
    notification_type: parsed.data.type,
    enabled: parsed.data.enabled,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,notification_type" });
  if (!error) revalidatePath("/notificaciones");
  return { ok: !error };
}
