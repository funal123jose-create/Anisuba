"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  buildCatalogMediaPath,
  CATALOG_MEDIA_BUCKET,
  validateCatalogImage,
} from "@/lib/anime/catalog-media";
import { syncAniListFranchise } from "@/lib/anilist/franchise-sync";
import { createClient } from "@/lib/supabase/server";

const entrySchema = z.object({
  franchiseId: z.string().uuid(),
  entryId: z.string().uuid().optional().or(z.literal("")),
  routeSlug: z.string().trim().min(1).max(220),
  title: z.string().trim().min(1).max(180),
  entryType: z.enum(["season", "movie", "ova", "special"]),
  episodeCount: z.coerce.number().int().min(0).max(10000),
  episodeDurationMinutes: z.preprocess(
    (value) => value === "" ? null : value,
    z.coerce.number().int().positive().max(1000).nullable(),
  ),
  releaseYear: z.preprocess(
    (value) => value === "" ? null : value,
    z.coerce.number().int().min(1900).max(new Date().getFullYear() + 10).nullable(),
  ),
  officialStatus: z.string().trim().max(80),
  personalStatus: z.enum(["not_started", "watching", "completed"]),
  episodesWatched: z.coerce.number().int().min(0).max(10000),
}).superRefine((value, context) => {
  if (value.personalStatus !== "completed" && value.episodesWatched > value.episodeCount) {
    context.addIssue({
      code: "custom",
      message: "El progreso no puede superar el total de episodios.",
      path: ["episodesWatched"],
    });
  }
});

const deleteSchema = z.object({
  franchiseId: z.string().uuid(),
  entryId: z.string().uuid(),
  routeSlug: z.string().trim().min(1).max(220),
});

const progressSchema = z.object({
  franchiseId: z.string().uuid(),
  entryId: z.string().uuid(),
  routeSlug: z.string().trim().min(1).max(220),
  episodesWatched: z.coerce.number().int().min(0).max(10000),
});

function entrySlug(routeSlug: string, type: string, sequenceNumber: number) {
  return `${routeSlug}-${type}-${String(sequenceNumber).replace(".", "-")}`;
}

async function ownedDraft(franchiseId: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { supabase, ok: false as const, userId: null };
  const { data } = await supabase
    .from("anime_franchises")
    .select("id")
    .eq("id", franchiseId)
    .eq("submitted_by", authData.user.id)
    .eq("record_status", "draft")
    .maybeSingle();
  return { supabase, ok: Boolean(data), userId: authData.user.id };
}

function optionalImage(formData: FormData) {
  const value = formData.get("coverFile");
  return value instanceof File && value.size > 0 ? value : null;
}

async function uploadEntryCover({
  entryId,
  file,
  franchiseId,
  supabase,
  userId,
}: {
  entryId: string;
  file: File;
  franchiseId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
}) {
  const validated = await validateCatalogImage(file);
  const path = buildCatalogMediaPath({
    extension: validated.extension,
    franchiseId,
    kind: "cover",
    userId,
  });
  const { error: uploadError } = await supabase.storage
    .from(CATALOG_MEDIA_BUCKET)
    .upload(path, validated.bytes, {
      cacheControl: "3600",
      contentType: validated.mimeType,
      upsert: false,
    });
  if (uploadError) throw new Error("ENTRY_COVER_UPLOAD_FAILED");

  const { data: publicUrlData } = supabase.storage
    .from(CATALOG_MEDIA_BUCKET)
    .getPublicUrl(path);
  const { data, error: attachError } = await supabase.rpc("attach_catalog_upload", {
    p_franchise_id: franchiseId,
    p_entry_id: entryId,
    p_asset_kind: "cover",
    p_storage_bucket: CATALOG_MEDIA_BUCKET,
    p_storage_path: path,
    p_asset_url: publicUrlData.publicUrl,
    p_mime_type: validated.mimeType,
    p_byte_size: file.size,
    p_width: null,
    p_height: null,
  });
  if (attachError) {
    await supabase.storage.from(CATALOG_MEDIA_BUCKET).remove([path]);
    throw new Error("ENTRY_COVER_ATTACH_FAILED");
  }
  const attached = Array.isArray(data) ? data[0] : data;
  if (attached?.previous_storage_path && attached.previous_storage_path !== path) {
    await supabase.storage
      .from(attached.previous_storage_bucket || CATALOG_MEDIA_BUCKET)
      .remove([attached.previous_storage_path]);
  }
}

