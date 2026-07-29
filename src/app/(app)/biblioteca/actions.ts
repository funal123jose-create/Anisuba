"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const favoriteSchema = z.object({
  franchiseId: z.string().uuid(),
  favorite: z.boolean(),
});

const progressSchema = z.object({
  franchiseId: z.string().uuid(),
  status: z.enum([
    "plan_to_watch",
    "watching",
    "caught_up",
    "paused",
    "completed",
    "waiting_next_season",
    "dropped",
  ]),
  episodesWatched: z.number().int().min(0).max(10000),
});

const removeSchema = z.object({
  franchiseId: z.string().uuid(),
});

const ratingSchema = z.object({
  franchiseId: z.string().uuid(),
  score: z.number().min(1).max(10),
});

export async function setLibraryFavoriteAction(input: {
  franchiseId: string;
  favorite: boolean;
}) {
  const parsed = favoriteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Anime no válido." };

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { ok: false, message: "Tu sesión expiró." };
  }

  const userId = authData.user.id;
  const mutation = parsed.data.favorite
    ? supabase.from("favorites").upsert(
        { user_id: userId, franchise_id: parsed.data.franchiseId },
        { onConflict: "user_id,franchise_id" },
      )
    : supabase.from("favorites").delete()
        .eq("user_id", userId)
        .eq("franchise_id", parsed.data.franchiseId);

  const { error } = await mutation;
  if (error) return { ok: false, message: "No pudimos actualizar favoritos." };

  await supabase.from("activity_history").insert({
    user_id: userId,
    event_type: parsed.data.favorite ? "favorite_added" : "favorite_removed",
    franchise_id: parsed.data.franchiseId,
    metadata: { source: "library" },
  });

  revalidatePath("/biblioteca");
  revalidatePath("/favoritos");
  return { ok: true };
}

export async function updateLibraryProgressAction(input: {
  franchiseId: string;
  status: z.infer<typeof progressSchema>["status"];
  episodesWatched: number;
}) {
  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Revisa el estado y el progreso." };

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { ok: false, message: "Tu sesión expiró." };
  }

  const userId = authData.user.id;
  const { data: libraryRow, error: libraryError } = await supabase
    .from("user_library")
    .select("id")
    .eq("user_id", userId)
    .eq("franchise_id", parsed.data.franchiseId)
    .is("removed_at", null)
    .maybeSingle();
  if (libraryError || !libraryRow) {
    return { ok: false, message: "El anime ya no está en tu biblioteca." };
  }

  const { data: entry, error: entryError } = await supabase
    .from("anime_entries")
    .select("id,episode_count")
    .eq("franchise_id", parsed.data.franchiseId)
    .order("sequence_number", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (entryError || !entry) {
    return { ok: false, message: "No encontramos la temporada principal." };
  }

  const episodeCount = entry.episode_count ?? 0;
  const episodesWatched = parsed.data.status === "completed"
    ? episodeCount
    : parsed.data.episodesWatched;
  if (episodeCount > 0 && episodesWatched > episodeCount) {
    return { ok: false, message: `El progreso no puede superar ${episodeCount} episodios.` };
  }

  const today = new Date().toISOString().slice(0, 10);
  const [{ error: statusError }, { error: progressError }] = await Promise.all([
    supabase
      .from("user_library")
      .update({
        status: parsed.data.status,
        finished_at: parsed.data.status === "completed" ? today : null,
        removed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("franchise_id", parsed.data.franchiseId),
    supabase
      .from("user_entry_progress")
      .upsert(
        {
          user_id: userId,
          entry_id: entry.id,
          episodes_watched: episodesWatched,
          completed: parsed.data.status === "completed"
            || (episodeCount > 0 && episodesWatched === episodeCount),
          last_watched_at: episodesWatched > 0 ? new Date().toISOString() : null,
        },
        { onConflict: "user_id,entry_id" },
      ),
  ]);

  if (statusError || progressError) {
    return { ok: false, message: "No pudimos actualizar el estado y el progreso." };
  }

  await supabase
    .from("catalog_draft_preferences")
    .update({
      library_status: parsed.data.status,
      initial_episode: episodesWatched,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("franchise_id", parsed.data.franchiseId);

  await supabase.from("activity_history").insert({
    user_id: userId,
    event_type: "progress_updated",
    franchise_id: parsed.data.franchiseId,
    entry_id: entry.id,
    metadata: {
      source: "library",
      status: parsed.data.status,
      episodes_watched: episodesWatched,
    },
  });

  revalidatePath("/biblioteca");
  revalidatePath("/seguimiento");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setLibraryRatingAction(input: {
  franchiseId: string;
  score: number;
}) {
  const parsed = ratingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "La puntuación debe estar entre 1 y 10." };

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return { ok: false, message: "Tu sesión expiró." };

  const { error } = await supabase.from("ratings").upsert({
    user_id: authData.user.id,
    franchise_id: parsed.data.franchiseId,
    score: parsed.data.score,
  }, { onConflict: "user_id,franchise_id" });
  if (error) return { ok: false, message: "No pudimos guardar tu puntuación." };

  await supabase.from("activity_history").insert({
    user_id: authData.user.id,
    event_type: "rating_created",
    franchise_id: parsed.data.franchiseId,
    metadata: { source: "anime_detail", score: parsed.data.score },
  });
  revalidatePath(`/anime`);
  revalidatePath("/biblioteca");
  revalidatePath("/favoritos");
  return { ok: true };
}

export async function removeLibraryItemAction(input: { franchiseId: string }) {
  const parsed = removeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Anime no válido." };

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { ok: false, message: "Tu sesión expiró." };
  }

  const userId = authData.user.id;
  const removedAt = new Date().toISOString();
  const { error } = await supabase
    .from("user_library")
    .update({ removed_at: removedAt, updated_at: removedAt })
    .eq("user_id", userId)
    .eq("franchise_id", parsed.data.franchiseId)
    .is("removed_at", null);
  if (error) return { ok: false, message: "No pudimos quitar el anime de tu biblioteca." };

  await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("franchise_id", parsed.data.franchiseId);

  await supabase.from("activity_history").insert({
    user_id: userId,
    event_type: "library_removed",
    franchise_id: parsed.data.franchiseId,
    metadata: { source: "library", removed_at: removedAt },
  });

  revalidatePath("/biblioteca");
  revalidatePath("/favoritos");
  revalidatePath("/seguimiento");
  revalidatePath("/dashboard");
  return { ok: true };
}
