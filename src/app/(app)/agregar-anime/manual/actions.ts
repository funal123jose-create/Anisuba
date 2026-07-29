"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  buildCatalogMediaPath,
  CATALOG_MEDIA_BUCKET,
  type CatalogMediaKind,
  validateCatalogImage,
} from "@/lib/anime/catalog-media";
import { parseFormBoolean } from "@/lib/forms/form-values";
import { createClient } from "@/lib/supabase/server";

const optionalText = z.string().trim().max(500).optional().transform((value) => value || null);
const optionalPositiveInteger = z.preprocess(
  (value) => value === "" || value === null ? undefined : value,
  z.coerce.number().int().positive().max(1000).optional(),
);
const optionalDimension = z.preprocess(
  (value) => value === "" || value === null ? undefined : value,
  z.coerce.number().int().positive().max(20000).optional(),
);
const formBoolean = z.preprocess(
  parseFormBoolean,
  z.boolean(),
);

const manualAnimeSchema = z.object({
  intent: z.enum(["draft", "register", "review"]),
  duplicateConfirmed: formBoolean,
  draftFranchiseId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(1, "Escribe el título principal.").max(180),
  alternativeTitle: optionalText,
  synopsis: z.string().trim().min(1, "Escribe una sinopsis.").max(2000),
  entryType: z.enum(["season", "movie", "ova", "special"]),
  episodeCount: z.coerce.number().int().min(0).max(10000),
  episodeDurationMinutes: optionalPositiveInteger,
  releaseYear: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 5),
  releaseSeason: optionalText,
  studio: optionalText,
  originCountry: optionalText,
  genres: z.array(z.string().trim().min(1)).min(1, "Selecciona al menos un género."),
  officialStatus: z.string().trim().min(1, "Selecciona el estado oficial.").max(80),
  sourceMaterial: optionalText,
  ageRating: optionalText,
  tags: z.array(z.string().trim().min(1)).max(20),
  libraryStatus: z.enum([
    "plan_to_watch",
    "watching",
    "caught_up",
    "paused",
    "completed",
    "waiting_next_season",
    "dropped",
  ]),
  initialEpisode: z.coerce.number().int().min(0).max(10000),
  favorite: formBoolean,
  rating: z.preprocess(
    (value) => value === "" || value === null ? undefined : value,
    z.coerce.number().min(1).max(10).optional(),
  ),
  personalNote: z.string().trim().max(500).optional().transform((value) => value || null),
  existingCoverUrl: optionalText,
  existingCoverPath: optionalText,
  existingBannerUrl: optionalText,
  existingBannerPath: optionalText,
  coverWidth: optionalDimension,
  coverHeight: optionalDimension,
  bannerWidth: optionalDimension,
  bannerHeight: optionalDimension,
  removeCover: formBoolean,
  removeBanner: formBoolean,
}).superRefine((value, context) => {
  if (value.initialEpisode > value.episodeCount) {
    context.addIssue({
      code: "custom",
      message: "El episodio inicial no puede superar el total de episodios.",
      path: ["initialEpisode"],
    });
  }
});

export type SavedCatalogMedia = {
  url: string;
  path: string;
};

export type CatalogDuplicateCandidate = {
  franchiseId: string;
  title: string;
  releaseYear: number | null;
  entryType: string;
  status: string;
  matchScore: number;
};

type CatalogDuplicateRow = {
  franchise_id: string;
  canonical_title: string;
  release_year: number | null;
  entry_type: string;
  record_status: string;
  match_score: number | string;
};

