"use client";
/* eslint-disable @next/next/no-img-element -- AniList returns provider-owned thumbnails and platform icons at runtime. */

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition, type CSSProperties } from "react";
import {
  ArrowLeft, Bookmark, CalendarDays, Check, Clapperboard, Database, ExternalLink,
  Film, Heart, Info, Layers3, Link2, MessageCircle, Minus, MonitorPlay, Play, Plus,
  Save, Share2, Sparkles, Star, Tags, Trash2, Tv, UsersRound,
} from "lucide-react";
import {
  removeLibraryItemAction, setLibraryFavoriteAction, setLibraryRatingAction,
  updateLibraryProgressAction,
} from "@/app/(app)/biblioteca/actions";
import type { LiveAnimeDetailData } from "@/lib/anime/anime-detail";
import type { PersonalAnimeStatus } from "@/types/library";
import {
  LiveAbandonDialog, LiveDeleteDialog, LiveRatingDialog, LiveStatusDialog,
} from "@/components/anime/anime-detail-live-dialogs";

const labels: Record<PersonalAnimeStatus, string> = {
  plan_to_watch: "Planeo ver",
  watching: "Viendo actualmente",
  caught_up: "Al día",
  paused: "En pausa",
  completed: "Completado",
  waiting_next_season: "Esperando temporada",
  dropped: "Abandonado",
};

const tabs = [
  { label: "Resumen", icon: Film },
  { label: "Episodios", icon: CalendarDays },
  { label: "Personajes", icon: UsersRound },
  { label: "Reseñas", icon: MessageCircle },
  { label: "Recomendaciones", icon: Sparkles },
  { label: "Similares", icon: Layers3 },
  { label: "Datos", icon: Database },
] as const;

const genreTones = ["#8b5cf6", "#ec4899", "#22d3ee", "#f59e0b", "#22c55e", "#3b82f6"];

function providerTone(provider: string, fallback?: string | null) {
  const value = provider.toLocaleLowerCase();
  if (value.includes("youtube")) return "#ff453a";
  if (value.includes("crunchyroll")) return "#f97316";
  if (value.includes("bilibili")) return "#22d3ee";
  if (value.includes("iq") || value.includes("qiyi")) return "#22c55e";
  if (value.includes("netflix")) return "#ef4444";
  return fallback || "#a855f7";
}

function ProviderMark({ provider, tone }: { provider: string; tone: string }) {
  const value = provider.toLocaleLowerCase();
  if (value.includes("youtube")) return <svg aria-hidden="true" className="anime-provider-lucide" height="20" style={{ color: tone }} viewBox="0 0 24 24" width="20"><path d="M21.4 6.2a2.8 2.8 0 0 0-2-2C17.7 3.7 12 3.7 12 3.7s-5.7 0-7.4.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2.1 12a29 29 0 0 0 .5 5.8 2.8 2.8 0 0 0 2 2c1.7.5 7.4.5 7.4.5s5.7 0 7.4-.5a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .5-5.8 29 29 0 0 0-.5-5.8Z" fill="currentColor"/><path d="m10 15.5 5-3.5-5-3.5v7Z" fill="#0e1421"/></svg>;
  if (value.includes("crunchyroll")) return <span aria-hidden="true" className="anime-provider-crunchyroll" style={{ color: tone }}><i/></span>;
  if (value.includes("bilibili")) return <MonitorPlay aria-hidden="true" className="anime-provider-lucide" size={20} style={{ color: tone }}/>;
  if (value.includes("iq") || value.includes("qiyi")) return <span aria-hidden="true" className="anime-provider-wordmark" style={{ color: tone }}>iQIYI</span>;
  return <Link2 aria-hidden="true" className="anime-provider-lucide" size={19} style={{ color: tone }}/>;
}

function typeLabel(type: string) {
  const normalized = type.toLocaleLowerCase();
  if (normalized === "tv" || normalized === "season") return "Temporada";
  if (normalized === "movie") return "Película";
  if (normalized === "ova") return "OVA";
  if (normalized === "ona") return "ONA";
  if (normalized === "special") return "Especial";
  return type;
}

