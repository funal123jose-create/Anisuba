"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import {
  BarChart3, Bookmark, Check, ChevronRight, Clock3, Flame, Grid2X2,
  List, MoreVertical, Pause, Play, RefreshCw, Search, SlidersHorizontal, Star, X,
} from "lucide-react";
import { libraryDemoData } from "@/data/mock/library";
import type { LibraryItem, PersonalAnimeStatus } from "@/types/library";

type TrackingFilter = "all" | PersonalAnimeStatus;

const trackingStatuses: Array<{ id: TrackingFilter; label: string; count: number; tone: string; icon: typeof Play }> = [
  { id: "all", label: "Todos", count: 146, tone: "#a855f7", icon: Grid2X2 },
  { id: "watching", label: "Viendo actualmente", count: 12, tone: "#3b82f6", icon: Play },
  { id: "plan_to_watch", label: "Planeo ver", count: 28, tone: "#8b5cf6", icon: Bookmark },
  { id: "caught_up", label: "Al día", count: 15, tone: "#22d3ee", icon: Check },
  { id: "paused", label: "En pausa", count: 17, tone: "#f59e0b", icon: Pause },
  { id: "completed", label: "Completado", count: 42, tone: "#22c55e", icon: Check },
  { id: "waiting_next_season", label: "Esperando temporada", count: 20, tone: "#f97316", icon: Clock3 },
  { id: "dropped", label: "Abandonado", count: 12, tone: "#f43f5e", icon: X },
];

function repeatItems(status: PersonalAnimeStatus, count: number) {
  const source = libraryDemoData.items.filter((item) => item.status === status);
  const fallback = [...source, ...libraryDemoData.items.filter((item) => item.status !== status)];
  return Array.from({ length: count }, (_, index) => {
    const item = fallback[index % fallback.length];
    return { ...item, franchiseId: `${status}-${item.franchiseId}-${index}`, status };
  });
}

const groups: Array<{ status: PersonalAnimeStatus; title: string; count: number; tone: string; icon: typeof Play; items: LibraryItem[] }> = [
  { status: "watching", title: "Viendo actualmente", count: 12, tone: "#3b82f6", icon: Play, items: repeatItems("watching", 8) },
  { status: "plan_to_watch", title: "Planeo ver", count: 28, tone: "#8b5cf6", icon: Bookmark, items: repeatItems("plan_to_watch", 8) },
  { status: "completed", title: "Completados", count: 42, tone: "#22c55e", icon: Check, items: repeatItems("completed", 8) },
  { status: "paused", title: "En pausa", count: 17, tone: "#f59e0b", icon: Pause, items: repeatItems("paused", 8) },
  { status: "dropped", title: "Abandonados", count: 12, tone: "#f43f5e", icon: X, items: repeatItems("dropped", 8) },
];

function TrackingCard({ item, tone, status, compact = false }: { item: LibraryItem; tone: string; status: PersonalAnimeStatus; compact?: boolean }) {
  const progress = item.episodeCount ? Math.round((item.episodesWatched / item.episodeCount) * 100) : 0;
  const isWatching=status==="watching";
  const statusLabel=trackingStatuses.find((entry)=>entry.id===status)?.label??status;
  return <article className={`tracking-card ${compact||!isWatching ? "is-compact" : ""}`} style={{ "--tracking-tone": tone } as CSSProperties}><Image alt={`Portada de ${item.title}`} height={isWatching?232:144} quality={90} sizes={isWatching?"86px":"54px"} src={item.coverUrl} width={isWatching?172:108}/><div className="tracking-card-copy"><strong>{item.title}</strong>{isWatching&&<small>{item.episodesWatched ? `Episodio ${item.episodesWatched} de ${item.episodeCount}` : "Pendiente de comenzar"}</small>}<span><Star fill="currentColor" size={10}/>{item.score?.toFixed(2) ?? "—"}</span>{isWatching?<div className="tracking-card-progress"><i><span style={{width:`${progress}%`}}/></i><em>{progress}%</em></div>:<b className="tracking-status-chip">{statusLabel}</b>}</div>{isWatching?<footer><button type="button"><RefreshCw size={11}/>Actualizar progreso</button><Link href="/anime/eclipse-del-vacio">Ver detalle</Link><button aria-label={`Opciones de ${item.title}`} type="button"><MoreVertical size={14}/></button></footer>:<button aria-label={`Opciones de ${item.title}`} type="button"><MoreVertical size={14}/></button>}</article>;
}

