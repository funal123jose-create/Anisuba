import "server-only";

import { createHash } from "node:crypto";
import {
  getAniListFranchiseById,
  getAniListRelationSnapshots,
  type AniListFranchiseEntry,
  type AniListRelationSnapshot,
} from "@/lib/anilist/client";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_CHANGED_FRANCHISES_PER_RUN = 8;

const entryTypeMap: Record<string, "season" | "movie" | "ova" | "special"> = {
  MOVIE: "movie",
  OVA: "ova",
  ONA: "ova",
  SPECIAL: "special",
};

const officialStatusMap: Record<string, string> = {
  FINISHED: "Finalizado",
  RELEASING: "En emisión",
  NOT_YET_RELEASED: "Próximamente",
  CANCELLED: "Cancelado",
  HIATUS: "Pausado",
};

const relationTypeMap: Record<string, string> = {
  SEQUEL: "sequel",
  PREQUEL: "prequel",
  SPIN_OFF: "spin_off",
  SIDE_STORY: "side_story",
  PARENT: "parent_story",
};

type LibraryRow = {
  user_id: string;
  franchise_id: string;
  anime_franchises:
    | {
      slug: string;
      canonical_title: string;
      cover_url: string | null;
      submitted_by: string | null;
    }
    | Array<{
      slug: string;
      canonical_title: string;
      cover_url: string | null;
      submitted_by: string | null;
    }>
    | null;
};

type CatalogEntry = {
  id: string;
  franchise_id: string;
  sequence_number: number;
  source_name: string | null;
  source_external_id: string | null;
};

type SyncState = {
  franchise_id: string;
  relation_fingerprint: string;
  consecutive_failures: number;
};

function oneFranchise(row: LibraryRow) {
  return Array.isArray(row.anime_franchises)
    ? row.anime_franchises[0] ?? null
    : row.anime_franchises;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "anime";
}

function fingerprint(snapshots: AniListRelationSnapshot[]) {
  const stable = snapshots
    .map((snapshot) => ({
      id: snapshot.source.id,
      status: snapshot.source.status,
      episodes: snapshot.source.episodes,
      duration: snapshot.source.duration,
      startDate: snapshot.source.startDate,
      relations: snapshot.relations
        .map((relation) => ({
          id: relation.id,
          type: relation.relationType,
          format: relation.format,
          startDate: relation.startDate,
        }))
        .sort((left, right) => left.id - right.id),
    }))
    .sort((left, right) => left.id - right.id);

  return createHash("sha256").update(JSON.stringify(stable)).digest("hex");
}