export function AnimeDetailLivePage({ data }: { data: LiveAnimeDetailData }) {
  const [tab, setTab] = useState<(typeof tabs)[number]["label"]>("Resumen");
  const [favorite, setFavorite] = useState(data.isFavorite);
  const [status, setStatus] = useState(data.status);
  const [watched, setWatched] = useState(data.episodesWatched);
  const [rating, setRating] = useState(data.rating);
  const [selectedContentId, setSelectedContentId] = useState(data.contents[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [abandonDialogOpen, setAbandonDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const anime = data.anilist;
  const selectedContent = data.contents.find((content) => content.id === selectedContentId) ?? data.contents[0];

  const episodes = useMemo(() => {
    const total = selectedContent?.episodeCount || (selectedContent?.id === data.contents[0]?.id ? data.episodeCount : 0);
    const sources = selectedContent?.id === data.contents[0]?.id ? anime?.episodesList ?? [] : [];
    if (!total) return sources.map((episode, index) => ({ ...episode, number: index + 1 }));
    const sourceByNumber = new Map(sources.flatMap((episode) => {
      const match = episode.title.match(/episode\s+(\d+)/i);
      return match ? [[Number(match[1]), episode] as const] : [];
    }));
    return Array.from({ length: total }, (_, index) => {
      const source = sourceByNumber.get(index + 1);
      return {
        number: index + 1,
        title: source?.title || `Episodio ${index + 1}`,
        thumbnailUrl: source?.thumbnailUrl || selectedContent?.coverUrl || data.coverUrl,
        url: source?.url || "",
      };
    });
  }, [anime?.episodesList, data.contents, data.coverUrl, data.episodeCount, selectedContent]);

  const saveProgress = () => startTransition(async () => {
    const result = await updateLibraryProgressAction({
      franchiseId: data.franchiseId,
      status,
      episodesWatched: watched,
    });
    setMessage(result.ok ? "Estado y progreso actualizados." : (result.message ?? "No pudimos actualizar tu progreso."));
  });

  const saveStatus = async (next: PersonalAnimeStatus) => {
    if (next === "dropped") {
      setAbandonDialogOpen(true);
      return true;
    }
    const nextWatched = next === "completed" ? data.episodeCount : next === "plan_to_watch" ? 0 : watched;
    const result = await updateLibraryProgressAction({ franchiseId: data.franchiseId, status: next, episodesWatched: nextWatched });
    if (result.ok) {
      setStatus(next);
      setWatched(nextWatched);
    }
    setMessage(result.ok ? "Estado actualizado." : (result.message ?? "No pudimos actualizar el estado."));
    return result.ok;
  };

  const confirmAbandon = async () => {
    const result = await updateLibraryProgressAction({ franchiseId: data.franchiseId, status: "dropped", episodesWatched: watched });
    if (result.ok) setStatus("dropped");
    setMessage(result.ok ? "El anime fue marcado como abandonado." : (result.message ?? "No pudimos cambiar el estado."));
    return result.ok;
  };

  const toggleFavorite = () => startTransition(async () => {
    const next = !favorite;
    const result = await setLibraryFavoriteAction({ franchiseId: data.franchiseId, favorite: next });
    if (result.ok) setFavorite(next);
    setMessage(result.ok ? (next ? "Añadido a favoritos." : "Quitado de favoritos.") : (result.message ?? "No pudimos actualizar favoritos."));
  });

  const persistRating = async (score: number) => {
    const result = await setLibraryRatingAction({ franchiseId: data.franchiseId, score });
    if (result.ok) setRating(score);
    setMessage(result.ok ? `Puntuación guardada: ${score}/10.` : (result.message ?? "No pudimos guardar tu puntuación."));
    return result.ok;
  };

  return <div className="anime-detail-page anime-detail-live">
    <div className="anime-detail-layout">
      <main className="anime-detail-main">
        <section className="anime-hero">
          <Image alt="" className="anime-hero-background" fill priority quality={92} sizes="(max-width:1100px) 100vw,75vw" src={data.bannerUrl}/>
          <div className="anime-hero-shade"/>
          <Link className="anime-back-button" href="/seguimiento"><ArrowLeft size={14}/>Regresar</Link>
          <div className="anime-detail-cover">
            <Image alt={`Portada de ${data.title}`} fill priority quality={92} sizes="190px" src={data.coverUrl}/>
            <button aria-label="Cambiar favorito" onClick={toggleFavorite} type="button"><Bookmark fill={favorite ? "currentColor" : "none"} size={15}/></button>
          </div>
          <div className="anime-hero-copy">
            <div className="anime-title-row"><h1>{data.title}</h1></div>
            <p className="anime-romaji-title">{anime?.alternativeTitle}</p>
            <div className="anime-meta">
              <span><Tv size={11}/>{anime?.format ?? "ANIME"}</span>
              <span><CalendarDays size={11}/>{anime?.seasonYear ?? "TBA"}</span>
              <span><Clapperboard size={11}/>{data.episodeCount || "TBA"} episodios</span>
              <span>{anime?.duration ?? "TBA"} min</span>
              {anime?.averageScore && <span className="anime-score"><Star fill="currentColor" size={11}/>{(anime.averageScore / 10).toFixed(1)}</span>}
            </div>
            <div className="anime-genres">{data.genres.map((genre, index) => <span key={genre} style={{ "--genre-tone": genreTones[index % genreTones.length] } as CSSProperties}>{genre}</span>)}</div>
          </div>
        </section>

        <nav className="anime-tabs" aria-label="Secciones del anime">
          {tabs.map(({ label, icon: Icon }) => <button aria-current={tab === label ? "page" : undefined} className={tab === label ? "is-active" : undefined} key={label} onClick={() => setTab(label)} type="button"><Icon size={14}/>{label}</button>)}
        </nav>

        {tab === "Resumen" && <div className="anime-summary-grid">
          <div className="anime-summary-left">
            <section className="anime-panel anime-synopsis"><h2><Info size={15}/>Sinopsis</h2><p>{data.synopsis}</p></section>
            <section className="anime-panel anime-characters"><header><h2><UsersRound size={15}/>Personajes principales</h2><button onClick={() => setTab("Personajes")} type="button">Ver todos</button></header><div>{(anime?.characters ?? []).slice(0, 8).map((character) => <article className="anime-character-card" key={character.id}><div><Image alt={character.name} fill quality={90} sizes="100px" src={character.imageUrl}/></div><strong>{character.name}</strong><span>{character.role}</span></article>)}</div></section>
          </div>
          <section className="anime-panel anime-episodes"><header><h2><CalendarDays size={15}/>Episodios</h2><button onClick={() => setTab("Episodios")} type="button">Ver todos</button></header><div>{episodes.slice(0, 8).map((episode) => <article key={episode.number}><b>{episode.number}</b><img alt="" height={48} src={episode.thumbnailUrl} width={78}/><span><strong>{episode.title}</strong><small>{selectedContent?.title ?? data.title}</small></span>{episode.url ? <a aria-label={`Abrir ${episode.title}`} href={episode.url} rel="noreferrer noopener" target="_blank"><ExternalLink size={14}/></a> : <Clapperboard size={14}/>}</article>)}</div></section>
        </div>}

        {tab === "Episodios" && <section className="anime-panel anime-live-episodes-panel">
          <header><h2><CalendarDays size={15}/>Episodios por temporada y contenido</h2><span>{episodes.length} episodios</span></header>
          <div className="anime-content-selector">{data.contents.map((content) => <button aria-pressed={content.id === selectedContent?.id} className={content.id === selectedContent?.id ? "is-active" : undefined} key={content.id} onClick={() => setSelectedContentId(content.id)} type="button"><span>{typeLabel(content.type)}</span><strong>{content.title}</strong><small>{content.episodesWatched}/{content.episodeCount || "?"} vistos</small></button>)}</div>
          <div className="anime-episode-grid">{episodes.map((episode) => <article key={episode.number}><img alt="" height={92} src={episode.thumbnailUrl} width={150}/><div><small>Episodio {episode.number}</small><strong>{episode.title}</strong><span>{selectedContent?.title}</span></div>{episode.url && <a aria-label={`Abrir fuente oficial de ${episode.title}`} href={episode.url} rel="noreferrer noopener" target="_blank"><ExternalLink size={13}/></a>}</article>)}</div>
          {!episodes.length && <p className="anime-live-empty">Este contenido todavía no tiene episodios publicados.</p>}
        </section>}

        {tab === "Personajes" && <section className="anime-panel anime-live-grid">{(anime?.characters ?? []).map((character) => <article key={character.id}><Image alt={character.name} height={180} quality={90} sizes="130px" src={character.imageUrl} width={130}/><strong>{character.name}</strong><span>{character.role}</span></article>)}</section>}
        {(tab === "Recomendaciones" || tab === "Similares") && <section className="anime-panel anime-live-grid">{(tab === "Recomendaciones" ? anime?.recommendations : anime?.related)?.map((item) => <article key={item.id}><Image alt={item.title} height={180} quality={92} sizes="130px" src={item.coverUrl} width={130}/><strong>{item.title}</strong><span>{item.relation}{item.score ? ` · ${item.score.toFixed(1)}` : ""}</span></article>)}</section>}
        {tab === "Reseñas" && <section className="anime-panel anime-tab-placeholder"><MessageCircle size={21}/><h2>Reseñas de {data.title}</h2><p>Las reseñas reales de la comunidad aparecerán aquí conforme sean publicadas.</p></section>}
        {tab === "Datos" && <section className="anime-panel anime-tab-placeholder"><Database size={21}/><h2>Datos técnicos</h2><p>AniList ID: {anime?.id ?? "No vinculado"} · MyAnimeList ID: {anime?.idMal ?? "No vinculado"} · Popularidad: {anime?.popularity.toLocaleString("es-CO") ?? "N/D"}</p></section>}
      </main>

      <aside className="anime-detail-sidebar">
        <section className="anime-side-card anime-status-card">
          <h2><Play size={15}/>Mi estado</h2>
          <button className="anime-status-trigger" disabled={pending} onClick={() => setStatusDialogOpen(true)} type="button"><span><Play size={13}/>{labels[status]}</span><small>Cambiar estado</small></button>
          <div className="anime-current-episode"><span>Progreso</span><strong>{watched}<small> / {data.episodeCount || "?"}</small></strong></div>
          <div className="anime-live-progress-controls"><button aria-label="Restar episodio" disabled={pending || watched <= 0 || status === "completed"} onClick={() => setWatched((value) => Math.max(0, value - 1))} type="button"><Minus size={13}/></button><input aria-label="Episodios vistos" disabled={pending || status === "completed"} max={data.episodeCount || undefined} min="0" onChange={(event) => setWatched(Math.min(data.episodeCount || 10000, Number(event.target.value) || 0))} type="number" value={watched}/><button aria-label="Sumar episodio" disabled={pending || watched >= data.episodeCount || status === "completed"} onClick={() => setWatched((value) => Math.min(data.episodeCount, value + 1))} type="button"><Plus size={13}/></button></div>
          <button className="anime-primary-button" disabled={pending} onClick={saveProgress} type="button"><Save size={14}/>{pending ? "Guardando..." : "Guardar progreso"}</button>
        </section>

        <section className="anime-side-card anime-rating-card">
          <h2><Star size={15}/>Mi puntuación</h2><strong>{rating ? `${rating.toFixed(1)} / 10` : "Sin puntuar"}</strong>
          <div>{[2, 4, 6, 8, 10].map((score) => <button aria-label={`Abrir puntuación con ${score} de 10`} aria-pressed={Boolean(rating && rating >= score)} disabled={pending} key={score} onClick={() => setRatingDialogOpen(true)} type="button"><Star fill={rating && rating >= score ? "currentColor" : "none"} size={18}/></button>)}</div>
        </section>

        <section className="anime-side-card anime-info-card">
          <h2><Info size={15}/>Información general</h2>
          <dl><div><dt>Formato</dt><dd>{anime?.format ?? "Anime"}</dd></div><div><dt>Episodios</dt><dd>{data.episodeCount || "TBA"}</dd></div><div><dt>Duración</dt><dd>{anime?.duration ? `${anime.duration} min` : "TBA"}</dd></div><div><dt>Estado oficial</dt><dd>{anime?.status ?? "Sin informar"}</dd></div><div><dt>Temporada</dt><dd>{anime?.season ? `${anime.season} ${anime.seasonYear ?? ""}` : anime?.seasonYear ?? "TBA"}</dd></div><div><dt>Estudio</dt><dd>{anime?.studios?.[0] ?? "Sin informar"}</dd></div></dl>
        </section>

        <section className="anime-side-card anime-watch-card">
          <header><div><Play size={15}/><h2>Dónde ver</h2></div></header><p>Plataformas oficiales informadas por AniList.</p>
          <div>{(anime?.watchLinks ?? []).map((link, index) => {
            const tone = providerTone(link.provider, link.color);
            return <a href={link.url} key={`${link.url}-${index}`} rel="noreferrer noopener" style={{ "--provider-tone": tone } as CSSProperties} target="_blank"><ProviderMark provider={link.provider} tone={tone}/><span><strong>{link.provider}</strong><small>{link.language ?? "Disponibilidad regional"}</small></span><ExternalLink size={12}/></a>;
          })}</div>
        </section>

        <section className="anime-side-card anime-actions-card">
          <h2><Sparkles size={15}/>Acciones</h2>
          <button aria-pressed={favorite} className={favorite ? "is-favorite" : undefined} onClick={toggleFavorite} type="button"><Heart fill={favorite ? "currentColor" : "none"} size={15}/>{favorite ? "En favoritos" : "Añadir a favoritos"}</button>
          <button className="is-listed" disabled type="button"><Check size={15}/>En mi biblioteca</button>
          <Link href={`/anime/${data.slug}/temporadas`}><Layers3 size={15}/>Gestionar temporadas</Link>
          {data.canEdit && <Link href={`/agregar-anime/manual?draft=${data.franchiseId}`}><Tags size={15}/>Editar anime</Link>}
          <button onClick={async () => { await navigator.clipboard.writeText(window.location.href); setMessage("Enlace copiado."); }} type="button"><Share2 size={15}/>Compartir</button>
          <button className="is-danger" onClick={() => setDeleteDialogOpen(true)} type="button"><Trash2 size={15}/>Eliminar de mi biblioteca</button>
        </section>
        {message && <p className="anime-live-message" role="status"><Check size={13}/>{message}</p>}
      </aside>
    </div>
    {statusDialogOpen && <LiveStatusDialog anime={{ title: data.title, alternativeTitle: anime?.alternativeTitle, coverUrl: data.coverUrl, watched, total: data.episodeCount }} currentStatus={status} onClose={() => setStatusDialogOpen(false)} onSave={saveStatus}/>}
    {ratingDialogOpen && <LiveRatingDialog anime={{ title: data.title, alternativeTitle: anime?.alternativeTitle, coverUrl: data.coverUrl, watched, total: data.episodeCount }} averageScore={anime?.averageScore ? anime.averageScore / 10 : null} initialScore={rating ?? 0} onClose={() => setRatingDialogOpen(false)} onSave={persistRating}/>}
    {abandonDialogOpen && <LiveAbandonDialog anime={{ title: data.title, alternativeTitle: anime?.alternativeTitle, coverUrl: data.coverUrl, watched, total: data.episodeCount }} onClose={() => setAbandonDialogOpen(false)} onConfirm={confirmAbandon}/>}
    {deleteDialogOpen && <LiveDeleteDialog anime={{ title: data.title, alternativeTitle: anime?.alternativeTitle, coverUrl: data.coverUrl, watched, total: data.episodeCount }} favorite={favorite} onClose={() => setDeleteDialogOpen(false)} onConfirm={async () => { const result = await removeLibraryItemAction({ franchiseId: data.franchiseId }); setMessage(result.ok ? "Eliminado de tu biblioteca." : (result.message ?? "No pudimos eliminar el anime.")); if (result.ok) window.location.assign("/biblioteca"); return result.ok; }} rating={rating}/>}
  </div>;
}
