"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bookmark,
  Building2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Filter,
  LibraryBig,
  Plus,
  SearchX,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { PanelHeading } from "@/components/ui/panel-heading";
import { cn } from "@/lib/utils";
import type { ExploreAnime, ExploreData } from "@/types/explore";

type ExplorePageProps = {
  data: ExploreData;
  isDemo: boolean;
};

type SortMode = "popular" | "rating" | "newest";

function unique(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "es"));
}

function ExploreCard({
  anime,
  rank,
  compact = false,
  isAdded,
  onToggle,
}: {
  anime: ExploreAnime;
  rank?: number;
  compact?: boolean;
  isAdded: boolean;
  onToggle: () => void;
}) {
  return (
    <article className={cn("explore-card micro-lift", compact && "is-compact")}>
      <div className="explore-card-cover">
        <Image alt={`Portada de ${anime.title}`} fill sizes="(max-width: 680px) 44vw, 180px" src={anime.coverUrl} />
        {rank && <span className="explore-rank">{rank}</span>}
      </div>
      <div className="explore-card-copy">
        <h3>{anime.title}</h3>
        <p><span className="explore-card-context">{compact ? anime.year : `${anime.episodeCount} eps`}</span><span className="explore-card-score"><Star fill="currentColor" size={9} />{anime.score.toFixed(1)}</span></p>
        <button
          aria-label={isAdded ? `Quitar ${anime.title} de la selección demo` : `Añadir ${anime.title} a la selección demo`}
          aria-pressed={isAdded}
          className={isAdded ? "is-added" : undefined}
          onClick={onToggle}
          type="button"
        >
          {isAdded ? <LibraryBig size={14} /> : <Plus size={15} />}
        </button>
      </div>
    </article>
  );
}

function SectionHeading({ icon: Icon, title }: { icon: typeof Zap; title: string }) {
  return (
    <div className="explore-section-heading">
      <div><Icon size={16} /><h2>{title}</h2></div>
      <button type="button">Ver todos <ChevronRight size={12} /></button>
    </div>
  );
}

