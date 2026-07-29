"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Download,
  FileArchive,
  LibraryBig,
  LoaderCircle,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

export type MalPreview = {
  filename: string;
  summary: {
    total: number;
    duplicates: number;
    ready: number;
    matched: number;
    unresolved: number;
    counts: {
      completed: number;
      dropped: number;
      paused: number;
      plan_to_watch: number;
      watching: number;
    };
  };
  items: Array<{
    malId: number;
    title: string;
    mediaType: string;
    status: string;
    watchedEpisodes: number;
    totalEpisodes: number;
    score: number;
    alreadyCatalogued: boolean;
    resolution: "existing" | "matched" | "unresolved";
    match: {
      anilistId: number;
      title: string;
      format: string | null;
      episodes: number | null;
      coverUrl: string;
      seasonYear: number | null;
    } | null;
  }>;
};

type ImportResult = {
  imported: number;
  updated: number;
  skipped: number;
  total: number;
  unresolved: number;
};

type MyAnimeListImportDialogProps = {
  open: boolean;
  onClose: () => void;
  region: string;
};

const statusLabel: Record<string, string> = {
  completed: "Completado",
  dropped: "Abandonado",
  paused: "En pausa",
  plan_to_watch: "Planeo ver",
  watching: "Viendo",
};

export function MyAnimeListImportDialog({
  onClose,
  open,
  region,
}: MyAnimeListImportDialogProps) {
  const [step, setStep] = useState<"upload" | "review" | "complete">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<MalPreview | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState("");
  const [resolutionFilter, setResolutionFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const visibleItems = useMemo(() => {
    if (!preview) return [];
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return preview.items.filter((item) => (
      (resolutionFilter === "all" || item.resolution === resolutionFilter)
      && (!normalizedQuery
        || item.title.toLocaleLowerCase("es").includes(normalizedQuery)
        || item.match?.title.toLocaleLowerCase("es").includes(normalizedQuery))
    ));
  }, [preview, query, resolutionFilter]);

  if (!open) return null;

  function close() {
    setStep("upload");
    setFile(null);
    setPreview(null);
    setSelectedIds(new Set());
    setQuery("");
    setResolutionFilter("all");
    setError("");
    setResult(null);
    onClose();
  }

  async function previewExport(nextFile: File | null) {
    if (!nextFile) return;
    setFile(nextFile);
    setLoading(true);
    setError("");
    setPreview(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.set("file", nextFile);
      const response = await fetch("/api/myanimelist/preview", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json() as MalPreview & { message?: string };
      if (!response.ok) throw new Error(payload.message || "No se pudo preparar la vista previa.");
      setPreview(payload);
      setSelectedIds(new Set(
        payload.items
          .filter((item) => item.resolution !== "unresolved")
          .map((item) => item.malId),
      ));
    } catch (previewError) {
      setError(previewError instanceof Error
        ? previewError.message
        : "No se pudo preparar la vista previa.");
    } finally {
      setLoading(false);
    }
  }

  function toggleItem(malId: number) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(malId)) next.delete(malId);
      else next.add(malId);
      return next;
    });
  }

  function toggleVisible() {
    const selectable = visibleItems.filter((item) => item.resolution !== "unresolved");
    const allSelected = selectable.every((item) => selectedIds.has(item.malId));
    setSelectedIds((current) => {
      const next = new Set(current);
      selectable.forEach((item) => {
        if (allSelected) next.delete(item.malId);
        else next.add(item.malId);
      });
      return next;
    });
  }

  async function importSelection() {
    if (!file || selectedIds.size === 0) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("selectedIds", JSON.stringify([...selectedIds]));
      const response = await fetch("/api/myanimelist/import", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json() as ImportResult & { message?: string };
      if (!response.ok) throw new Error(payload.message || "No se pudo completar la importación.");
      setResult(payload);
      setStep("complete");
    } catch (importError) {
      setError(importError instanceof Error
        ? importError.message
        : "No se pudo completar la importación.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="settings-modal-backdrop" onMouseDown={close}>
      <section
        aria-labelledby="mal-import-title"
        aria-modal="true"
        className={`settings-import-modal settings-mal-dialog is-${step}`}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header>
          <span><Download size={18} /></span>
          <div>
            <p>INTEGRACIÓN PERSONAL</p>
            <h2 id="mal-import-title">
              {step === "review" ? "Revisar importación" : step === "complete"
                ? "Importación completada" : "Importar desde MyAnimeList"}
            </h2>
          </div>
          <button aria-label="Cerrar importación" onClick={close} type="button"><X size={17} /></button>
        </header>

        {step === "upload" && (
          <>
            <p>Selecciona la exportación original. Primero compararemos cada MAL ID con AniList y con tu catálogo; todavía no se modificará tu biblioteca.</p>
            <label className="settings-mal-file">
              <FileArchive size={18} />
              <span>
                <strong>Archivo XML o XML.GZ</strong>
                <small>Máximo 2.5 MB comprimido. No necesitamos tu contraseña.</small>
              </span>
              <input
                accept=".xml,.xml.gz,application/gzip,text/xml,application/xml"
                aria-label="Archivo XML o XML.GZ"
                onChange={(event) => void previewExport(event.target.files?.[0] ?? null)}
                type="file"
              />
            </label>
            {loading && <p className="settings-import-loading" role="status"><LoaderCircle className="is-spinning" size={15} />Buscando coincidencias exactas por MAL ID en AniList…</p>}
            {error && <p className="settings-import-error" role="alert">{error}</p>}
            {preview && (
              <>
                <div className="settings-import-summary">
                  <article><strong>{preview.summary.total}</strong><span>Títulos detectados</span></article>
                  <article><strong>{preview.summary.duplicates}</strong><span>Ya vinculados</span></article>
                  <article><strong>{preview.summary.ready}</strong><span>Nuevos listos</span></article>
                  <article><strong>{preview.summary.unresolved}</strong><span>Requieren revisión</span></article>
                </div>
                <div className="settings-mal-statuses">
                  <span>Completados <strong>{preview.summary.counts.completed}</strong></span>
                  <span>Viendo <strong>{preview.summary.counts.watching}</strong></span>
                  <span>En pausa <strong>{preview.summary.counts.paused}</strong></span>
                  <span>Planeados <strong>{preview.summary.counts.plan_to_watch}</strong></span>
                  <span>Abandonados <strong>{preview.summary.counts.dropped}</strong></span>
                </div>
              </>
            )}
            <ul>
              <li><Check size={13} />Importación unidireccional: MyAnimeList → AniSuba.</li>
              <li><ShieldCheck size={13} />La vista previa no escribe datos ni requiere credenciales.</li>
              <li><MapPin size={13} />Región activa: {region === "CO" ? "Colombia" : region}.</li>
            </ul>
            <aside><Sparkles size={14} /><span><strong>Revisión obligatoria</strong> Podrás incluir o excluir cada título antes de confirmar.</span></aside>
            <footer>
              <button onClick={close} type="button">Cancelar</button>
              <button disabled={!preview} onClick={() => setStep("review")} type="button"><Download size={13} />Continuar a revisión</button>
            </footer>
          </>
        )}

        {step === "review" && preview && (
          <>
            <div className="settings-mal-review-toolbar">
              <label><Search size={14} /><input aria-label="Buscar en la importación" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar título…" value={query} /></label>
              <select aria-label="Filtrar coincidencias" onChange={(event) => setResolutionFilter(event.target.value)} value={resolutionFilter}>
                <option value="all">Todas las coincidencias</option>
                <option value="matched">Nuevos desde AniList</option>
                <option value="existing">Ya existentes</option>
                <option value="unresolved">Requieren revisión</option>
              </select>
              <button onClick={toggleVisible} type="button">Seleccionar visibles</button>
            </div>
            <div className="settings-mal-review-heading">
              <span><strong>{selectedIds.size}</strong> seleccionados de {preview.summary.total}</span>
              <span>Los no resueltos se omitirán sin crear coincidencias dudosas.</span>
            </div>
            <div className="settings-mal-review-list">
              {visibleItems.map((item) => (
                <article className={`is-${item.resolution}`} key={item.malId}>
                  <label>
                    <input
                      aria-label={`Importar ${item.title}`}
                      checked={selectedIds.has(item.malId)}
                      disabled={item.resolution === "unresolved"}
                      onChange={() => toggleItem(item.malId)}
                      type="checkbox"
                    />
                  </label>
                  {item.match
                    ? <Image alt="" height={58} src={item.match.coverUrl} width={42} />
                    : <span className="settings-mal-fallback"><FileArchive size={15} /></span>}
                  <div>
                    <strong>{item.title}</strong>
                    {item.match && item.match.title !== item.title && <small>Coincidencia AniList: {item.match.title}</small>}
                    <small>MAL #{item.malId} · {item.watchedEpisodes}/{item.totalEpisodes || "?"} episodios · {statusLabel[item.status] ?? item.status} · Nota {item.score || "—"}</small>
                  </div>
                  <span>
                    {item.resolution === "existing" ? "Actualizar existente"
                      : item.resolution === "matched" ? "Coincidencia exacta"
                        : "Sin coincidencia"}
                  </span>
                </article>
              ))}
            </div>
            {error && <p className="settings-import-error" role="alert">{error}</p>}
            <footer>
              <button onClick={() => setStep("upload")} type="button"><ArrowLeft size={13} />Volver</button>
              <button disabled={loading || selectedIds.size === 0} onClick={() => void importSelection()} type="button">
                {loading ? <LoaderCircle className="is-spinning" size={13} /> : <LibraryBig size={13} />}
                {loading ? "Importando de forma segura…" : `Importar ${selectedIds.size} títulos`}
              </button>
            </footer>
          </>
        )}

        {step === "complete" && result && (
          <div className="settings-mal-complete">
            <CheckCircle2 size={48} />
            <h3>Tu biblioteca ya está actualizada</h3>
            <p>La operación se confirmó como una sola transacción. Se conservaron estados, progreso, fechas y puntuaciones.</p>
            <div>
              <article><strong>{result.imported}</strong><span>Nuevos</span></article>
              <article><strong>{result.updated}</strong><span>Actualizados</span></article>
              <article><strong>{result.skipped}</strong><span>Omitidos</span></article>
            </div>
            <footer>
              <button onClick={close} type="button">Cerrar</button>
              <Link href="/biblioteca"><LibraryBig size={13} />Ver mi biblioteca</Link>
            </footer>
          </div>
        )}
      </section>
    </div>
  );
}