function nextCheck(hours: number) {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

async function synchronizeChangedFranchise({
  franchiseId,
  primaryAniListId,
  libraryRows,
  entries,
  entryByAniListId,
}: {
  franchiseId: string;
  primaryAniListId: number;
  libraryRows: LibraryRow[];
  entries: CatalogEntry[];
  entryByAniListId: Map<number, CatalogEntry>;
}) {
  const supabase = createAdminClient();
  const franchise = oneFranchise(libraryRows[0]);
  if (!franchise) throw new Error("FRANCHISE_NOT_FOUND");

  const remoteEntries = await getAniListFranchiseById(primaryAniListId);
  const users = [...new Set(libraryRows.map((row) => row.user_id))];
  const primaryEntry = entryByAniListId.get(primaryAniListId)
    ?? entries.find((entry) => entry.franchise_id === franchiseId);
  if (!primaryEntry) throw new Error("PRIMARY_ENTRY_NOT_FOUND");

  const created: Array<{ id: string; anime: AniListFranchiseEntry }> = [];

  for (const [index, anime] of remoteEntries.entries()) {
    let target = entryByAniListId.get(anime.id);
    if (!target) {
      const { data, error } = await supabase
        .from("anime_entries")
        .insert({
          franchise_id: franchiseId,
          slug: `${slugify(anime.title)}-anilist-${anime.id}`,
          title: anime.title,
          entry_type: entryTypeMap[anime.format ?? ""] ?? "season",
          sequence_number: index + 1,
          episode_count: anime.episodes ?? 0,
          episode_duration_minutes: anime.duration,
          aired_from: anime.startDate,
          official_status: officialStatusMap[anime.status ?? ""] ?? "Sin definir",
          cover_url: anime.coverUrl,
          banner_url: anime.bannerUrl,
          source_name: "anilist",
          source_external_id: String(anime.id),
          release_season: anime.season,
          studio: anime.studios[0] ?? null,
          origin_country: "JP",
        })
        .select("id,franchise_id,sequence_number,source_name,source_external_id")
        .single();
      if (error || !data) throw error ?? new Error("ENTRY_INSERT_FAILED");
      target = data as CatalogEntry;
      entryByAniListId.set(anime.id, target);
      created.push({ id: target.id, anime });

      const { error: externalError } = await supabase.from("anime_external_ids").upsert({
        entry_id: target.id,
        provider: "anilist",
        external_id: String(anime.id),
        source_url: anime.sourceUrl,
        is_primary: anime.id === primaryAniListId,
        last_synced_at: new Date().toISOString(),
      }, { onConflict: "provider,external_id" });
      if (externalError) throw externalError;

      if (anime.idMal) {
        const { error: malError } = await supabase.from("anime_external_ids").upsert({
          entry_id: target.id,
          provider: "myanimelist",
          external_id: String(anime.idMal),
          source_url: `https://myanimelist.net/anime/${anime.idMal}`,
          is_primary: false,
          last_synced_at: new Date().toISOString(),
        }, { onConflict: "provider,external_id" });
        if (malError) throw malError;
      }
    } else if (target.franchise_id === franchiseId) {
      const { error } = await supabase.from("anime_entries").update({
        title: anime.title,
        entry_type: entryTypeMap[anime.format ?? ""] ?? "season",
        sequence_number: index + 1,
        episode_count: anime.episodes ?? 0,
        episode_duration_minutes: anime.duration,
        aired_from: anime.startDate,
        official_status: officialStatusMap[anime.status ?? ""] ?? "Sin definir",
        cover_url: anime.coverUrl,
        banner_url: anime.bannerUrl,
        release_season: anime.season,
        studio: anime.studios[0] ?? null,
      }).eq("id", target.id);
      if (error) throw error;
      await supabase.from("anime_external_ids").update({
        last_synced_at: new Date().toISOString(),
      }).eq("provider", "anilist").eq("external_id", String(anime.id));
    }

    if (target.id !== primaryEntry.id) {
      const { error } = await supabase.from("anime_relations").upsert({
        source_entry_id: primaryEntry.id,
        target_entry_id: target.id,
        relation_type: relationTypeMap[anime.relationType] ?? "other",
        sort_order: index + 1,
        source_provider: "anilist",
        external_relation_id: String(anime.id),
        verified: false,
        created_by: franchise.submitted_by,
      }, { onConflict: "source_entry_id,target_entry_id,relation_type" });
      if (error) throw error;
    }
  }

  if (created.length && users.length) {
    const progressRows = created.flatMap((entry) => users.map((userId) => ({
      user_id: userId,
      entry_id: entry.id,
      episodes_watched: 0,
      completed: false,
    })));
    const { error: progressError } = await supabase
      .from("user_entry_progress")
      .upsert(progressRows, { onConflict: "user_id,entry_id", ignoreDuplicates: true });
    if (progressError) throw progressError;

    const now = new Date().toISOString();
    const notificationRows = created.flatMap(({ id, anime }) => users.map((userId) => ({
      user_id: userId,
      franchise_id: franchiseId,
      entry_id: id,
      notification_key: `franchise-update:${franchiseId}:${anime.id}`,
      notification_type: "season",
      title: `Nuevo contenido de ${franchise.canonical_title}`,
      description: `${anime.title} fue detectado automáticamente en AniList y añadido al tracking.`,
      label: "Nueva relación de franquicia",
      href: `/anime/${franchise.slug}/temporadas`,
      image_url: anime.coverUrl || franchise.cover_url,
      source: "anilist-franchise-sync",
      updated_at: now,
    })));
    const { error: notificationError } = await supabase
      .from("user_notifications")
      .upsert(notificationRows, { onConflict: "user_id,notification_key" });
    if (notificationError) throw notificationError;
  }

  const { error: franchiseError } = await supabase.from("anime_franchises")
    .update({ source_synced_at: new Date().toISOString() })
    .eq("id", franchiseId);
  if (franchiseError) throw franchiseError;

  return { created: created.length, remoteEntries: remoteEntries.length };
}

export async function synchronizeAniListFranchiseRelations() {
  const supabase = createAdminClient();
  const { data: rawLibrary, error: libraryError } = await supabase
    .from("user_library")
    .select("user_id,franchise_id,anime_franchises(slug,canonical_title,cover_url,submitted_by)")
    .is("removed_at", null);
  if (libraryError) throw libraryError;

  const library = (rawLibrary ?? []) as LibraryRow[];
  const franchiseIds = [...new Set(library.map((row) => row.franchise_id))];
  if (!franchiseIds.length) {
    return { checked: 0, changed: 0, created: 0, failed: 0, deferred: 0 };
  }

  const { data: rawEntries, error: entriesError } = await supabase
    .from("anime_entries")
    .select("id,franchise_id,sequence_number,source_name,source_external_id")
    .in("franchise_id", franchiseIds)
    .order("sequence_number");
  if (entriesError) throw entriesError;
  const entries = (rawEntries ?? []) as CatalogEntry[];
  const entryIds = entries.map((entry) => entry.id);

  const { data: rawExternal, error: externalError } = entryIds.length
    ? await supabase.from("anime_external_ids")
      .select("entry_id,external_id,is_primary")
      .eq("provider", "anilist")
      .in("entry_id", entryIds)
    : { data: [], error: null };
  if (externalError) throw externalError;

  const entryById = new Map(entries.map((entry) => [entry.id, entry]));
  const entryByAniListId = new Map<number, CatalogEntry>();
  const primaryByFranchise = new Map<string, number>();
  for (const external of rawExternal ?? []) {
    const entry = entryById.get(external.entry_id);
    const anilistId = Number(external.external_id);
    if (!entry || !Number.isInteger(anilistId)) continue;
    entryByAniListId.set(anilistId, entry);
    if (external.is_primary || !primaryByFranchise.has(entry.franchise_id)) {
      primaryByFranchise.set(entry.franchise_id, anilistId);
    }
  }
  for (const entry of entries) {
    if (entry.source_name !== "anilist") continue;
    const anilistId = Number(entry.source_external_id);
    if (!Number.isInteger(anilistId)) continue;
    entryByAniListId.set(anilistId, entry);
    if (!primaryByFranchise.has(entry.franchise_id)) {
      primaryByFranchise.set(entry.franchise_id, anilistId);
    }
  }

  const knownIds = [...entryByAniListId.keys()];
  if (!knownIds.length) {
    return { checked: 0, changed: 0, created: 0, failed: 0, deferred: 0 };
  }

  const snapshots = await getAniListRelationSnapshots(knownIds);
  const snapshotsByFranchise = new Map<string, AniListRelationSnapshot[]>();
  for (const snapshot of snapshots) {
    const sourceEntry = entryByAniListId.get(snapshot.source.id);
    if (!sourceEntry) continue;
    const current = snapshotsByFranchise.get(sourceEntry.franchise_id) ?? [];
    current.push(snapshot);
    snapshotsByFranchise.set(sourceEntry.franchise_id, current);
  }

  const { data: stateRows, error: stateError } = await supabase
    .from("anilist_franchise_sync_state")
    .select("franchise_id,relation_fingerprint,consecutive_failures")
    .in("franchise_id", [...snapshotsByFranchise.keys()]);
  if (stateError) throw stateError;
  const stateByFranchise = new Map(
    ((stateRows ?? []) as SyncState[]).map((state) => [state.franchise_id, state]),
  );

  const candidates: Array<{
    franchiseId: string;
    fingerprint: string;
    entryCount: number;
    hasUnknownRelation: boolean;
  }> = [];
  const baselines: Array<Record<string, unknown>> = [];

  for (const [franchiseId, franchiseSnapshots] of snapshotsByFranchise) {
    const currentFingerprint = fingerprint(franchiseSnapshots);
    const state = stateByFranchise.get(franchiseId);
    const hasUnknownRelation = franchiseSnapshots.some((snapshot) =>
      snapshot.relations.some((relation) => !entryByAniListId.has(relation.id)));
    const payload = {
      franchise_id: franchiseId,
      primary_anilist_id: primaryByFranchise.get(franchiseId),
      relation_fingerprint: currentFingerprint,
      entry_count: franchiseSnapshots.length,
      last_checked_at: new Date().toISOString(),
      next_check_at: nextCheck(24),
      last_error: null,
      consecutive_failures: 0,
    };

    if (!payload.primary_anilist_id) continue;
    if (!state && !hasUnknownRelation) {
      baselines.push(payload);
      continue;
    }
    if (hasUnknownRelation || state?.relation_fingerprint !== currentFingerprint) {
      candidates.push({
        franchiseId,
        fingerprint: currentFingerprint,
        entryCount: franchiseSnapshots.length,
        hasUnknownRelation,
      });
    } else {
      baselines.push(payload);
    }
  }

  if (baselines.length) {
    const { error } = await supabase.from("anilist_franchise_sync_state")
      .upsert(baselines, { onConflict: "franchise_id" });
    if (error) throw error;
  }

  let created = 0;
  let failed = 0;
  const selected = candidates
    .sort((left, right) => Number(right.hasUnknownRelation) - Number(left.hasUnknownRelation))
    .slice(0, MAX_CHANGED_FRANCHISES_PER_RUN);

  for (const candidate of selected) {
    const franchiseLibrary = library.filter((row) => row.franchise_id === candidate.franchiseId);
    const primaryAniListId = primaryByFranchise.get(candidate.franchiseId);
    if (!primaryAniListId || !franchiseLibrary.length) continue;
    try {
      const result = await synchronizeChangedFranchise({
        franchiseId: candidate.franchiseId,
        primaryAniListId,
        libraryRows: franchiseLibrary,
        entries,
        entryByAniListId,
      });
      created += result.created;
      const { error } = await supabase.from("anilist_franchise_sync_state").upsert({
        franchise_id: candidate.franchiseId,
        primary_anilist_id: primaryAniListId,
        relation_fingerprint: candidate.fingerprint,
        entry_count: result.remoteEntries,
        last_checked_at: new Date().toISOString(),
        last_changed_at: new Date().toISOString(),
        next_check_at: nextCheck(24),
        last_error: null,
        consecutive_failures: 0,
      }, { onConflict: "franchise_id" });
      if (error) throw error;
    } catch (error) {
      failed += 1;
      const previousFailures = stateByFranchise.get(candidate.franchiseId)?.consecutive_failures ?? 0;
      await supabase.from("anilist_franchise_sync_state").upsert({
        franchise_id: candidate.franchiseId,
        primary_anilist_id: primaryAniListId,
        relation_fingerprint: stateByFranchise.get(candidate.franchiseId)?.relation_fingerprint ?? "",
        entry_count: candidate.entryCount,
        last_checked_at: new Date().toISOString(),
        next_check_at: nextCheck(Math.min(168, 6 * 2 ** Math.min(previousFailures, 4))),
        last_error: error instanceof Error ? error.message.slice(0, 500) : "UNKNOWN_SYNC_ERROR",
        consecutive_failures: previousFailures + 1,
      }, { onConflict: "franchise_id" });
    }
  }

  return {
    checked: snapshotsByFranchise.size,
    changed: selected.length,
    created,
    failed,
    deferred: Math.max(0, candidates.length - selected.length),
  };
}