export function ExplorePage({ data, isDemo }: ExplorePageProps) {
  const catalog = useMemo(() => unique([...data.trending, ...data.popular].map((item) => item.id))
    .map((id) => [...data.trending, ...data.popular].find((item) => item.id === id)!)
    .filter(Boolean), [data.popular, data.trending]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [genre, setGenre] = useState("all");
  const [year, setYear] = useState("all");
  const [season, setSeason] = useState("all");
  const [studio, setStudio] = useState("all");
  const [format, setFormat] = useState("all");
  const [score, setScore] = useState("all");
  const [sort, setSort] = useState<SortMode>("popular");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState(false);
  const featured = data.featured[featuredIndex] ?? null;

  const years = useMemo(() => [...new Set(catalog.map((item) => item.year))].sort((a, b) => b - a), [catalog]);
  const genres = useMemo(() => unique(catalog.flatMap((item) => item.genres)), [catalog]);
  const studios = useMemo(() => unique(catalog.map((item) => item.studio)), [catalog]);
  const visiblePopular = useMemo(() => catalog
    .filter((item) => genre === "all" || item.genres.includes(genre))
    .filter((item) => year === "all" || item.year === Number(year))
    .filter((item) => season === "all" || item.season === season)
    .filter((item) => studio === "all" || item.studio === studio)
    .filter((item) => format === "all" || item.format === format)
    .filter((item) => score === "all" || item.score >= Number(score))
    .toSorted((a, b) => sort === "rating" ? b.score - a.score : sort === "newest" ? b.year - a.year : data.popular.findIndex((entry) => entry.id === a.id) - data.popular.findIndex((entry) => entry.id === b.id))
    .slice(0, 6), [catalog, data.popular, format, genre, score, season, sort, studio, year]);

  const toggleAdded = (id: string) => setAdded((current) => ({ ...current, [id]: !current[id] }));

  return (
    <div className="explore-page">
      <header className="explore-header">
        <div><h1>Explorar</h1><p>Descubre nuevos mundos, historias y emociones.</p></div>
        {isDemo && <div className="demo-data-pill"><Sparkles size={14} /><strong>Modo demo</strong><span>Catálogo de muestra</span></div>}
      </header>

      <div className="explore-layout">
        <main className="explore-main">
          <section className="explore-filters" aria-label="Filtros del catálogo">
            <label><span>Género</span><select aria-label="Filtrar por género" onChange={(event) => setGenre(event.target.value)} value={genre}><option value="all">Todos</option>{genres.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Año</span><select aria-label="Filtrar por año" onChange={(event) => setYear(event.target.value)} value={year}><option value="all">Todos</option>{years.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Temporada</span><select aria-label="Filtrar por temporada" onChange={(event) => setSeason(event.target.value)} value={season}><option value="all">Todas</option><option>Invierno</option><option>Primavera</option><option>Verano</option><option>Otoño</option></select></label>
            <label><span>Estudio</span><select aria-label="Filtrar por estudio" onChange={(event) => setStudio(event.target.value)} value={studio}><option value="all">Todos</option>{studios.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Formato</span><select aria-label="Filtrar por formato" onChange={(event) => setFormat(event.target.value)} value={format}><option value="all">Todos</option><option>TV</option><option>Película</option><option>OVA</option></select></label>
            <label><span>Puntuación</span><select aria-label="Filtrar por puntuación" onChange={(event) => setScore(event.target.value)} value={score}><option value="all">Todas</option><option value="9">9 o más</option><option value="8.5">8.5 o más</option><option value="8">8 o más</option></select></label>
            <label><span>Ordenar por</span><select aria-label="Ordenar catálogo" onChange={(event) => setSort(event.target.value as SortMode)} value={sort}><option value="popular">Más populares</option><option value="rating">Mejor puntuación</option><option value="newest">Más recientes</option></select></label>
            <button aria-expanded={advancedOpen} className={advancedOpen ? "is-active" : undefined} onClick={() => setAdvancedOpen((current) => !current)} type="button"><Filter size={14} />Filtros</button>
          </section>
          {advancedOpen && <div className="explore-filter-note"><Filter size={13} /><span>Los filtros se aplican automáticamente al catálogo visible.</span><button onClick={() => { setGenre("all"); setYear("all"); setSeason("all"); setStudio("all"); setFormat("all"); setScore("all"); }} type="button">Restablecer</button></div>}

          {featured ? (
            <section className="explore-featured">
              <Image alt="" className="explore-featured-image" fill priority src={featured.bannerUrl} />
              <div className="explore-featured-overlay" />
              <div className="explore-featured-copy">
                <span>Anime destacado</span>
                <h2>{featured.title}</h2>
                <p className="explore-featured-meta">{featured.year} · {featured.episodeCount} episodios · {featured.studio}</p>
                <div className="explore-featured-genres">{featured.genres.map((item) => <span key={item}>{item}</span>)}</div>
                <p>{featured.synopsis}</p>
                <div className="explore-featured-actions">
                  <Link href="/anime/eclipse-del-vacio">Ver detalles</Link>
                  <button aria-label={bookmarked ? "Quitar destacado de guardados" : "Guardar destacado"} aria-pressed={bookmarked} className={bookmarked ? "is-saved" : undefined} onClick={() => setBookmarked((current) => !current)} type="button"><Bookmark fill={bookmarked ? "currentColor" : "none"} size={16} /></button>
                </div>
              </div>
              <div className="explore-carousel-dots">{data.featured.map((item, index) => <button aria-label={`Mostrar ${item.title}`} aria-pressed={featuredIndex === index} className={featuredIndex === index ? "is-active" : undefined} key={item.id} onClick={() => setFeaturedIndex(index)} type="button" />)}</div>
              <div className="explore-carousel-arrows">
                <button aria-label="Destacado anterior" onClick={() => setFeaturedIndex((current) => (current - 1 + data.featured.length) % data.featured.length)} type="button"><ChevronLeft size={17} /></button>
                <button aria-label="Destacado siguiente" onClick={() => setFeaturedIndex((current) => (current + 1) % data.featured.length)} type="button"><ChevronRight size={17} /></button>
              </div>
            </section>
          ) : (
            <section className="explore-empty panel"><span><SearchX size={22} /></span><h2>El catálogo aún está vacío</h2><p>Los títulos disponibles aparecerán aquí cuando el catálogo real tenga registros.</p></section>
          )}

          {data.trending.length > 0 && (
            <section className="explore-content-section">
              <SectionHeading icon={Zap} title="Tendencias" />
              <div className="explore-card-row">{data.trending.map((anime, index) => <ExploreCard anime={anime} compact isAdded={Boolean(added[anime.id])} key={anime.id} onToggle={() => toggleAdded(anime.id)} rank={index + 1} />)}</div>
            </section>
          )}

          <section className="explore-content-section">
            <SectionHeading icon={Flame} title="Populares" />
            {visiblePopular.length > 0 ? (
              <div className="explore-card-row">{visiblePopular.map((anime) => <ExploreCard anime={anime} isAdded={Boolean(added[anime.id])} key={anime.id} onToggle={() => toggleAdded(anime.id)} />)}</div>
            ) : (
              <div className="explore-results-empty">No hay títulos que coincidan con estos filtros.</div>
            )}
          </section>
        </main>

        <aside className="explore-sidebar">
          <section className="panel explore-insight-panel">
            <PanelHeading icon={Sparkles} meta="Esta temporada" title="Géneros populares" tone="#a855f7" />
            <ul>{data.genreMetrics.map((item) => <li key={item.name}><span className="explore-metric-icon" style={{ "--metric": item.color } as React.CSSProperties}><Sparkles size={11} /></span><span><strong>{item.name}</strong><span className="explore-metric-track"><span style={{ width: `${item.value}%`, background: item.color }} /></span></span><em>{item.value}%</em></li>)}</ul>
            <button type="button">Ver todos los géneros</button>
          </section>
          <section className="panel explore-insight-panel">
            <PanelHeading icon={Building2} meta="Esta temporada" title="Estudios destacados" tone="#3b82f6" />
            <ul>{data.studioMetrics.map((item) => <li key={item.name}><span className="explore-studio-logo" style={{ "--metric": item.color } as React.CSSProperties}><Building2 size={13} /></span><span><strong>{item.name}</strong><small>{item.detail}</small><span className="explore-metric-track"><span style={{ width: `${item.value}%`, background: item.color }} /></span></span><em>{item.value}%</em></li>)}</ul>
            <button type="button">Ver todos los estudios</button>
          </section>
          <section className="panel explore-rating-panel">
            <PanelHeading icon={Star} meta="Esta temporada" title="Calificación promedio" tone="#f59e0b" />
            <div className="explore-rating-value"><Star fill="currentColor" size={24} /><strong>{data.averageRating.toFixed(2)}</strong><span><TrendingUp size={11} />+{data.ratingDelta.toFixed(2)} vs temporada anterior</span></div>
            <div className="explore-rating-bars">{data.ratingDistribution.map((value, index) => <span key={`${value}-${index}`}><span style={{ height: `${value}%` }} /></span>)}</div>
            <div className="explore-rating-axis"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>
            <p>Puntuación</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