export type ManualAnimeActionState = {
  status: "idle" | "error" | "draft" | "duplicate_warning" | "in_review";
  message?: string;
  draftFranchiseId?: string;
  draftEntryId?: string;
  cover?: SavedCatalogMedia;
  banner?: SavedCatalogMedia;
  duplicates?: CatalogDuplicateCandidate[];
  duplicateIntent?: "register" | "review";
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function optionalFile(formData: FormData, name: string) {
  const value = formData.get(name);
  return value instanceof File && value.size > 0 ? value : null;
}

function formDataToPayload(formData: FormData) {
  const splitValues = (name: string) =>
    formData.getAll(name)
      .flatMap((value) => String(value).split(","))
      .map((value) => value.trim())
      .filter(Boolean);

  return {
    intent: formData.get("intent"),
    duplicateConfirmed: formData.get("duplicateConfirmed") ?? "false",
    draftFranchiseId: formData.get("draftFranchiseId") ?? "",
    title: formData.get("title"),
    alternativeTitle: formData.get("alternativeTitle"),
    synopsis: formData.get("synopsis"),
    entryType: formData.get("entryType"),
    episodeCount: formData.get("episodeCount"),
    episodeDurationMinutes: formData.get("episodeDurationMinutes"),
    releaseYear: formData.get("releaseYear"),
    releaseSeason: formData.get("releaseSeason"),
    studio: formData.get("studio"),
    originCountry: formData.get("originCountry"),
    genres: splitValues("genres"),
    officialStatus: formData.get("officialStatus"),
    sourceMaterial: formData.get("sourceMaterial"),
    ageRating: formData.get("ageRating"),
    tags: splitValues("tags"),
    libraryStatus: formData.get("libraryStatus"),
    initialEpisode: formData.get("initialEpisode") ?? "0",
    favorite: formData.get("favorite") ?? "false",
    rating: formData.get("rating"),
    personalNote: formData.get("personalNote"),
    existingCoverUrl: formData.get("existingCoverUrl"),
    existingCoverPath: formData.get("existingCoverPath"),
    existingBannerUrl: formData.get("existingBannerUrl"),
    existingBannerPath: formData.get("existingBannerPath"),
    coverWidth: formData.get("coverWidth"),
    coverHeight: formData.get("coverHeight"),
    bannerWidth: formData.get("bannerWidth"),
    bannerHeight: formData.get("bannerHeight"),
    removeCover: formData.get("removeCover") ?? "false",
    removeBanner: formData.get("removeBanner") ?? "false",
  };
}

function rpcPayload(
  value: z.infer<typeof manualAnimeSchema>,
  intent: "draft" | "register",
  franchiseId: string | null,
  coverUrl: string | null,
  bannerUrl: string | null,
) {
  return {
    p_title: value.title,
    p_synopsis: value.synopsis,
    p_entry_type: value.entryType,
    p_episode_count: value.episodeCount,
    p_release_year: value.releaseYear,
    p_official_status: value.officialStatus,
    p_genre_slugs: value.genres,
    p_library_status: value.libraryStatus,
    p_intent: intent,
    p_alternative_title: value.alternativeTitle,
    p_episode_duration_minutes: value.episodeDurationMinutes ?? null,
    p_release_season: value.releaseSeason,
    p_studio: value.studio,
    p_origin_country: value.originCountry,
    p_source_material: value.sourceMaterial,
    p_age_rating: value.ageRating,
    p_tags: value.tags,
    p_initial_episode: value.initialEpisode,
    p_favorite: value.favorite,
    p_rating: value.rating ?? null,
    p_personal_note: value.personalNote,
    p_cover_url: coverUrl,
    p_banner_url: bannerUrl,
    p_existing_franchise_id: franchiseId,
  };
}

async function saveDraftPreferences({
  entryId,
  franchiseId,
  supabase,
  userId,
  value,
}: {
  entryId: string;
  franchiseId: string;
  supabase: SupabaseClient;
  userId: string;
  value: z.infer<typeof manualAnimeSchema>;
}) {
  const { error } = await supabase
    .from("catalog_draft_preferences")
    .upsert(
      {
        user_id: userId,
        franchise_id: franchiseId,
        entry_id: entryId,
        library_status: value.libraryStatus,
        initial_episode: value.initialEpisode,
        favorite: value.favorite,
        rating: value.rating ?? null,
        personal_note: value.personalNote,
      },
      { onConflict: "user_id,franchise_id" },
    );

  if (error) throw new Error("DRAFT_PREFERENCES_FAILED");
}

async function findDuplicateCandidates({
  franchiseId,
  supabase,
  value,
}: {
  franchiseId: string;
  supabase: SupabaseClient;
  value: z.infer<typeof manualAnimeSchema>;
}): Promise<CatalogDuplicateCandidate[]> {
  const { data, error } = await supabase.rpc("find_catalog_duplicates", {
    p_title: value.title,
    p_release_year: value.releaseYear,
    p_entry_type: value.entryType,
    p_exclude_franchise_id: franchiseId,
    p_limit: 8,
  });

  if (error) throw new Error("DUPLICATE_CHECK_FAILED");

  return ((data ?? []) as CatalogDuplicateRow[])
    .map((candidate: CatalogDuplicateRow) => ({
      franchiseId: candidate.franchise_id,
      title: candidate.canonical_title,
      releaseYear: candidate.release_year,
      entryType: candidate.entry_type,
      status: candidate.record_status,
      matchScore: Number(candidate.match_score),
    }))
    .filter((candidate: CatalogDuplicateCandidate) => candidate.matchScore >= 0.7);
}

async function removeStorageObject(
  supabase: SupabaseClient,
  bucket: string | null | undefined,
  path: string | null | undefined,
) {
  if (!bucket || !path) return;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) console.error("Catalog media cleanup failed", error.message);
}

