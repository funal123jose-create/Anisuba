"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bookmark,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Grid2X2,
  Heart,
  List,
  MoreHorizontal,
  Pause,
  Play,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LibraryData, LibraryItem, PersonalAnimeStatus } from "@/types/library";

type LibraryPageProps = {
  data: LibraryData;
  isDemo: boolean;
};

type ViewMode = "grid" | "list";
type SortMode = "recent" | "title" | "score";
type StatusFilter = "all" | PersonalAnimeStatus;

const statusCopy: Record<PersonalAnimeStatus, string> = {
  plan_to_watch: "Planeo ver",
  watching: "Viendo",
  caught_up: "Al día",
  paused: "En pausa",
  completed: "Completado",
  waiting_next_season: "Esperando temporada",
  dropped: "Abandonado",
};

const summaryIcons = {
  watching: Play,
  plan_to_watch: Bookmark,
  caught_up: Check,
  completed: Check,
  paused: Pause,
  dropped: X,
  waiting_next_season: Clock3,
} satisfies Record<PersonalAnimeStatus, typeof Play>;

function progress(item: LibraryItem) {
  if (!item.episodeCount) return 0;
  return Math.min(100, Math.round((item.episodesWatched / item.episodeCount) * 100));
}

function LibraryCard({
  item,
  view,
  favorite,
  onFavorite,
}: {
  item: LibraryItem;
  view: ViewMode;
  favorite: boolean;
  onFavorite: () => void;
}) {
  return (
    <article className={cn("library-card micro-lift", view === "list" && "is-list")}>
      <div className="library-cover-wrap">
        <Image
          alt={`Portada de ${item.title}`}
          className="library-cover"
          fill
          sizes={view === "list" ? "92px" : "(max-width: 680px) 44vw, 180px"}
          src={item.coverUrl}
        />
        <span className="library-bookmark" aria-label={statusCopy[item.status]}>
          <Bookmark fill="currentColor" size={13} />
        </span>
        <span className="library-score"><Star fill="currentColor" size={10} />{item.score?.toFixed(1) ?? "—"}</span>
      </div>
      <div className="library-card-body">
        <div className="library-card-heading">
          <div>
            <h3><Link href={`/anime/${item.slug}`}>{item.title}</Link></h3>
            <p>{item.genres.join(" · ")}{item.releaseYear ? ` · ${item.releaseYear}` : ""}</p>
          </div>
          <span className={cn("library-status", `status-${item.status}`)}>{statusCopy[item.status]}</span>
        </div>
        <div className="library-card-progress">
          <span><span style={{ width: `${progress(item)}%` }} /></span>
          <small>{item.episodesWatched}/{item.episodeCount ?? "?"} episodios</small>
        </div>
        <div className="library-card-actions">
          <button
            aria-label={favorite ? `Quitar ${item.title} de favoritos` : `Añadir ${item.title} a favoritos`}
            aria-pressed={favorite}
            className={favorite ? "is-favorite" : undefined}
            onClick={onFavorite}
            type="button"
          >
            <Heart fill={favorite ? "currentColor" : "none"} size={15} />
          </button>
          <button aria-label={`Más acciones para ${item.title}`} type="button"><MoreHorizontal size={16} /></button>
        </div>
      </div>
    </article>
  );
}

function RecentAnimeRow({ item, updatedLabel }: { item: LibraryItem; updatedLabel: string }) {
  return (
    <article className="library-side-row library-recent-row micro-row">
      <Image alt="" height={54} src={item.coverUrl} width={42} />
      <span>
        <strong>{item.title}</strong>
        <small>Episodio {item.episodesWatched}</small>
        <span className="library-mini-progress"><span style={{ width: `${progress(item)}%` }} /></span>
      </span>
      <span className="library-recent-meta">
        <time dateTime={item.updatedAt}>{updatedLabel}</time>
        <span className={cn("library-status", `status-${item.status}`)}>{statusCopy[item.status]}</span>
      </span>
    </article>
  );
}

function ContinueAnimeRow({ item }: { item: LibraryItem }) {
  return (
    <article className="library-side-row library-continue-row micro-row">
      <Image alt="" height={54} src={item.coverUrl} width={42} />
      <span>
        <strong>{item.title}</strong>
        <small>Episodio {item.episodesWatched} de {item.episodeCount ?? "?"}</small>
        <span className="library-mini-progress"><span style={{ width: `${progress(item)}%` }} /></span>
      </span>
      <strong className="library-side-percent">{progress(item)}%</strong>
      <ChevronRight aria-hidden="true" size={14} />
    </article>
  );
}