export function TrackingPage() {
  const [filter, setFilter] = useState<TrackingFilter>("all");
  const [query, setQuery] = useState("");
  const [gridView, setGridView] = useState(true);
  const [carouselOffsets, setCarouselOffsets] = useState<Partial<Record<PersonalAnimeStatus, number>>>({});
  const [expandedGroup, setExpandedGroup] = useState<PersonalAnimeStatus | null>(null);
  const visibleGroups = useMemo(() => groups.filter((group) => filter === "all" || group.status === filter).map((group) => ({...group,items:group.items.filter((item)=>item.title.toLowerCase().includes(query.toLowerCase()))})),[filter,query]);
  const advanceCarousel = (status: PersonalAnimeStatus, itemCount: number) => {
    setCarouselOffsets((current) => {
      const currentOffset = current[status] ?? 0;
      const nextOffset = currentOffset + 4 >= itemCount ? 0 : currentOffset + 4;
      return { ...current, [status]: nextOffset };
    });
  };

  return <div className="tracking-page">
    <header><div><p>ORGANIZACIÓN PERSONAL</p><h1>Mi seguimiento</h1><span>Organiza y visualiza todos tus animes según tu estado personal.</span></div><Link href="/biblioteca">Volver a biblioteca</Link></header>
    <div className="tracking-layout">
      <main>
        <div className="tracking-toolbar"><label><Search size={15}/><input aria-label="Buscar en seguimiento" onChange={(event)=>setQuery(event.target.value)} placeholder="Buscar en mi seguimiento..." value={query}/></label><button type="button"><SlidersHorizontal size={14}/>Filtros</button><select aria-label="Ordenar seguimiento"><option>Última actividad</option><option>Título</option><option>Puntuación</option></select><div><button aria-label="Vista en cuadrícula" className={gridView?"is-active":undefined} onClick={()=>setGridView(true)} type="button"><Grid2X2 size={15}/></button><button aria-label="Vista en lista" className={!gridView?"is-active":undefined} onClick={()=>setGridView(false)} type="button"><List size={15}/></button></div></div>
        <nav className="tracking-filters" aria-label="Estados de seguimiento">{trackingStatuses.map(({id,label,count,tone,icon:Icon})=><button aria-current={filter===id?"page":undefined} className={filter===id?"is-active":undefined} key={id} onClick={()=>setFilter(id)} style={{"--tracking-tone":tone} as CSSProperties} type="button"><Icon size={13}/>{label}<span>{count}</span></button>)}</nav>
        <div className={`tracking-groups ${gridView?"":"is-list"}`}>{visibleGroups.map((group)=>{
          const isExpanded=expandedGroup===group.status;
          const offset=Math.min(carouselOffsets[group.status]??0,Math.max(0,group.items.length-4));
          const displayedItems=isExpanded?group.items:group.items.slice(offset,offset+4);
          return <section className={isExpanded?"is-expanded":undefined} key={group.status} style={{"--tracking-tone":group.tone} as CSSProperties}><header><h2><group.icon size={17}/>{group.title}<small>{group.count} animes</small></h2><button aria-expanded={isExpanded} onClick={()=>setExpandedGroup((current)=>current===group.status?null:group.status)} type="button">{isExpanded?"Ver menos":"Ver todos"}</button></header><div>{displayedItems.map((item)=><TrackingCard compact={!gridView} item={item} key={item.franchiseId} status={group.status} tone={group.tone}/>)}</div>{!isExpanded&&group.items.length>4&&<button aria-label={`Ver más de ${group.title}`} className="tracking-next" onClick={()=>advanceCarousel(group.status,group.items.length)} type="button"><ChevronRight size={17}/></button>}</section>;
        })}</div>
      </main>
      <aside className="tracking-aside">
        <section><h2>Resumen de mi biblioteca</h2><div className="tracking-summary"><div><small>Total en biblioteca</small><strong>146</strong><span>animes</span></div><i/></div><ul>{trackingStatuses.slice(1).map((status)=><li key={status.id}><i style={{background:status.tone}}/>{status.label}<strong>{status.count}</strong></li>)}</ul><Link href="/estadisticas"><BarChart3 size={14}/>Ver estadísticas completas</Link></section>
        <section><header><h2>Actividad reciente</h2><button type="button">Ver todo</button></header>{libraryDemoData.items.slice(0,5).map((item,index)=>{const activity=[`Viste episodio ${item.episodesWatched}`,"Viste episodio 14","Estado cambiado a","Viste episodio 18","Marcado como"][index];const badge=["Hace 2h","Hace 5h","En pausa","Ayer","Completado"][index];return <article key={item.franchiseId}><Image alt="" height={38} src={item.coverUrl} width={30}/><div><strong>{item.title}</strong><small>{activity}</small></div><span className={index===2?"is-paused":index===4?"is-completed":undefined}>{badge}</span></article>;})}</section>
        <section className="tracking-streak"><h2><Flame size={16}/>Racha de seguimiento</h2><strong>23 días</strong><p>¡Sigue así!</p><div>{[35,68,42,75,38,90,73].map((height,index)=><button aria-label={`Actividad del día ${index+1}`} key={index} type="button"><i style={{height:`${height}%`}}/><span>{["M","J","V","S","D","L","M"][index]}</span></button>)}</div></section>
      </aside>
    </div>
  </div>;
}