export async function saveManagedEntryAction(formData: FormData) {
  const parsed = entrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const coverFile = optionalImage(formData);
  if (coverFile) await validateCatalogImage(coverFile);
  const { supabase, ok, userId } = await ownedDraft(parsed.data.franchiseId);
  if (!ok || !userId) return;

  const { data: existingEntries, error: entryListError } = await supabase
    .from("anime_entries")
    .select("id,sequence_number")
    .eq("franchise_id", parsed.data.franchiseId)
    .order("sequence_number", { ascending: true });
  if (entryListError) return;
  const currentEntry = existingEntries?.find((entry) => entry.id === parsed.data.entryId);
  const sequenceNumber = currentEntry
    ? Number(currentEntry.sequence_number)
    : Math.max(0, ...(existingEntries ?? []).map((entry) => Number(entry.sequence_number))) + 1;

  const payload = {
    franchise_id: parsed.data.franchiseId,
    slug: entrySlug(
      parsed.data.routeSlug,
      parsed.data.entryType,
      sequenceNumber,
    ),
    title: parsed.data.title,
    entry_type: parsed.data.entryType,
    sequence_number: sequenceNumber,
    episode_count: parsed.data.episodeCount,
    episode_duration_minutes: parsed.data.episodeDurationMinutes,
    aired_from: parsed.data.releaseYear ? `${parsed.data.releaseYear}-01-01` : null,
    official_status: parsed.data.officialStatus || null,
    source_name: "manual",
    updated_at: new Date().toISOString(),
  };

  let savedEntryId = parsed.data.entryId || "";
  if (savedEntryId) {
    const { error } = await supabase
      .from("anime_entries")
      .update(payload)
      .eq("id", savedEntryId)
      .eq("franchise_id", parsed.data.franchiseId);
    if (error) return;
  } else {
    const { data: insertedEntry, error } = await supabase
      .from("anime_entries")
      .insert(payload)
      .select("id")
      .single();
    if (error || !insertedEntry) return;
    savedEntryId = insertedEntry.id;
  }

  const episodesWatched = parsed.data.personalStatus === "completed"
    ? parsed.data.episodeCount
    : parsed.data.personalStatus === "not_started"
      ? 0
      : parsed.data.episodesWatched;
  const { error: progressError } = await supabase
    .from("user_entry_progress")
    .upsert(
      {
        user_id: userId,
        entry_id: savedEntryId,
        episodes_watched: episodesWatched,
        completed: parsed.data.personalStatus === "completed",
        last_watched_at: episodesWatched > 0 ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,entry_id" },
    );
  if (progressError) return;

  if (coverFile) {
    await uploadEntryCover({
      entryId: savedEntryId,
      file: coverFile,
      franchiseId: parsed.data.franchiseId,
      supabase,
      userId,
    });
  }
  await supabase.from("activity_history").insert({
    user_id: userId,
    event_type: "progress_updated",
    franchise_id: parsed.data.franchiseId,
    entry_id: savedEntryId,
    metadata: {
      source: "season_management",
      personal_status: parsed.data.personalStatus,
      episodes_watched: episodesWatched,
    },
  });
  revalidatePath(`/anime/${parsed.data.routeSlug}/temporadas`);
  revalidatePath("/agregar-anime/manual");
  revalidatePath("/dashboard");
  revalidatePath("/historial");
  revalidatePath("/estadisticas");
}

export async function deleteManagedEntryAction(formData: FormData) {
  const parsed = deleteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { supabase, ok } = await ownedDraft(parsed.data.franchiseId);
  if (!ok) return;

  await supabase
    .from("anime_entries")
    .delete()
    .eq("id", parsed.data.entryId)
    .eq("franchise_id", parsed.data.franchiseId);
  revalidatePath(`/anime/${parsed.data.routeSlug}/temporadas`);
}

export async function syncAniListTrackingAction(formData: FormData) {
  const parsed = z.object({
    franchiseId: z.string().uuid(),
    routeSlug: z.string().trim().min(1).max(220),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { supabase, ok } = await ownedDraft(parsed.data.franchiseId);
  if (!ok) return;
  const { data: externalId } = await supabase
    .from("anime_external_ids")
    .select("external_id,anime_entries!inner(franchise_id)")
    .eq("provider", "anilist")
    .eq("is_primary", true)
    .eq("anime_entries.franchise_id", parsed.data.franchiseId)
    .maybeSingle();
  const anilistId = Number(externalId?.external_id);
  if (!Number.isInteger(anilistId) || anilistId <= 0) return;
  await syncAniListFranchise({
    anilistId,
    franchiseId: parsed.data.franchiseId,
    supabase,
  });
  revalidatePath(`/anime/${parsed.data.routeSlug}/temporadas`);
}

export async function updateManagedEntryProgressAction(formData: FormData) {
  const parsed = progressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return;

  const [{ data: libraryRow }, { data: entry }] = await Promise.all([
    supabase
      .from("user_library")
      .select("id")
      .eq("user_id", authData.user.id)
      .eq("franchise_id", parsed.data.franchiseId)
      .is("removed_at", null)
      .maybeSingle(),
    supabase
      .from("anime_entries")
      .select("id,episode_count")
      .eq("id", parsed.data.entryId)
      .eq("franchise_id", parsed.data.franchiseId)
      .maybeSingle(),
  ]);
  if (!libraryRow || !entry) return;

  const episodeCount = entry.episode_count ?? 0;
  const episodesWatched = episodeCount > 0
    ? Math.min(parsed.data.episodesWatched, episodeCount)
    : parsed.data.episodesWatched;
  const completed = episodeCount > 0 && episodesWatched >= episodeCount;
  const now = new Date().toISOString();
  const { error } = await supabase.from("user_entry_progress").upsert({
    user_id: authData.user.id,
    entry_id: entry.id,
    episodes_watched: episodesWatched,
    completed,
    last_watched_at: episodesWatched > 0 ? now : null,
    updated_at: now,
  }, { onConflict: "user_id,entry_id" });
  if (error) return;

  const { data: franchiseEntries } = await supabase
    .from("anime_entries")
    .select("id,episode_count")
    .eq("franchise_id", parsed.data.franchiseId);
  const franchiseEntryIds = (franchiseEntries ?? []).map((item) => item.id);
  const { data: progressRows } = franchiseEntryIds.length
    ? await supabase
        .from("user_entry_progress")
        .select("entry_id,episodes_watched,completed")
        .eq("user_id", authData.user.id)
        .in("entry_id", franchiseEntryIds)
    : { data: [] };
  const progressByEntry = new Map(
    (progressRows ?? []).map((item) => [item.entry_id, item]),
  );
  const allCompleted = Boolean(franchiseEntries?.length) && (franchiseEntries ?? []).every((item) => {
    const progress = progressByEntry.get(item.id);
    return Boolean(progress?.completed)
      || Boolean(item.episode_count && progress?.episodes_watched >= item.episode_count);
  });
  const anyStarted = (progressRows ?? []).some((item) => item.episodes_watched > 0);
  await supabase
    .from("user_library")
    .update({
      status: allCompleted ? "completed" : anyStarted ? "watching" : "plan_to_watch",
      finished_at: allCompleted ? now.slice(0, 10) : null,
      updated_at: now,
    })
    .eq("user_id", authData.user.id)
    .eq("franchise_id", parsed.data.franchiseId);

  await supabase.from("activity_history").insert({
    user_id: authData.user.id,
    event_type: "progress_updated",
    franchise_id: parsed.data.franchiseId,
    entry_id: entry.id,
    metadata: {
      source: "season_management",
      episodes_watched: episodesWatched,
      completed,
    },
  });
  revalidatePath(`/anime/${parsed.data.routeSlug}/temporadas`);
  revalidatePath("/biblioteca");
  revalidatePath("/seguimiento");
  revalidatePath("/dashboard");
  revalidatePath("/historial");
  revalidatePath("/estadisticas");
}
