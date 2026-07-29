"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type ChangeEvent,
  type DragEvent,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowLeft,
  Bookmark,
  Check,
  ChevronRight,
  Heart,
  ImagePlus,
  Info,
  LoaderCircle,
  Save,
  Send,
  Star,
  Upload,
  X,
} from "lucide-react";
import {
  type SavedCatalogMedia,
  type ManualAnimeActionState,
} from "@/app/(app)/agregar-anime/manual/actions";
import type {
  ManualAnimeInitialValues,
  ManualDraftDuplicate,
  ManualDraftSummary,
} from "@/lib/anime/manual-drafts";
import {
  CATALOG_IMAGE_MIME_TYPES,
  MAX_CATALOG_IMAGE_BYTES,
  type CatalogMediaKind,
} from "@/lib/anime/catalog-media";

const initialManualAnimeState: ManualAnimeActionState = { status: "idle" };

const genreOptions = [
  ["accion", "Acción"],
  ["aventura", "Aventura"],
  ["ciencia-ficcion", "Ciencia ficción"],
  ["comedia", "Comedia"],
  ["deportes", "Deportes"],
  ["drama", "Drama"],
  ["fantasia", "Fantasía"],
  ["mecha", "Mecha"],
  ["misterio", "Misterio"],
  ["romance", "Romance"],
  ["slice-of-life", "Slice of life"],
  ["sobrenatural", "Sobrenatural"],
  ["suspenso", "Suspenso"],
  ["terror", "Terror"],
] as const;

const suggestedTags = [
  "amistad",
  "artes marciales",
  "escolar",
  "isekai",
  "magia",
  "superpoderes",
  "venganza",
  "viajes en el tiempo",
  "vida cotidiana",
] as const;

function normalizeTag(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 48);
}

async function unavailableManualAnimeAction(
  _previousState: ManualAnimeActionState,
  _formData: FormData,
): Promise<ManualAnimeActionState> {
  void _previousState;
  void _formData;
  return { status: "error", message: "El registro real no está disponible." };
}

type ManualAnimePageProps = {
  duplicateIntent?: "register" | "review";
  duplicates?: ManualDraftDuplicate[];
  drafts?: ManualDraftSummary[];
  initialValues?: ManualAnimeInitialValues;
  notice?: string;
  submitAction?: (
    previousState: ManualAnimeActionState,
    formData: FormData,
  ) => Promise<ManualAnimeActionState>;
  withdrawAction?: (formData: FormData) => Promise<void>;
};

type LocalMediaSelection = {
  height?: number;
  previewUrl: string;
  width?: number;
};

