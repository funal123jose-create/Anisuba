"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setEmailNotificationsAction(enabled: boolean) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false, message: "Tu sesión expiró." };
  const { error } = await supabase.from("user_notification_preferences").upsert({
    user_id: data.user.id,
    notification_type: "system",
    enabled: true,
    email_enabled: enabled,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,notification_type" });
  if (error) return { ok: false, message: "No pudimos guardar la preferencia." };
  revalidatePath("/configuracion");
  return { ok: true };
}
