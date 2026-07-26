"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  Bookmark,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crown,
  Heart,
  MoreVertical,
  PieChart,
  RefreshCw,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { PanelHeading } from "@/components/ui/panel-heading";
import type { FavoriteAnime, FavoritesData } from "@/types/favorites";

type FavoritesPageProps = {
  data: FavoritesData;
  isDemo: boolean;
};

type FavoriteSort = "score" | "recent" | "title";

function FavoriteCard({ anime, rank, onRemove }: { anime: FavoriteAnime; rank: number; onRemove: () => void }) {
  return (
    <article className="favorite-card micro-lift">
      <div className="favorite-cover">
        <Image alt={`Portada de ${anime.title}`} fill sizes="(max-width: 680px) 44vw, 220px" src={anime.coverUrl} />
        <span className="favorite-rank">#{rank}</span>
        <button aria-label={`Quitar ${anime.title} de favoritos demo`} onClick={onRemove} type="button"><Heart fill="currentColor" size={12} />Favorito</button>
      </div>
      <div className="favorite-card-body">
        <h3>{anime.title}</h3>
        <p className="favorite-meta">{anime.year} · {anime.episodeCount} eps</p>
        <p className="favorite-score"><Star fill="currentColor" size={11} />{anime.score.toFixed(1)}/10</p>
        <p className="favorite-description">{anime.description}</p>
        <div className="favorite-card-actions">
          <button type="button"><Bookmark size={14} />Ver detalles</button>
          <button aria-label={`Más acciones para ${anime.title}`} type="button"><MoreVertical size={14} /></button>
        </div>
      </div>
    </article>
  );
}