function MediaUploadField({
  connected,
  description,
  kind,
  sampleUrl,
  saved,
  title,
}: {
  connected: boolean;
  description: string;
  kind: CatalogMediaKind;
  sampleUrl: string;
  saved?: SavedCatalogMedia;
  title: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<LocalMediaSelection | null>(null);
  const [removed, setRemoved] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (selection) URL.revokeObjectURL(selection.previewUrl);
    };
  }, [selection]);

  const selectFile = async (file?: File) => {
    if (!file) return;
    if (
      !CATALOG_IMAGE_MIME_TYPES.includes(
        file.type as (typeof CATALOG_IMAGE_MIME_TYPES)[number],
      )
    ) {
      setError("Usa una imagen PNG, JPG o WEBP.");
      return;
    }
    if (file.size < 1 || file.size > MAX_CATALOG_IMAGE_BYTES) {
      setError("La imagen debe pesar como máximo 5 MB.");
      return;
    }

    let width: number | undefined;
    let height: number | undefined;
    try {
      const bitmap = await createImageBitmap(file);
      width = bitmap.width;
      height = bitmap.height;
      bitmap.close();
    } catch {
      // The server validates the real signature; dimensions are optional metadata.
    }

    setSelection({
      height,
      previewUrl: URL.createObjectURL(file),
      width,
    });
    setRemoved(false);
    setError(null);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    void selectFile(event.target.files?.[0]);
  };

  const onDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (!file || !inputRef.current) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    inputRef.current.files = transfer.files;
    void selectFile(file);
  };

  const removePreview = () => {
    setSelection(null);
    setRemoved(true);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const previewUrl = selection?.previewUrl
    ?? (!removed ? saved?.url : undefined)
    ?? (!removed ? sampleUrl : undefined);
  const isSample = Boolean(previewUrl && !selection && !saved);
  const previewClass = kind === "cover"
    ? "manual-cover-preview"
    : "manual-banner-preview";

  return (
    <section>
      <h2>{title} <Info size={12} /></h2>
      <p>{description}</p>
      {previewUrl ? (
        <div className={previewClass}>
          <Image
            alt={`${title}${isSample ? " de muestra" : ""}`}
            fill
            sizes="285px"
            src={previewUrl}
            unoptimized={previewUrl.startsWith("blob:")}
          />
          {isSample && <small className="manual-sample-badge">Vista de muestra</small>}
          <button
            aria-label={`Quitar ${kind === "cover" ? "portada" : "banner"}`}
            onClick={removePreview}
            type="button"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="manual-empty-image">
          <ImagePlus size={24} />
          <span>{kind === "cover" ? "Sin portada" : "Sin banner"}</span>
        </div>
      )}

      <input
        accept={CATALOG_IMAGE_MIME_TYPES.join(",")}
        className="manual-file-input"
        disabled={!connected}
        name={`${kind}File`}
        onChange={onFileChange}
        ref={inputRef}
        type="file"
      />
      <input name={`existing${kind === "cover" ? "Cover" : "Banner"}Url`} type="hidden" value={!removed ? saved?.url ?? "" : ""} />
      <input name={`existing${kind === "cover" ? "Cover" : "Banner"}Path`} type="hidden" value={!removed ? saved?.path ?? "" : ""} />
      <input name={`${kind}Width`} type="hidden" value={selection?.width ?? ""} />
      <input name={`${kind}Height`} type="hidden" value={selection?.height ?? ""} />
      <input name={`remove${kind === "cover" ? "Cover" : "Banner"}`} type="hidden" value={String(Boolean(saved && removed))} />
      <button
        className={`manual-upload ${dragging ? "is-dragging" : ""}`}
        disabled={!connected}
        onClick={() => inputRef.current?.click()}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        title={connected ? undefined : "La carga real requiere una sesión conectada"}
        type="button"
      >
        <Upload size={15} />
        <span>
          {selection ? "Cambiar imagen seleccionada" : "Arrastra y suelta tu imagen aquí"}
          <small>PNG, JPG, WEBP · Máx. 5MB</small>
        </span>
      </button>
      {error && <p className="manual-media-error" role="alert">{error}</p>}
    </section>
  );
}

function SubmitButtons({
  connected,
  draftAvailable,
  isInLibrary,
  locked,
  onPreview,
}: {
  connected: boolean;
  draftAvailable: boolean;
  isInLibrary: boolean;
  locked: boolean;
  onPreview: (intent: "draft" | "register" | "review") => void;
}) {
  const { pending } = useFormStatus();
  return (
    <footer className="manual-form-actions">
      <button
        disabled={pending || locked}
        name="intent"
        onClick={() => onPreview("draft")}
        type={connected ? "submit" : "button"}
        value="draft"
      >
        {pending ? <LoaderCircle className="spin" size={15} /> : <Save size={15} />}
        Guardar borrador
      </button>
      <button
        disabled={pending || locked}
        name="intent"
        onClick={() => onPreview("register")}
        type={connected ? "submit" : "button"}
        value="register"
      >
        {pending ? "Guardando..." : isInLibrary ? "Actualizar biblioteca" : "Registrar anime"}
        {!pending && <ChevronRight size={15} />}
      </button>
      {draftAvailable && (
        <button
          disabled={pending || locked}
          name="intent"
          onClick={() => onPreview("review")}
          type={connected ? "submit" : "button"}
          value="review"
        >
          {pending ? <LoaderCircle className="spin" size={15} /> : <Send size={15} />}
          Enviar a revisión
        </button>
      )}
    </footer>
  );
}