export function LibraryPage({ data, isDemo }: LibraryPageProps) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("all");
  const [year, setYear] = useState("all");
  const [sort, setSort] = useState<SortMode>("recent");
  const [view, setView] = useState<ViewMode>("grid");
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});

  const genres = useMemo(
    () => Array.from(new Set(data.items.flatMap((item) => item.genres))).sort(),
    [data.items],
  );
  const years = useMemo(
    () => Array.from(new Set(data.items.map((item) => item.releaseYear).filter((value): value is number => value !== null))).sort((a, b) => b - a),
    [data.items],
  );
  const recentReference = useMemo(() => {
    const newest = data.recentlyUpdated[0]?.updatedAt;
    return newest ? new Date(new Date(newest).getTime() + 2 * 60 * 60 * 1000) : new Date();
  }, [data.recentlyUpdated]);
  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return data.items
      .filter((item) => status === "all" || item.status === status)
      .filter((item) => genre === "all" || item.genres.includes(genre))
      .filter((item) => year === "all" || item.releaseYear === Number(year))
      .filter((item) => !normalizedQuery || item.title.toLocaleLowerCase("es").includes(normalizedQuery))
      .toSorted((a, b) => {
        if (sort === "title") return a.title.localeCompare(b.title, "es");
        if (sort === "score") return (b.score ?? 0) - (a.score ?? 0);
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [data.items, genre, query, sort, status, year]);

  const toggleFavorite = (item: LibraryItem) => {
    setFavoriteOverrides((current) => ({
      ...current,
      [item.franchiseId]: !(current[item.franchiseId] ?? item.isFavorite),
    }));
  };

  return (
    <div className="library-page">
      <header className="library-header">
        <div>
          <p>Tu colección personal</p>
          <h1>Mi biblioteca</h1>
          <span>Organiza, filtra y continúa cada historia desde un solo lugar.</span>
        </div>
        <div className="library-header-actions">
          <Link className="library-tracking-link" href="/seguimiento"><Play size={14} />Mi seguimiento</Link>
          {isDemo && <div className="demo-data-pill"><Sparkles size={14} /><strong>Modo demo</strong><span>Datos de muestra</span></div>}
        </div>
      </header>

      <div className="library-layout">
        <section className="library-main">
          <section className="library-summary-grid" aria-label="Resumen de biblioteca">
            {data.summaries.map((summary) => {
              const Icon = summaryIcons[summary.status];
              return (
                <button
                  className={cn("library-summary-card micro-lift", `tone-${summary.tone}`, status === summary.status && "is-selected")}
                  key={summary.status}
                  onClick={() => setStatus((current) => current === summary.status ? "all" : summary.status)}
                  type="button"
                >
                  <span className="library-summary-icon"><Icon size={17} /></span>
                  <span><small>{summary.label}</small><strong>{summary.count}</strong><em>{summary.description}</em></span>
                </button>
              );
            })}
          </section>

          <div className="library-tabs" role="tablist" aria-label="Pestañas de estado">
            <button aria-selected={status === "all"} className={status === "all" ? "is-active" : undefined} onClick={() => setStatus("all")} role="tab" type="button">
              Todos <span>{data.totalResults}</span>
            </button>
            {data.summaries.map((summary) => (
              <button
                aria-selected={status === summary.status}
                className={status === summary.status ? "is-active" : undefined}
                key={summary.status}
                onClick={() => setStatus(summary.status)}
                role="tab"
                type="button"
              >
                {summary.label} <span>{summary.count}</span>
              </button>
            ))}
          </div>

          <div className="library-toolbar">
            <label className="library-search">
              <Search size={15} />
              <input onChange={(event) => setQuery(event.target.value)} placeholder="Buscar en mi biblioteca..." type="search" value={query} />
            </label>
            <label className="library-select"><Filter size={14} /><span className="sr-only">Género</span>
              <select aria-label="Filtrar por género" onChange={(event) => setGenre(event.target.value)} value={genre}>
                <option value="all">Género</option>
                {genres.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="library-select"><Bookmark size={14} /><span className="sr-only">Estado</span>
              <select aria-label="Filtrar por estado" onChange={(event) => setStatus(event.target.value as StatusFilter)} value={status}>
                <option value="all">Estado</option>
                <option value="plan_to_watch">Planeo ver</option>
                <option value="watching">Viendo actualmente</option>
                <option value="caught_up">Al día</option>
                <option value="paused">En pausa</option>
                <option value="completed">Completado</option>
                <option value="waiting_next_season">Esperando temporada</option>
                <option value="dropped">Abandonado</option>
              </select>
            </label>
            <label className="library-select"><Clock3 size={14} /><span className="sr-only">Año</span>
              <select aria-label="Filtrar por año" onChange={(event) => setYear(event.target.value)} value={year}>
                <option value="all">Año</option>
                {years.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <button className="library-tool-button" disabled title="Disponible en una próxima iteración" type="button"><SlidersHorizontal size={14} />Más filtros</button>
            <label className="library-select library-sort"><span className="sr-only">Ordenar</span>
              <select aria-label="Ordenar biblioteca" onChange={(event) => setSort(event.target.value as SortMode)} value={sort}>
                <option value="recent">Recientes</option>
                <option value="title">Título A–Z</option>
                <option value="score">Mejor puntuación</option>
              </select>
            </label>
            <div className="library-view-switch" aria-label="Vista de biblioteca">
              <button aria-label="Vista en cuadrícula" aria-pressed={view === "grid"} className={view === "grid" ? "is-active" : undefined} onClick={() => setView("grid")} type="button"><Grid2X2 size={15} /></button>
              <button aria-label="Vista en lista" aria-pressed={view === "list"} className={view === "list" ? "is-active" : undefined} onClick={() => setView("list")} type="button"><List size={16} /></button>
            </div>
          </div>

          <div className="library-results-line">
            <span>Mostrando <strong>{visibleItems.length}</strong> de {data.totalResults} títulos</span>
            {(status !== "all" || query || genre !== "all" || year !== "all") && (
              <button onClick={() => { setStatus("all"); setQuery(""); setGenre("all"); setYear("all"); }} type="button">Limpiar filtros <X size={12} /></button>
            )}
          </div>

          {visibleItems.length ? (
            <div className={cn("library-cards", view === "list" && "is-list")}>
              {visibleItems.map((item) => (
                <LibraryCard
                  favorite={favoriteOverrides[item.franchiseId] ?? item.isFavorite}
                  item={item}
                  key={item.franchiseId}
                  onFavorite={() => toggleFavorite(item)}
                  view={view}
                />
              ))}
            </div>
          ) : (
            <div className="library-empty panel">
              <span><BookOpen size={22} /></span>
              <h2>{data.totalResults === 0 ? "Tu biblioteca está lista para comenzar" : "No encontramos coincidencias"}</h2>
              <p>{data.totalResults === 0 ? "Agrega tu primer anime y aquí aparecerán su estado, progreso y actividad." : "Prueba con otros filtros o términos de búsqueda."}</p>
            </div>
          )}

          {visibleItems.length > 0 && (
            <footer className="library-pagination">
              <span>Página 1 de 13</span>
              <nav aria-label="Paginación">
                <button aria-label="Página anterior" disabled type="button"><ChevronLeft size={15} /></button>
                <button className="is-active" type="button">1</button><button type="button">2</button><button type="button">3</button>
                <span>…</span><button type="button">13</button>
                <button aria-label="Página siguiente" type="button"><ChevronRight size={15} /></button>
              </nav>
            </footer>
          )}
        </section>

        <aside className="library-sidebar">
          <section className="panel library-side-panel">
            <div className="section-heading"><div><Sparkles className="section-heading-icon" size={14} /><h2>Recientemente actualizados</h2></div><button type="button">Ver todos <ChevronRight size={12} /></button></div>
            <div className="library-side-list">
              {data.recentlyUpdated.length ? data.recentlyUpdated.map((item) => {
                const hours = Math.max(1, Math.round((recentReference.getTime() - new Date(item.updatedAt).getTime()) / 3_600_000));
                return <RecentAnimeRow item={item} key={item.franchiseId} updatedLabel={hours < 24 ? `Hace ${hours} h` : "Ayer"} />;
              }) : <p className="library-side-empty">Tus cambios recientes aparecerán aquí.</p>}
            </div>
          </section>
          <section className="panel library-side-panel">
            <div className="section-heading"><div><Play className="section-heading-icon" size={14} /><h2>Continuar viendo</h2></div><button type="button">Ver todos <ChevronRight size={12} /></button></div>
            <div className="library-side-list">
              {data.continueWatching.length ? data.continueWatching.map((item) => <ContinueAnimeRow item={item} key={item.franchiseId} />) : <p className="library-side-empty">Cuando inicies un anime, podrás retomarlo desde aquí.</p>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