async function detachCatalogMedia({
  entryId,
  franchiseId,
  kind,
  supabase,
}: {
  entryId: string;
  franchiseId: string;
  kind: CatalogMediaKind;
  supabase: SupabaseClient;
}) {
  const { data, error } = await supabase.rpc("detach_catalog_upload", {
    p_franchise_id: franchiseId,
    p_entry_id: entryId,
    p_asset_kind: kind,
  });
  if (error) throw new Error(`DETACH_${kind.toUpperCase()}_FAILED`);
  const removed = Array.isArray(data) ? data[0] : data;
  await removeStorageObject(
    supabase,
    removed?.removed_storage_bucket,
    removed?.removed_storage_path,
  );
}

async function uploadCatalogMedia({
  entryId,
  file,
  franchiseId,
  height,
  kind,
  supabase,
  userId,
  width,
}: {
  entryId: string;
  file: File;
  franchiseId: string;
  height?: number;
  kind: CatalogMediaKind;
  supabase: SupabaseClient;
  userId: string;
  width?: number;
}): Promise<SavedCatalogMedia> {
  const validated = await validateCatalogImage(file);
  const path = buildCatalogMediaPath({
    extension: validated.extension,
    franchiseId,
    kind,
    userId,
  });

  const { error: uploadError } = await supabase.storage
    .from(CATALOG_MEDIA_BUCKET)
    .upload(path, validated.bytes, {
      cacheControl: "3600",
      contentType: validated.mimeType,
      upsert: false,
    });

  if (uploadError) throw new Error(`UPLOAD_${kind.toUpperCase()}_FAILED`);

  const { data: publicUrlData } = supabase.storage
    .from(CATALOG_MEDIA_BUCKET)
    .getPublicUrl(path);

  const { data, error: attachError } = await supabase.rpc("attach_catalog_upload", {
    p_franchise_id: franchiseId,
    p_entry_id: entryId,
    p_asset_kind: kind,
    p_storage_bucket: CATALOG_MEDIA_BUCKET,
    p_storage_path: path,
    p_asset_url: publicUrlData.publicUrl,
    p_mime_type: validated.mimeType,
    p_byte_size: file.size,
    p_width: width ?? null,
    p_height: height ?? null,
  });

  if (attachError) {
    await removeStorageObject(supabase, CATALOG_MEDIA_BUCKET, path);
    throw new Error(`ATTACH_${kind.toUpperCase()}_FAILED`);
  }

  const attached = Array.isArray(data) ? data[0] : data;
  if (attached?.previous_storage_path !== path) {
    await removeStorageObject(
      supabase,
      attached?.previous_storage_bucket,
      attached?.previous_storage_path,
    );
  }

  return { path, url: publicUrlData.publicUrl };
}

function mediaErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "No pudimos procesar las imágenes.";
  if (error.message === "IMAGE_SIZE_INVALID") {
    return "Cada imagen debe pesar entre 1 byte y 5 MB.";
  }
  if (error.message === "IMAGE_TYPE_INVALID" || error.message === "IMAGE_CONTENT_INVALID") {
    return "Usa una imagen PNG, JPG o WEBP válida.";
  }
  if (error.message.includes("DETACH")) {
    return "El borrador se guardó, pero no pudimos quitar una de las imágenes.";
  }
  return "El borrador se guardó, pero una imagen no pudo subirse. Puedes intentarlo nuevamente.";
}

export async function submitManualAnimeAction(
  previousState: ManualAnimeActionState,
  formData: FormData,
): Promise<ManualAnimeActionState> {
  const parsed = manualAnimeSchema.safeParse(formDataToPayload(formData));
  if (!parsed.success) {
    return {
      ...previousState,
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.",
    };
  }

  const coverFile = optionalFile(formData, "coverFile");
  const bannerFile = optionalFile(formData, "bannerFile");
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { ...previousState, status: "error", message: "Tu sesión expiró. Inicia sesión nuevamente." };
  }

  const value = {
    ...parsed.data,
    initialEpisode: parsed.data.libraryStatus === "completed"
      ? parsed.data.episodeCount
      : parsed.data.libraryStatus === "plan_to_watch"
        ? 0
        : parsed.data.initialEpisode,
  };
  let cover = value.removeCover
    ? undefined
    : value.existingCoverUrl && value.existingCoverPath
      ? { url: value.existingCoverUrl, path: value.existingCoverPath }
      : previousState.cover;
  let banner = value.removeBanner
    ? undefined
    : value.existingBannerUrl && value.existingBannerPath
      ? { url: value.existingBannerUrl, path: value.existingBannerPath }
      : previousState.banner;

  // A draft is always created first. Registration in the personal library
  // occurs only after every requested media operation succeeds.
  const { data: draftData, error: draftError } = await supabase.rpc(
    "submit_manual_anime",
    rpcPayload(
      value,
      "draft",
      value.draftFranchiseId || previousState.draftFranchiseId || null,
      cover?.url ?? null,
      banner?.url ?? null,
    ),
  );

  if (draftError) {
    console.error("Manual anime draft failed", draftError.code);
    return {
      ...previousState,
      status: "error",
      message: "No pudimos guardar el anime. Verifica los datos e inténtalo nuevamente.",
    };
  }

  const draft = Array.isArray(draftData) ? draftData[0] : draftData;
  const franchiseId = draft?.franchise_id as string | undefined;
  const entryId = draft?.entry_id as string | undefined;
  if (!franchiseId || !entryId) {
    return {
      ...previousState,
      status: "error",
      message: "El borrador se creó, pero no recibimos sus identificadores.",
    };
  }

  try {
    if (value.removeCover && !coverFile) {
      await detachCatalogMedia({ entryId, franchiseId, kind: "cover", supabase });
      cover = undefined;
    }
    if (value.removeBanner && !bannerFile) {
      await detachCatalogMedia({ entryId, franchiseId, kind: "banner", supabase });
      banner = undefined;
    }
    if (coverFile) {
      cover = await uploadCatalogMedia({
        entryId,
        file: coverFile,
        franchiseId,
        height: value.coverHeight,
        kind: "cover",
        supabase,
        userId: authData.user.id,
        width: value.coverWidth,
      });
    }
    if (bannerFile) {
      banner = await uploadCatalogMedia({
        entryId,
        file: bannerFile,
        franchiseId,
        height: value.bannerHeight,
        kind: "banner",
        supabase,
        userId: authData.user.id,
        width: value.bannerWidth,
      });
    }
  } catch (error) {
    console.error("Catalog media operation failed", error instanceof Error ? error.message : "UNKNOWN");
    return {
      status: "error",
      message: mediaErrorMessage(error),
      draftFranchiseId: franchiseId,
      draftEntryId: entryId,
      cover,
      banner,
    };
  }

  try {
    await saveDraftPreferences({
      entryId,
      franchiseId,
      supabase,
      userId: authData.user.id,
      value,
    });
  } catch (error) {
    console.error(
      "Manual draft preferences failed",
      error instanceof Error ? error.message : "UNKNOWN",
    );
    return {
      status: "error",
      message: "El catálogo se guardó, pero no pudimos conservar tus preferencias personales.",
      draftFranchiseId: franchiseId,
      draftEntryId: entryId,
      cover,
      banner,
    };
  }

  if (value.intent !== "draft" && !value.duplicateConfirmed) {
    let duplicates: CatalogDuplicateCandidate[];
    try {
      duplicates = await findDuplicateCandidates({
        franchiseId,
        supabase,
        value,
      });
    } catch (error) {
      console.error(
        "Manual duplicate check failed",
        error instanceof Error ? error.message : "UNKNOWN",
      );
      return {
        status: "error",
        message: "El borrador se guardó, pero no pudimos validar posibles duplicados.",
        draftFranchiseId: franchiseId,
        draftEntryId: entryId,
        cover,
        banner,
      };
    }
    if (duplicates.length > 0) {
      revalidatePath("/agregar-anime/manual");
      redirect(
        `/agregar-anime/manual?draft=${franchiseId}&duplicado=${value.intent}`,
      );
    }
  }

  if (value.intent === "register") {
    const { error: registerError } = await supabase.rpc(
      "submit_manual_anime",
      rpcPayload(value, "register", franchiseId, cover?.url ?? null, banner?.url ?? null),
    );
    if (registerError) {
      console.error("Manual anime registration failed", registerError.code);
      return {
        status: "error",
        message: "El borrador y sus imágenes se guardaron, pero no pudimos añadirlo a tu biblioteca.",
        draftFranchiseId: franchiseId,
        draftEntryId: entryId,
        cover,
        banner,
      };
    }
  }

  if (value.intent === "review") {
    const { error: reviewError } = await supabase.rpc(
      "submit_catalog_for_review",
      {
        p_franchise_id: franchiseId,
        p_notes: "Enviado desde el formulario de registro manual.",
      },
    );

    if (reviewError) {
      console.error("Manual catalog review submission failed", reviewError.code);
      return {
        status: "error",
        message: "El borrador quedó guardado, pero no pudimos enviarlo a revisión.",
        draftFranchiseId: franchiseId,
        draftEntryId: entryId,
        cover,
        banner,
      };
    }

    revalidatePath("/agregar-anime/manual");
    redirect(`/agregar-anime/manual?draft=${franchiseId}&revision=ok`);
  }

  if (value.intent === "register") {
    revalidatePath("/biblioteca");
    revalidatePath("/seguimiento");
    redirect("/biblioteca?registrado=1");
  }

  revalidatePath("/agregar-anime/manual");
  redirect(`/agregar-anime/manual?draft=${franchiseId}&guardado=ok`);
}

export async function withdrawCatalogSubmissionAction(formData: FormData) {
  const submissionId = z.string().uuid().safeParse(formData.get("submissionId"));
  const franchiseId = z.string().uuid().safeParse(formData.get("franchiseId"));
  if (!submissionId.success || !franchiseId.success) {
    redirect("/agregar-anime/manual");
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login");

  const { error } = await supabase.rpc("withdraw_catalog_submission", {
    p_submission_id: submissionId.data,
  });
  if (error) {
    console.error("Catalog submission withdrawal failed", error.code);
    redirect(`/agregar-anime/manual?draft=${franchiseId.data}&retiro=error`);
  }

  revalidatePath("/agregar-anime/manual");
  redirect(`/agregar-anime/manual?draft=${franchiseId.data}&retiro=ok`);
}