export function FavoritesPage({ data, isDemo }: FavoritesPageProps) {
  const [sort, setSort] = useState<FavoriteSort>("score");
  const [genre, setGenre] = useState("all");
  const [year, setYear] = useState("all");
  const [added, setAdded] = useState("all");
  const [removed, setRemoved] = useState<Record<string, boolean>>({});
  const [activeGenre, setActiveGenre] = useState<number | null>(null);

  const genres = useMemo(() => Array.from(new Set(data.items.flatMap((item) => item.genres))).sort((a, b) => a.localeCompare(b, "es")), [data.items]);
  const years = useMemo(() => Array.from(new Set(data.items.map((item) => item.year))).sort((a, b) => b - a), [data.items]);
  const visibleItems = useMemo(() => data.items
    .filter((item) => !removed[item.id])
    .filter((item) => genre === "all" || item.genres.includes(genre))
    .filter((item) => year === "all" || item.year === Number(year))
    .filter((item) => added === "all" || (added === "recent" ? item.addedDaysAgo <= 14 : item.addedDaysAgo > 14))
    .toSorted((a, b) => sort === "score" ? b.score - a.score : sort === "recent" ? a.addedDaysAgo - b.addedDaysAgo : a.title.localeCompare(b.title, "es")), [added, data.items, genre, removed, sort, year]);
  const ranking = [...data.items].sort((a, b) => b.score - a.score);
  const donutGradient = data.genreMetrics.length
    ? `conic-gradient(${data.genreMetrics.map((item, index) => {
      const start = data.genreMetrics.slice(0, index).reduce((sum, entry) => sum + entry.percentage, 0);
      const color = activeGenre === null || activeGenre === index ? item.color : `${item.color}35`;
      return `${color} ${start}% ${start + item.percentage}%`;
    }).join(",")})`
    : "conic-gradient(#252c40 0 100%)";

  const resetFilters = () => {
    setSort("score");
    setGenre("all");
    setYear("all");
    setAdded("all");
  };

  return (
    <div className="favorites-page">
      <header className="favorites-header">
        <Image alt="" className="favorites-header-image" fill priority sizes="100vw" src="/images/favorites-purple-guardian-v1.png" />
        <div className="favorites-header-overlay" />
        <div className="favorites-title"><Heart size={39} /><div><h1>Mis Favoritos</h1><p>Tus animes más especiales, en un solo lugar.</p></div></div>
        {isDemo && <div className="demo-data-pill"><Sparkles size={14} /><strong>Modo demo</strong><span>Selección de muestra</span></div>}
      </header>

      <div className="favorites-layout">
        <main className="favorites-main">
          <section className="favorites-metrics panel" aria-label="Resumen de favoritos">
            <article><Heart size={22} /><span><small>Total de favoritos</small><strong>{data.totalFavorites}</strong><em>animes</em></span></article>
            <article><Star size={22} /><span><small>Puntuación promedio</small><strong>{data.averageScore.toFixed(2)} <em>/10</em></strong></span></article>
            <article><Clock3 size={22} /><span><small>Días de anime</small><strong>{data.animeDays}</strong><em>días</em></span></article>
            <article><CalendarDays size={22} /><span><small>Último agregado</small><strong>{data.lastAdded.label}</strong><em>{data.lastAdded.title}</em></span></article>
          </section>

          <section className="favorites-filters panel" aria-label="Filtros de favoritos">
            <label><span>Ordenar por</span><select aria-label="Ordenar favoritos" onChange={(event) => setSort(event.target.value as FavoriteSort)} value={sort}><option value="score">Top puntuación</option><option value="recent">Más recientes</option><option value="title">Título A–Z</option></select></label>
            <label><span>Género</span><select aria-label="Filtrar favoritos por género" onChange={(event) => setGenre(event.target.value)} value={genre}><option value="all">Todos los géneros</option>{genres.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Año</span><select aria-label="Filtrar favoritos por año" onChange={(event) => setYear(event.target.value)} value={year}><option value="all">Todos los años</option>{years.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Agregado</span><select aria-label="Filtrar favoritos por fecha" onChange={(event) => setAdded(event.target.value)} value={added}><option value="all">Más recientes</option><option value="recent">Últimos 14 días</option><option value="older">Anteriores</option></select></label>
            <button onClick={resetFilters} type="button"><RefreshCw size={13} />Limpiar filtros</button>
          </section>

          {visibleItems.length ? (
            <div className="favorites-grid">
              {visibleItems.map((anime) => <FavoriteCard anime={anime} key={anime.id} onRemove={() => setRemoved((current) => ({ ...current, [anime.id]: true }))} rank={ranking.findIndex((entry) => entry.id === anime.id) + 1} />)}
            </div>
          ) : (
            <section className="favorites-empty panel"><span><Heart size={23} /></span><h2>{data.totalFavorites === 0 ? "Aún no tienes favoritos" : "No hay coincidencias"}</h2><p>{data.totalFavorites === 0 ? "Marca tus animes más especiales y aparecerán en esta colección." : "Prueba restableciendo los filtros para recuperar tu selección."}</p><button onClick={resetFilters} type="button">Restablecer filtros</button></section>
          )}

          {visibleItems.length > 0 && (
            <footer className="favorites-footer"><span>Mostrando 1 a {visibleItems.length} de {data.totalFavorites} favoritos</span><nav aria-label="Paginación de favoritos"><button aria-label="Página anterior" disabled type="button"><ChevronLeft size={14} /></button><button className="is-active" type="button">1</button><button type="button">2</button><button type="button">3</button><button type="button">4</button><button aria-label="Página siguiente" type="button"><ChevronRight size={14} /></button></nav></footer>
          )}
        </main>

        <aside className="favorites-sidebar">
          <section className="panel favorites-ranking-panel">
            <PanelHeading icon={Trophy} title="Tu ranking personal" tone="#fbbf24" />
            <div className="favorites-podium">
              {ranking.slice(0, 3).map((anime, index) => <article className={`podium-${index + 1}`} key={anime.id}><Crown size={13} /><Image alt="" height={48} src={anime.coverUrl} width={48} /><strong>{anime.score.toFixed(1)}</strong></article>)}
            </div>
            <button type="button">Ver top 5 personales</button>
          </section>

          <section className="panel favorites-genre-panel">
            <PanelHeading icon={PieChart} title="Tus favoritos por género" tone="#22d3ee" />
            <div className="favorites-genre-content">
              <div className={activeGenre === null ? "favorites-donut" : "favorites-donut is-highlighted"} style={{ background: donutGradient }}>
                <span>
                  <strong>{activeGenre === null ? data.totalFavorites : data.genreMetrics[activeGenre]?.count}</strong>
                  <small>{activeGenre === null ? "Total" : data.genreMetrics[activeGenre]?.name}</small>
                </span>
              </div>
              <ul>{data.genreMetrics.map((item, index) => (
                <li className={activeGenre === index ? "is-active" : undefined} key={item.name}>
                  <button
                    onBlur={() => setActiveGenre(null)}
                    onFocus={() => setActiveGenre(index)}
                    onMouseEnter={() => setActiveGenre(index)}
                    onMouseLeave={() => setActiveGenre(null)}
                    type="button"
                  >
                    <i style={{ background: item.color }} /><span>{item.name}</span><strong>{item.count} ({item.percentage}%)</strong>
                  </button>
                </li>
              ))}</ul>
            </div>
            <button type="button">Ver todos los géneros</button>
          </section>

          <section className="panel favorites-top-panel">
            <PanelHeading icon={Crown} title="Top 5 personales" tone="#f59e0b" />
            <ol>{ranking.slice(0, 5).map((anime, index) => <li key={anime.id}><span>{index < 3 ? <Crown size={13} /> : index + 1}</span><Image alt="" height={34} src={anime.coverUrl} width={34} /><strong>{anime.title}</strong><em><Star fill="currentColor" size={10} />{anime.score.toFixed(1)}</em></li>)}</ol>
            <button type="button">Ver mi ranking completo</button>
          </section>
        </aside>
      </div>
    </div>
  );
}