export function ManualAnimePage({
  duplicateIntent,
  duplicates = [],
  drafts = [],
  initialValues,
  notice,
  submitAction = unavailableManualAnimeAction,
  withdrawAction,
}: ManualAnimePageProps) {
  const connected = submitAction !== unavailableManualAnimeAction;
  const [favorite, setFavorite] = useState(initialValues?.favorite ?? false);
  const [rating, setRating] = useState(
    initialValues?.rating ? Math.ceil(initialValues.rating / 2) : 0,
  );
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    initialValues?.genres ?? [],
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialValues?.tags ?? [],
  );
  const [tagInput, setTagInput] = useState("");
  const [episodeCount, setEpisodeCount] = useState(
    initialValues?.episodeCount === undefined ? "" : String(initialValues.episodeCount),
  );
  const [libraryStatus, setLibraryStatus] = useState(
    initialValues?.libraryStatus ?? "plan_to_watch",
  );
  const [episodesWatched, setEpisodesWatched] = useState(
    String(initialValues?.initialEpisode ?? 0),
  );
  const duplicateConfirmedRef = useRef<HTMLInputElement>(null);
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<ManualAnimeActionState | null>(null);
  const actionInitialState: ManualAnimeActionState = initialValues
    ? {
      ...initialManualAnimeState,
      status: notice
        ? initialValues.status === "in_review"
          ? "in_review"
          : "draft"
        : "idle",
      message: notice,
      draftFranchiseId: initialValues.franchiseId,
      draftEntryId: initialValues.entryId,
      cover: initialValues.cover,
      banner: initialValues.banner,
    }
    : initialManualAnimeState;
  const [state, formAction] = useActionState(
    submitAction,
    actionInitialState,
  );

  const activeState = previewState ?? state;
  const duplicateCandidates = activeState.duplicates ?? duplicates;
  const activeDuplicateIntent = activeState.duplicateIntent ?? duplicateIntent;
  const locked = initialValues?.status === "in_review"
    || initialValues?.status === "published"
    || activeState.status === "in_review";
  const messageKey = `${activeState.status}:${activeState.message ?? ""}`;
  const messageVisible = activeState.status !== "idle" && dismissedMessage !== messageKey;
  const addTag = (rawTag: string) => {
    const tag = normalizeTag(rawTag);
    if (!tag) return;
    setSelectedTags((current) => current.some((item) => item.toLocaleLowerCase("es") === tag.toLocaleLowerCase("es"))
      ? current
      : [...current, tag]);
    setTagInput("");
  };

  return (
    <div className="manual-anime-page">
      <header>
        <Link href="/agregar-anime"><ArrowLeft size={14} />Volver</Link>
        <span>/</span>
        <strong>Registro manual de anime</strong>
      </header>

      {connected && (
        <nav aria-label="Borradores del catálogo" className="manual-draft-bar">
          <div>
            <strong>{initialValues ? "Editando borrador" : "Nuevo registro"}</strong>
            <span>
              {initialValues
                ? `${initialValues.title} · ${initialValues.status.replace("_", " ")}`
                : "Puedes guardar y continuar más tarde."}
            </span>
          </div>
          <div>
            <Link className={!initialValues ? "is-active" : undefined} href="/agregar-anime/manual">
              Nuevo
            </Link>
            {drafts.map((draft) => (
              <Link
                className={initialValues?.franchiseId === draft.id ? "is-active" : undefined}
                href={`/agregar-anime/manual?draft=${draft.id}`}
                key={draft.id}
              >
                {draft.title}
                <small>{draft.status.replace("_", " ")}</small>
              </Link>
            ))}
          </div>
        </nav>
      )}

      {locked && (
        <div className="manual-workflow-banner" role="status">
          <Info size={15} />
          <span>
            <strong>Catálogo en revisión</strong>
            Los datos están bloqueados temporalmente para conservar la versión enviada.
          </span>
          {withdrawAction && initialValues?.submissionId && (
            <form action={withdrawAction}>
              <input name="submissionId" type="hidden" value={initialValues.submissionId} />
              <input name="franchiseId" type="hidden" value={initialValues.franchiseId} />
              <button type="submit">Retirar de revisión</button>
            </form>
          )}
        </div>
      )}
      {initialValues?.status === "rejected" && (
        <div className="manual-workflow-banner is-rejected" role="status">
          <Info size={15} />
          <span>
            <strong>Se solicitaron correcciones</strong>
            {initialValues.rejectionReason || initialValues.reviewNotes || "Revisa los datos y vuelve a enviarlos."}
          </span>
        </div>
      )}

      <form action={formAction}>
        <input name="draftFranchiseId" type="hidden" value={state.draftFranchiseId ?? ""} />
        <input name="favorite" type="hidden" value={String(favorite)} />
        <input name="rating" type="hidden" value={rating ? String(rating * 2) : ""} />
        {selectedGenres.map((genre) => <input key={genre} name="genres" type="hidden" value={genre} />)}
        {selectedTags.map((tag) => <input key={tag} name="tags" type="hidden" value={tag} />)}
        <input
          defaultValue="false"
          name="duplicateConfirmed"
          ref={duplicateConfirmedRef}
          type="hidden"
        />

        <fieldset className="manual-form-fields" disabled={locked}>
        <aside className="manual-media-column">
          <MediaUploadField
            connected={connected}
            description="Sube la imagen principal del anime."
            key={`cover:${state.cover?.url ?? "empty"}`}
            kind="cover"
            sampleUrl="/images/anime-eclipse-cover-v2.png"
            saved={state.cover ?? initialValues?.cover}
            title="Imagen de portada"
          />
          <MediaUploadField
            connected={connected}
            description="Sube una imagen horizontal (opcional)."
            key={`banner:${state.banner?.url ?? "empty"}`}
            kind="banner"
            sampleUrl="/images/anime-eclipse-hero-v1.png"
            saved={state.banner ?? initialValues?.banner}
            title="Imagen de banner"
          />
        </aside>

        <main>
          <section className="manual-info-panel">
            <h1><Bookmark size={18} />Información del anime</h1>
            <div className="manual-fields">
              <label>
                <span>Título principal <b>*</b></span>
                <input defaultValue={initialValues?.title} maxLength={180} name="title" placeholder="Ej. Shingeki no Kyojin" required />
              </label>
              <label>
                <span>Título alternativo</span>
                <input defaultValue={initialValues?.alternativeTitle} maxLength={180} name="alternativeTitle" placeholder="Ej. Attack on Titan" />
              </label>
              <label className="manual-synopsis">
                <span>Sinopsis <b>*</b></span>
                <textarea defaultValue={initialValues?.synopsis} maxLength={2000} name="synopsis" placeholder="Escribe una sinopsis del anime..." required />
                <em>Máx. 2000 caracteres</em>
              </label>
              <label>
                <span>Tipo <b>*</b></span>
                <select defaultValue={initialValues?.entryType ?? ""} name="entryType" required>
                  <option disabled value="">Selecciona el tipo</option>
                  <option value="season">TV / Temporada</option>
                  <option value="movie">Película</option>
                  <option value="ova">OVA</option>
                  <option value="special">Especial</option>
                </select>
              </label>
              <label>
                <span>Episodios <b>*</b></span>
                <input
                  min={0}
                  name="episodeCount"
                  onChange={(event) => {
                    setEpisodeCount(event.target.value);
                    if (libraryStatus === "completed") setEpisodesWatched(event.target.value || "0");
                  }}
                  placeholder="Ej. 24"
                  required
                  type="number"
                  value={episodeCount}
                />
              </label>
              <label>
                <span>Temporadas</span>
                {initialValues ? (
                  <Link
                    className="manual-season-link"
                    href={`/anime/${initialValues.slug}/temporadas`}
                  >
                    Gestionar temporadas
                    <ChevronRight size={14} />
                  </Link>
                ) : (
                  <input disabled placeholder="Guarda el borrador para gestionarlas" type="text" />
                )}
              </label>
              <label>
                <span>Duración por episodio</span>
                <input defaultValue={initialValues?.episodeDurationMinutes} min={1} name="episodeDurationMinutes" placeholder="Ej. 24" type="number" />
              </label>
              <label>
                <span>Año de estreno <b>*</b></span>
                <input defaultValue={initialValues?.releaseYear} max={new Date().getFullYear() + 5} min={1900} name="releaseYear" placeholder="Ej. 2023" required type="number" />
              </label>
              <label>
                <span>Temporada de estreno</span>
                <select defaultValue={initialValues?.releaseSeason ?? ""} name="releaseSeason">
                  <option value="">Selecciona la temporada</option>
                  <option value="Primavera">Primavera</option>
                  <option value="Verano">Verano</option>
                  <option value="Otoño">Otoño</option>
                  <option value="Invierno">Invierno</option>
                </select>
              </label>
              <label>
                <span>Estudio</span>
                <input defaultValue={initialValues?.studio} maxLength={120} name="studio" placeholder="Ej. MAPPA" />
              </label>
              <label>
                <span>País de origen</span>
                <select defaultValue={initialValues?.originCountry ?? ""} name="originCountry">
                  <option value="">Selecciona el país</option>
                  <option value="Japón">Japón</option>
                  <option value="China">China</option>
                  <option value="Corea del Sur">Corea del Sur</option>
                  <option value="Otro">Otro</option>
                </select>
              </label>
              <label className="manual-choice-field">
                <span>Géneros <b>*</b></span>
                <div className="manual-choice-list" role="group" aria-label="Seleccionar géneros">
                  {genreOptions.map(([slug, name]) => {
                    const selected = selectedGenres.includes(slug);
                    return (
                      <button
                        aria-pressed={selected}
                        className={selected ? "is-selected" : undefined}
                        key={slug}
                        onClick={() => setSelectedGenres((current) => selected
                          ? current.filter((item) => item !== slug)
                          : [...current, slug])}
                        type="button"
                      >
                        {selected && <Check size={11} />}{name}
                      </button>
                    );
                  })}
                </div>
                <small>Selecciona todos los géneros que correspondan.</small>
              </label>
              <label>
                <span>Estado oficial <b>*</b></span>
                <select defaultValue={initialValues?.officialStatus ?? ""} name="officialStatus" required>
                  <option disabled value="">Selecciona el estado</option>
                  <option value="En emisión">En emisión</option>
                  <option value="Finalizado">Finalizado</option>
                  <option value="Próximamente">Próximamente</option>
                  <option value="Pausado">Pausado</option>
                </select>
              </label>
              <label>
                <span>Fuente</span>
                <select defaultValue={initialValues?.sourceMaterial ?? ""} name="sourceMaterial">
                  <option value="">Selecciona la fuente</option>
                  <option value="Manga">Manga</option>
                  <option value="Novela ligera">Novela ligera</option>
                  <option value="Original">Original</option>
                  <option value="Videojuego">Videojuego</option>
                </select>
              </label>
              <label>
                <span>Clasificación por edad</span>
                <select defaultValue={initialValues?.ageRating ?? ""} name="ageRating">
                  <option value="">Selecciona la clasificación</option>
                  <option value="G">G</option>
                  <option value="PG">PG</option>
                  <option value="PG-13">PG-13</option>
                  <option value="R">R</option>
                  <option value="R+">R+</option>
                </select>
              </label>
              <label className="manual-tags manual-choice-field">
                <span>Etiquetas (tags)</span>
                <div className="manual-tag-editor">
                  {selectedTags.map((tag) => (
                    <button key={tag} onClick={() => setSelectedTags((current) => current.filter((item) => item !== tag))} type="button">
                      {tag}<X size={10} />
                    </button>
                  ))}
                  <input
                    onBlur={() => addTag(tagInput)}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === ",") {
                        event.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    placeholder="Escribe y presiona Enter"
                    value={tagInput}
                  />
                </div>
                <div className="manual-tag-suggestions">
                  {suggestedTags.filter((tag) => !selectedTags.includes(tag)).map((tag) => (
                    <button key={tag} onClick={() => addTag(tag)} type="button">+ {tag}</button>
                  ))}
                </div>
                <small>Los géneros clasifican la obra; las etiquetas describen temas o rasgos específicos.</small>
              </label>
            </div>
          </section>

          <section className="manual-personal-panel">
            <h2><Bookmark size={16} />Información para tu biblioteca personal</h2>
            <div>
              <label>
                <span>Estado inicial</span>
                <select
                  name="libraryStatus"
                  onChange={(event) => {
                    const nextStatus = event.target.value;
                    setLibraryStatus(nextStatus);
                    if (nextStatus === "completed") setEpisodesWatched(episodeCount || "0");
                    if (nextStatus === "plan_to_watch") setEpisodesWatched("0");
                  }}
                  value={libraryStatus}
                >
                  <option value="plan_to_watch">Quiero ver</option>
                  <option value="watching">Viendo actualmente</option>
                  <option value="caught_up">Al día</option>
                  <option value="paused">En pausa</option>
                  <option value="completed">Completado</option>
                  <option value="waiting_next_season">Esperando temporada</option>
                  <option value="dropped">Abandonado</option>
                </select>
              </label>
              <label>
                <span>Episodios vistos</span>
                <input
                  max={episodeCount || undefined}
                  min={0}
                  name="initialEpisode"
                  onChange={(event) => setEpisodesWatched(event.target.value)}
                  readOnly={libraryStatus === "completed" || libraryStatus === "plan_to_watch"}
                  type="number"
                  value={episodesWatched}
                />
                <small>
                  {libraryStatus === "completed"
                    ? "Al marcar Completado se registra automáticamente el total."
                    : libraryStatus === "plan_to_watch"
                      ? "Quiero ver comienza siempre en cero."
                      : "Indica cuántos episodios ya viste."}
                </small>
              </label>
              <label>
                <span>Marcar como favorito</span>
                <button
                  aria-pressed={favorite}
                  className={favorite ? "is-active" : undefined}
                  onClick={() => setFavorite((value) => !value)}
                  type="button"
                >
                  <Heart fill={favorite ? "currentColor" : "none"} size={19} /><i><span /></i>
                </button>
              </label>
              <label>
                <span>Puntuación (opcional)</span>
                <div className="manual-rating">
                  {Array.from({ length: 5 }, (_, index) => (
                    <button
                      aria-label={`Puntuar ${index + 1} estrellas`}
                      key={index}
                      onClick={() => setRating(index + 1)}
                      type="button"
                    >
                      <Star fill={rating > index ? "currentColor" : "none"} size={18} />
                    </button>
                  ))}
                </div>
              </label>
              <label>
                <span>Comentario rápido (opcional)</span>
                <textarea defaultValue={initialValues?.personalNote} maxLength={500} name="personalNote" placeholder="Escribe un comentario breve..." />
              </label>
            </div>
          </section>

          {activeDuplicateIntent && duplicateCandidates.length ? (
            <section className="manual-duplicate-warning" role="alert">
              <div>
                <Info size={16} />
                <span>
                  <strong>Posibles duplicados detectados</strong>
                  Compara estas coincidencias antes de crear otro registro global.
                </span>
              </div>
              <ul>
                {duplicateCandidates.map((candidate) => (
                  <li key={candidate.franchiseId}>
                    <span>
                      <strong>{candidate.title}</strong>
                      {candidate.releaseYear ?? "Año pendiente"} · {candidate.entryType} · {candidate.status}
                    </span>
                    <b>{Math.round(candidate.matchScore * 100)}%</b>
                  </li>
                ))}
              </ul>
              <button
                name="intent"
                onClick={() => {
                  if (duplicateConfirmedRef.current) {
                    duplicateConfirmedRef.current.value = "true";
                  }
                }}
                type="submit"
                value={activeDuplicateIntent}
              >
                Continuar de todos modos
                <ChevronRight size={14} />
              </button>
            </section>
          ) : null}

          <p className="manual-note"><Info size={13} />Podrás editar toda esta información más adelante desde la página del anime.</p>
          <SubmitButtons
            connected={connected}
            draftAvailable={Boolean(state.draftFranchiseId ?? initialValues?.franchiseId)}
            isInLibrary={initialValues?.isInLibrary ?? false}
            locked={locked}
            onPreview={(intent) => {
              if (duplicateConfirmedRef.current) {
                duplicateConfirmedRef.current.value = "false";
              }
              if (!connected) {
                setPreviewState({
                  status: intent === "draft" ? "draft" : "error",
                  message: intent === "draft" ? "Borrador guardado" : "Acción simulada en modo demo",
                });
              }
            }}
          />
        </main>
        </fieldset>
      </form>

      {messageVisible && activeState.status !== "idle" && (
        <div className={`manual-toast ${activeState.status === "error" ? "is-error" : ""}`} role={activeState.status === "error" ? "alert" : "status"}>
          {activeState.status === "error" ? <Info size={14} /> : <Check size={14} />}
          {activeState.message}
          <button aria-label="Cerrar mensaje" onClick={() => setDismissedMessage(messageKey)} type="button"><X size={13} /></button>
        </div>
      )}
    </div>
  );
}
