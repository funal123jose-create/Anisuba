"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition, type CSSProperties } from "react";
import {
  ArrowLeft, BarChart3, Bookmark, Check, ChevronRight, Clock3, Flame, Grid2X2,
  Heart, List, MoreVertical, Pause, Play, RefreshCw, Save, Search,
  SlidersHorizontal, Sparkles, Star, Trash2, X,
} from "lucide-react";
import type { LibraryData, LibraryItem, PersonalAnimeStatus } from "@/types/library";

type TrackingFilter = "all" | PersonalAnimeStatus;
type ActionResult = { ok: boolean; message?: string };
type TrackingPageProps = {
  data: LibraryData;
  isDemo: boolean;
  onFavoriteChange?: (input: { franchiseId: string; favorite: boolean }) => Promise<ActionResult>;
  onProgressChange?: (input: {
    franchiseId: string;
    status: PersonalAnimeStatus;
    episodesWatched: number;
  }) => Promise<ActionResult>;
  onRemove?: (input: { franchiseId: string }) => Promise<ActionResult>;
};

const statusConfig: Record<PersonalAnimeStatus, {
  label: string;
  tone: string;
  icon: typeof Play;
}> = {
  watching: { label: "Viendo actualmente", tone: "#3b82f6", icon: Play },
  plan_to_watch: { label: "Planeo ver", tone: "#8b5cf6", icon: Bookmark },
  caught_up: { label: "Al día", tone: "#22d3ee", icon: Check },
  paused: { label: "En pausa", tone: "#f59e0b", icon: Pause },
  completed: { label: "Completados", tone: "#22c55e", icon: Check },
  waiting_next_season: { label: "Esperando temporada", tone: "#f97316", icon: Clock3 },
  dropped: { label: "Abandonados", tone: "#f43f5e", icon: X },
};

const groupOrder: PersonalAnimeStatus[] = [
  "watching",
  "plan_to_watch",
  "completed",
  "paused",
  "dropped",
  "caught_up",
  "waiting_next_season",
];

function progress(item: LibraryItem) {
  return item.episodeCount
    ? Math.min(100, Math.round((item.episodesWatched / item.episodeCount) * 100))
    : 0;
}

function TrackingCard({
  item,
  compact,
  onFavoriteChange,
  onProgressChange,
  onRemove,
}: {
  item: LibraryItem;
  compact: boolean;
  onFavoriteChange?: TrackingPageProps["onFavoriteChange"];
  onProgressChange?: TrackingPageProps["onProgressChange"];
  onRemove?: TrackingPageProps["onRemove"];
}) {
  const config = statusConfig[item.status];
  const isWatching = item.status === "watching" || item.status === "caught_up";
  const [menuOpen, setMenuOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState(item.status);
  const [draftWatched, setDraftWatched] = useState(item.episodesWatched);
  const [favorite, setFavorite] = useState(item.isFavorite);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const saveProgress = () => {
    if (!onProgressChange) return;
    startTransition(async () => {
      const result = await onProgressChange({
        franchiseId: item.franchiseId,
        status: draftStatus,
        episodesWatched: draftWatched,
      });
      setMessage(result.ok ? "Progreso actualizado." : result.message ?? "No se pudo actualizar.");
      if (result.ok) window.location.reload();
    });
  };

  const toggleFavorite = () => {
    if (!onFavoriteChange) return;
    const next = !favorite;
    setFavorite(next);
    startTransition(async () => {
      const result = await onFavoriteChange({ franchiseId: item.franchiseId, favorite: next });
      if (!result.ok) {
        setFavorite(!next);
        setMessage(result.message ?? "No se pudo actualizar favoritos.");
      }
    });
  };

  const remove = () => {
    if (!onRemove) return;
    startTransition(async () => {
      const result = await onRemove({ franchiseId: item.franchiseId });
      setMessage(result.ok ? "Anime retirado." : result.message ?? "No se pudo retirar.");
      if (result.ok) window.location.reload();
    });
  };

  return (
    <article
      className={`tracking-card ${compact || !isWatching ? "is-compact" : ""}`}
      style={{ "--tracking-tone": config.tone } as CSSProperties}
    >
      <Image
        alt={`Portada de ${item.title}`}
        height={isWatching ? 232 : 144}
        quality={92}
        sizes={isWatching ? "86px" : "54px"}
        src={item.coverUrl}
        width={isWatching ? 172 : 108}
      />
      <div className="tracking-card-copy">
        <strong>{item.title}</strong>
        {isWatching && <small>{item.episodesWatched ? `Episodio ${item.episodesWatched} de ${item.episodeCount ?? "?"}` : "Pendiente de comenzar"}</small>}
        <span><Star fill="currentColor" size={10}/>{item.score?.toFixed(2) ?? "—"}</span>
        {isWatching
          ? <div className="tracking-card-progress"><i><span style={{ width: `${progress(item)}%` }}/></i><em>{progress(item)}%</em></div>
          : <b className="tracking-status-chip">{config.label}</b>}
      </div>
      {isWatching ? (
        <footer>
          <button onClick={() => { setMenuOpen(false); setEditorOpen(true); }} type="button"><RefreshCw size={11}/>Actualizar progreso</button>
          <Link href={`/anime/${item.slug}/temporadas`}>Ver detalle</Link>
          <button aria-expanded={menuOpen} aria-label={`Opciones de ${item.title}`} onClick={() => { setEditorOpen(false); setMenuOpen((current) => !current); }} type="button"><MoreVertical size={14}/></button>
        </footer>
      ) : (
        <button aria-expanded={menuOpen} aria-label={`Opciones de ${item.title}`} onClick={() => { setEditorOpen(false); setMenuOpen((current) => !current); }} type="button"><MoreVertical size={14}/></button>
      )}
      {menuOpen && (
        <div className="tracking-card-menu">
          <Link href={`/anime/${item.slug}/temporadas`}><List size={13}/>Ver detalle y temporadas</Link>
          <button onClick={() => { setMenuOpen(false); setEditorOpen(true); }} type="button"><RefreshCw size={13}/>Actualizar estado y progreso</button>
          <button onClick={toggleFavorite} type="button"><Heart fill={favorite ? "currentColor" : "none"} size={13}/>{favorite ? "Quitar de favoritos" : "Añadir a favoritos"}</button>
          <button className="is-danger" onClick={remove} type="button"><Trash2 size={13}/>Quitar de mi biblioteca</button>
        </div>
      )}
      {!menuOpen && editorOpen && (
        <div className="tracking-card-editor">
          <label>Estado<select onChange={(event) => {
            const next = event.target.value as PersonalAnimeStatus;
            setDraftStatus(next);
            if (next === "completed") setDraftWatched(item.episodeCount ?? 0);
            if (next === "plan_to_watch") setDraftWatched(0);
          }} value={draftStatus}>{groupOrder.map((status) => <option key={status} value={status}>{statusConfig[status].label}</option>)}</select></label>
          <label>Episodios vistos
            <span className="tracking-number-control">
              <button
                aria-label="Restar episodio"
                disabled={pending || draftStatus === "completed" || draftStatus === "plan_to_watch" || draftWatched <= 0}
                onClick={() => setDraftWatched((value) => Math.max(0, value - 1))}
                type="button"
              >−</button>
              <input
                max={item.episodeCount ?? undefined}
                min="0"
                onChange={(event) => setDraftWatched(Math.min(item.episodeCount ?? 10000, Number(event.target.value) || 0))}
                readOnly={draftStatus === "completed" || draftStatus === "plan_to_watch"}
                type="number"
                value={draftWatched}
              />
              <button
                aria-label="Sumar episodio"
                disabled={pending || draftStatus === "completed" || draftStatus === "plan_to_watch" || Boolean(item.episodeCount && draftWatched >= item.episodeCount)}
                onClick={() => setDraftWatched((value) => Math.min(item.episodeCount ?? value + 1, value + 1))}
                type="button"
              >+</button>
            </span>
          </label>
          <button className="tracking-save-progress" disabled={pending} onClick={saveProgress} type="button"><Save size={12}/>{pending ? "Guardando..." : "Guardar"}</button>
        </div>
      )}
      {message && <p className="tracking-card-message" role="status">{message}</p>}
    </article>
  );
}

export function TrackingPage({
  data,
  isDemo,
  onFavoriteChange,
  onProgressChange,
  onRemove,
}: TrackingPageProps) {
  const [filter, setFilter] = useState<TrackingFilter>("all");
  const [query, setQuery] = useState("");
  const [gridView, setGridView] = useState(true);
  const [carouselOffsets, setCarouselOffsets] = useState<Partial<Record<PersonalAnimeStatus, number>>>({});
  const [expandedGroup, setExpandedGroup] = useState<PersonalAnimeStatus | null>(null);

  const statuses = useMemo(() => [
    { id: "all" as const, label: "Todos", count: data.items.length, tone: "#a855f7", icon: Grid2X2 },
    ...groupOrder.map((status) => ({
      id: status,
      ...statusConfig[status],
      count: data.items.filter((item) => item.status === status).length,
    })),
  ], [data.items]);
  const groups = useMemo(() => groupOrder.map((status) => ({
    status,
    ...statusConfig[status],
    items: data.items.filter((item) => item.status === status),
  })).filter((group) => group.items.length > 0), [data.items]);
  const visibleGroups = useMemo(() => groups
    .filter((group) => filter === "all" || group.status === filter)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.title.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es"))),
    })), [filter, groups, query]);

  return <div className="tracking-page">
    <header><div><p>ORGANIZACIÓN PERSONAL</p><h1>Mi seguimiento</h1><span>Organiza y visualiza tus animes reales según tu estado personal.</span></div><div>{isDemo && <span className="demo-data-pill">Modo demo</span>}<Link className="tracking-back-link" href="/biblioteca"><ArrowLeft size={13}/>Volver a biblioteca</Link></div></header>
    <div className="tracking-layout">
      <main>
        <div className="tracking-toolbar"><label><Search size={15}/><input aria-label="Buscar en seguimiento" onChange={(event)=>setQuery(event.target.value)} placeholder="Buscar en mi seguimiento..." value={query}/></label><button type="button"><SlidersHorizontal size={14}/>Filtros</button><select aria-label="Ordenar seguimiento"><option>Última actividad</option><option>Título</option><option>Puntuación</option></select><div><button aria-label="Vista en cuadrícula" className={gridView?"is-active":undefined} onClick={()=>setGridView(true)} type="button"><Grid2X2 size={15}/></button><button aria-label="Vista en lista" className={!gridView?"is-active":undefined} onClick={()=>setGridView(false)} type="button"><List size={15}/></button></div></div>
        <nav className="tracking-filters" aria-label="Estados de seguimiento">{statuses.map(({id,label,count,tone,icon:Icon})=><button aria-current={filter===id?"page":undefined} className={filter===id?"is-active":undefined} key={id} onClick={()=>setFilter(id)} style={{"--tracking-tone":tone} as CSSProperties} type="button"><Icon size={13}/>{label}<span>{count}</span></button>)}</nav>
        <div className={`tracking-groups ${gridView?"":"is-list"}`}>{visibleGroups.map((group)=>{
          const isExpanded=expandedGroup===group.status;
          const offset=Math.min(carouselOffsets[group.status]??0,Math.max(0,group.items.length-4));
          const displayedItems=isExpanded?group.items:group.items.slice(offset,offset+4);
          return <section className={isExpanded?"is-expanded":undefined} key={group.status} style={{"--tracking-tone":group.tone} as CSSProperties}><header><h2><group.icon size={17}/>{group.label}<small>{group.items.length} animes</small></h2><button aria-expanded={isExpanded} onClick={()=>setExpandedGroup((current)=>current===group.status?null:group.status)} type="button">{isExpanded?"Ver menos":"Ver todos"}</button></header><div>{displayedItems.map((item)=><TrackingCard compact={!gridView} item={item} key={item.franchiseId} onFavoriteChange={onFavoriteChange} onProgressChange={onProgressChange} onRemove={onRemove}/>)}</div>{!isExpanded&&group.items.length>4&&<button aria-label={`Ver más de ${group.label}`} className="tracking-next" onClick={()=>setCarouselOffsets((current)=>({...current,[group.status]:((current[group.status]??0)+4>=group.items.length?0:(current[group.status]??0)+4)}))} type="button"><ChevronRight size={17}/></button>}</section>;
        })}{visibleGroups.length===0&&<section className="tracking-empty"><Search size={20}/><h2>No hay animes en este estado</h2><p>Prueba con otro filtro o agrega contenido desde Explorar.</p></section>}</div>
      </main>
      <aside className="tracking-aside">
        <section><h2 className="tracking-panel-title"><BarChart3 size={15}/>Resumen de mi biblioteca</h2><div className="tracking-summary"><div><small>Total en biblioteca</small><strong>{data.items.length}</strong><span>animes</span></div><i/></div><ul>{statuses.slice(1).map((status)=><li key={status.id}><i style={{background:status.tone}}/>{status.label}<strong>{status.count}</strong></li>)}</ul><Link href="/estadisticas"><BarChart3 size={14}/>Ver estadísticas completas</Link></section>
        <section><header><h2 className="tracking-panel-title"><Sparkles size={15}/>Actividad reciente</h2><Link className="tracking-see-all" href="/historial">Ver todo</Link></header>{data.recentlyUpdated.slice(0,5).map((item)=><article key={item.franchiseId}><Image alt="" height={38} quality={92} sizes="30px" src={item.coverUrl} width={30}/><div><strong>{item.title}</strong><small>{item.episodesWatched ? `Episodio ${item.episodesWatched}` : statusConfig[item.status].label}</small></div><span>{new Date(item.updatedAt).toLocaleDateString("es-CO",{day:"2-digit",month:"short"})}</span></article>)}</section>
        <section className="tracking-streak"><h2 className="tracking-panel-title"><Flame size={15}/>Actividad de seguimiento</h2><strong>{data.recentlyUpdated.length}</strong><p>Actualizaciones recientes</p><div>{[35,68,42,75,38,90,73].map((height,index)=><button aria-label={`Actividad del día ${index+1}`} key={index} type="button"><i style={{height:`${height}%`}}/><span>{["M","J","V","S","D","L","M"][index]}</span></button>)}</div></section>
      </aside>
    </div>
  </div>;
}
