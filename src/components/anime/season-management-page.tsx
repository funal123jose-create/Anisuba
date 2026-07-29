"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import {
  Bookmark,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CirclePlay,
  Clock3,
  ExternalLink,
  GitBranch,
  Grid2X2,
  Info,
  ImagePlus,
  Link2,
  List,
  ListChecks,
  MonitorPlay,
  MoreHorizontal,
  Pencil,
  PieChart,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Star,
  Trash2,
  Tv2,
} from "lucide-react";
import type { ManagedAnimeEntry, SeasonManagementData } from "@/lib/anime/season-management";
import { getEntryMarkerLabel } from "@/lib/anime/entry-labels";

type RowKind = "season" | "ova" | "movie";
type StatusKind = "completed" | "watching" | "waiting";

function seasonProviderTone(provider: string, fallback?: string | null) {
  const value = provider.toLocaleLowerCase();
  if (value.includes("youtube")) return "#ff453a";
  if (value.includes("crunchyroll")) return "#f97316";
  if (value.includes("bilibili")) return "#22d3ee";
  if (value.includes("iq") || value.includes("qiyi")) return "#22c55e";
  if (value.includes("netflix")) return "#ef4444";
  return fallback || "#a855f7";
}

function SeasonProviderMark({ provider, tone }: { provider: string; tone: string }) {
  const value = provider.toLocaleLowerCase();
  if (value.includes("youtube")) {
    return <svg aria-hidden="true" className="anime-provider-lucide" height="16" style={{ color: tone }} viewBox="0 0 24 24" width="16"><path d="M21.4 6.2a2.8 2.8 0 0 0-2-2C17.7 3.7 12 3.7 12 3.7s-5.7 0-7.4.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2.1 12a29 29 0 0 0 .5 5.8 2.8 2.8 0 0 0 2 2c1.7.5 7.4.5 7.4.5s5.7 0 7.4-.5a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .5-5.8 29 29 0 0 0-.5-5.8Z" fill="currentColor"/><path d="m10 15.5 5-3.5-5-3.5v7Z" fill="#0e1421"/></svg>;
  }
  if (value.includes("crunchyroll")) return <span aria-hidden="true" className="anime-provider-crunchyroll" style={{ color: tone }}><i /></span>;
  if (value.includes("bilibili")) return <MonitorPlay aria-hidden="true" className="anime-provider-lucide" size={16} style={{ color: tone }} />;
  if (value.includes("iq") || value.includes("qiyi")) return <span aria-hidden="true" className="anime-provider-wordmark" style={{ color: tone }}>iQIYI</span>;
  return <Link2 aria-hidden="true" className="anime-provider-lucide" size={15} style={{ color: tone }} />;
}

const seasonRows = [
  {id:"1",kind:"season" as RowKind,title:"Temporada 1",type:"TV",year:"2023",detail:"Episodios: 12  ·  24 min c/u",seen:"12",total:"12",progress:100,status:"Completado",statusKind:"completed" as StatusKind,tone:"#8b5cf6",image:"/images/anime-eclipse-cover-v2.png"},
  {id:"2",kind:"season" as RowKind,title:"Temporada 2",type:"TV",year:"2024",detail:"Episodios: 12  ·  24 min c/u",seen:"8",total:"12",progress:67,status:"Viendo",statusKind:"watching" as StatusKind,tone:"#3b82f6",image:"https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145064-hSNRJM03pvv1.jpg"},
  {id:"OVA",kind:"ova" as RowKind,title:"OVAs",type:"OVA",year:"2023",detail:"Episodios: 3  ·  24 min c/u",seen:"3",total:"3",progress:100,status:"Completado",statusKind:"completed" as StatusKind,tone:"#8b5cf6",image:"https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145139-rRimpHGWLhym.png"},
  {id:"PEL",kind:"movie" as RowKind,title:"Película",type:"Película",year:"2025",detail:"Duración: 1h 48m",seen:"1",total:"1",progress:100,status:"Completado",statusKind:"completed" as StatusKind,tone:"#f59e0b",image:"https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg"},
  {id:"3",kind:"season" as RowKind,title:"Próxima temporada",type:"TV",year:"2026 (Próx.)",detail:"Episodios: TBA  ·  24 min c/u",seen:"0",total:"?",progress:0,status:"Esperando temporada",statusKind:"waiting" as StatusKind,tone:"#f59e0b",image:"/images/anime-eclipse-hero-v1.png"},
];

const genres = ["Acción","Fantasía","Sci-Fi","Aventura","Seinen"];

function StatusIcon({ kind, size = 14 }: { kind: StatusKind; size?: number }) {
  if(kind==="completed") return <CheckCheck size={size}/>;
  if(kind==="watching") return <CirclePlay size={size}/>;
  return <Clock3 size={size}/>;
}

type SeasonManagementPageProps = {
  data?: SeasonManagementData;
  onSaveEntry?: (formData: FormData) => void | Promise<void>;
  onDeleteEntry?: (formData: FormData) => void | Promise<void>;
  onSyncAniList?: (formData: FormData) => void | Promise<void>;
  onUpdateProgress?: (formData: FormData) => void | Promise<void>;
};

function managedRow(entry: ManagedAnimeEntry, entries: ManagedAnimeEntry[]) {
  const total = entry.episodeCount;
  const progress = total > 0
    ? Math.min(100, Math.round((entry.episodesWatched / total) * 100))
    : 0;
  const statusKind: StatusKind = progress === 100
    ? "completed"
    : progress > 0
      ? "watching"
      : "waiting";
  const kind: RowKind = entry.entryType === "movie" ? "movie"
    : entry.entryType === "ova" || entry.entryType === "special" ? "ova"
      : "season";
  const tone = statusKind === "watching"
    ? "#22d3ee"
    : statusKind === "waiting"
      ? "#f43f5e"
      : kind === "movie"
        ? "#3b82f6"
        : kind === "ova"
          ? "#f59e0b"
          : "#8b5cf6";
  return {
    id: getEntryMarkerLabel(entry, entries),
    entryId: entry.id,
    kind,
    title: entry.title,
    type: entry.entryType === "season" ? "TV" : entry.entryType.toUpperCase(),
    year: entry.releaseYear ? String(entry.releaseYear) : "TBA",
    detail: entry.entryType === "movie"
      ? `Duración: ${entry.episodeDurationMinutes || "TBA"} min`
      : `Episodios: ${total || "TBA"} · ${entry.episodeDurationMinutes || "TBA"} min c/u`,
    seen: String(entry.episodesWatched),
    total: total ? String(total) : "?",
    progress,
    status: progress === 100 ? "Completado" : progress > 0 ? "Viendo" : "Sin comenzar",
    statusKind,
    tone,
    image: entry.coverUrl,
    source: entry,
  };
}

export function SeasonManagementPage({
  data,
  onDeleteEntry,
  onSaveEntry,
  onSyncAniList,
  onUpdateProgress,
}: SeasonManagementPageProps = {}){
  const [filter,setFilter]=useState("Todas");
  const [listView,setListView]=useState(true);
  const [editingEntryId,setEditingEntryId]=useState<string|null>(null);
  const [personalStatus,setPersonalStatus]=useState<ManagedAnimeEntry["personalStatus"]>("not_started");
  const [episodeCount,setEpisodeCount]=useState(12);
  const [watchEntryId,setWatchEntryId]=useState<string|null>(null);
  const [progressEntryId,setProgressEntryId]=useState<string|null>(null);
  const [progressDraft,setProgressDraft]=useState(0);
  const rows = data
    ? data.entries.map((entry) => managedRow(entry, data.entries))
    : seasonRows.map((row) => ({ ...row, entryId: undefined, source: undefined }));
  const visible=rows.filter(row=>filter==="Todas"||filter==="Temporadas"&&row.type==="TV"||filter==="OVA/Especiales"&&(row.type==="OVA"||row.type==="SPECIAL")||filter==="Películas"&&(row.type==="MOVIE"||row.type==="Película"));
  const title = data?.title ?? "Eclipse del Vacío";
  const coverUrl = data?.coverUrl ?? "/images/anime-eclipse-cover-v2.png";
  const bannerUrl = data?.bannerUrl ?? "/images/anime-eclipse-hero-v1.png";
  const totalEpisodes = rows.reduce((sum, row) => sum + (Number(row.total) || 0), 0);
  const watchedEpisodes = rows.reduce((sum, row) => sum + (Number(row.seen) || 0), 0);
  const completedEntries = rows.filter((row) => row.statusKind === "completed").length;
  const watchingEntries = rows.filter((row) => row.statusKind === "watching").length;
  const waitingEntries = rows.filter((row) => row.statusKind === "waiting").length;
  const nextEntry = rows.find((row) => row.statusKind === "watching")
    ?? rows.find((row) => row.statusKind === "waiting");
  const editingEntry = data?.entries.find((entry) => entry.id === editingEntryId);
  const overallProgress = totalEpisodes > 0
    ? Math.round((watchedEpisodes / totalEpisodes) * 100)
    : 0;

  return <div className="season-page">
    <p className="season-breadcrumb">Inicio <ChevronRight size={12}/> {title} <ChevronRight size={12}/> Gestión de temporadas</p>

    <div className="season-layout">
      <main>
        <section className="season-hero">
          <Image alt="" fill priority quality={92} sizes="(max-width: 1250px) 100vw, 75vw" src={bannerUrl}/>
          <div/>
          <div className="season-cover">
            <Image alt={title} height={220} quality={92} sizes="160px" src={coverUrl} width={160}/>
            <button aria-label="Anime guardado" type="button"><Bookmark fill="currentColor" size={16}/></button>
          </div>
          <div className="season-identity">
            <h1>{title}</h1>
            <p>{data?.alternativeTitle || "Catálogo AniSuba"}</p>
            <span>{data ? `${data.entries.length} contenido${data.entries.length === 1 ? "" : "s"} relacionado${data.entries.length === 1 ? "" : "s"}` : "Kokuu no Ekuripusu"}</span>
            <div className="season-meta"><b><Tv2 size={12}/>TV</b><b>{rows[0]?.year ?? "TBA"}</b><b>{totalEpisodes} episodios</b><b>{rows[0]?.source?.episodeDurationMinutes || 24} min</b>{!data&&<b><Star fill="currentColor" size={12}/>8.74 (12,458)</b>}</div>
            <div className="season-genres">{(data?.genres.length ? data.genres : genres).map((genre,index)=><span key={genre} style={{"--genre-index":index} as CSSProperties}>{genre}</span>)}</div>
          </div>
          <aside>
            <p>{data?.synopsis || "En un mundo donde el vacío amenaza con consumir todo a su paso, un joven que ha perdido sus recuerdos descubre un poder capaz de alterar el destino."}</p>
            <Link href={data ? `/anime/${data.slug}` : "/anime/eclipse-del-vacio"}>Ver detalles del anime<ChevronRight size={13}/></Link>
          </aside>
        </section>

        <div className="season-toolbar">
          <nav>{["Todas","Temporadas","OVA/Especiales","Películas"].map(value=><button className={filter===value?"is-active":undefined} key={value} onClick={()=>setFilter(value)} type="button">{value}</button>)}</nav>
          {data?.sourceName === "anilist" && onSyncAniList && <form action={onSyncAniList} className="season-anilist-sync"><input name="franchiseId" type="hidden" value={data.franchiseId}/><input name="routeSlug" type="hidden" value={data.slug}/><button type="submit"><RefreshCw size={13}/>Sincronizar tracking</button></form>}
          <select aria-label="Ordenar temporadas"><option>Ordenar: Orden de lanzamiento</option></select>
          <div><button aria-label="Vista en lista" className={listView?"is-active":undefined} onClick={()=>setListView(true)} type="button"><List size={15}/></button><button aria-label="Vista en cuadrícula" className={!listView?"is-active":undefined} onClick={()=>setListView(false)} type="button"><Grid2X2 size={15}/></button></div>
        </div>

        {data?.canEdit && onSaveEntry && (
          <details className="season-entry-editor" open={editingEntry ? true : undefined}>
            <summary onClick={() => {
              setEditingEntryId(null);
              setPersonalStatus("not_started");
              setEpisodeCount(12);
            }}><Plus size={15}/>{editingEntry ? `Editar ${editingEntry.title}` : "Añadir temporada o contenido"}</summary>
            <form action={onSaveEntry} key={editingEntry?.id ?? "new"}>
              <input name="franchiseId" type="hidden" value={data.franchiseId}/>
              <input name="entryId" type="hidden" value={editingEntry?.id ?? ""}/>
              <input name="routeSlug" type="hidden" value={data.slug}/>
              <input name="sequenceNumber" type="hidden" value={editingEntry?.sequenceNumber ?? data.entries.length + 1}/>
              <label>Título<input defaultValue={editingEntry?.title} name="title" placeholder="Ej. Temporada 2" required/></label>
              <label>Tipo<select name="entryType" defaultValue={editingEntry?.entryType ?? "season"}><option value="season">Temporada</option><option value="movie">Película</option><option value="ova">OVA</option><option value="special">Especial</option></select></label>
              <label>Episodios<input min="0" name="episodeCount" onChange={(event)=>setEpisodeCount(Number(event.target.value) || 0)} required type="number" value={episodeCount}/></label>
              <label>Minutos por episodio<input defaultValue={editingEntry?.episodeDurationMinutes || 24} min="1" name="episodeDurationMinutes" type="number"/></label>
              <label>Año<input defaultValue={editingEntry?.releaseYear ?? ""} min="1900" name="releaseYear" type="number"/></label>
              <label>Estado oficial<select defaultValue={editingEntry?.officialStatus || "Próximamente"} name="officialStatus"><option>En emisión</option><option>Finalizado</option><option>Próximamente</option><option>Pausado</option></select><small>Situación de publicación; no representa tu progreso.</small></label>
              <label>Estado personal<select name="personalStatus" onChange={(event)=>setPersonalStatus(event.target.value as ManagedAnimeEntry["personalStatus"])} value={personalStatus}><option value="not_started">Sin comenzar</option><option value="watching">Viendo</option><option value="completed">Completado</option></select></label>
              <label>Episodios vistos
                {personalStatus === "watching"
                  ? <input defaultValue={editingEntry?.personalStatus === "watching" ? editingEntry.episodesWatched : 0} min="0" name="episodesWatched" type="number"/>
                  : <>
                    <input aria-describedby="episodes-watched-help" disabled min="0" type="number" value={personalStatus === "completed" ? episodeCount : 0}/>
                    <input name="episodesWatched" type="hidden" value="0"/>
                  </>}
                <small id="episodes-watched-help">{personalStatus === "completed" ? "Se registrará automáticamente el total." : personalStatus === "not_started" ? "Se mantiene en 0 hasta que comiences a verlo." : "Indica cuántos episodios has visto."}</small>
              </label>
              <label className="season-cover-field">
                <span><ImagePlus size={14}/>Portada propia</span>
                <input accept="image/jpeg,image/png,image/webp" name="coverFile" type="file"/>
                <small>PNG, JPG o WEBP · Máximo 5 MB. Si no subes una, se usará la portada general.</small>
              </label>
              <p className="season-order-note">La posición cronológica se asigna internamente según el orden de registro.</p>
              <button type="submit">{editingEntry ? <Pencil size={14}/>:<Plus size={14}/>} {editingEntry ? "Guardar cambios" : "Guardar contenido"}</button>
            </form>
          </details>
        )}

        <section className={`season-timeline ${listView?"":"is-grid"}`}>
          {visible.map(row=><article key={row.id} style={{"--season-tone":row.tone} as CSSProperties}>
            <b className={`season-marker is-${row.kind}`}>{row.id}</b>
            <div className="season-entry">
              <Image alt={row.title} height={110} quality={90} src={row.image} width={165}/>
              <div><h2>{row.title}</h2><p><span>{row.type}</span><b>{row.year}</b></p><small>{row.detail}</small></div>
            </div>
            <div className="season-progress"><small>PROGRESO</small><strong>{row.seen} <span>/ {row.total}</span></strong><div><i><span style={{width:`${row.progress}%`}}/></i><em>{row.progress}%</em></div></div>
            <div className={`season-status is-${row.statusKind}`}><small>ESTADO PERSONAL</small><strong><StatusIcon kind={row.statusKind}/>{row.status}</strong></div>
            <div className="season-actions"><small>ACCIONES</small><span><button aria-expanded={watchEntryId===row.entryId} aria-label={`Dónde ver ${row.title}`} disabled={!row.source?.watchLinks.length} onClick={() => setWatchEntryId((current) => current === row.entryId ? null : row.entryId ?? null)} title={row.source?.watchLinks.length ? "Abrir plataformas oficiales" : "AniList no informa una plataforma oficial"} type="button"><Play size={15}/></button>{row.entryId&&onUpdateProgress&&<button aria-expanded={progressEntryId===row.entryId} aria-label={`Actualizar progreso de ${row.title}`} onClick={() => {setProgressEntryId((current)=>current===row.entryId?null:row.entryId??null);setProgressDraft(Number(row.seen)||0);}} type="button"><ListChecks size={15}/></button>}{data?.canEdit&&row.entryId?<button aria-label={`Editar ${row.title}`} onClick={()=>{
              setEditingEntryId(row.entryId ?? null);
              setPersonalStatus(row.source?.personalStatus ?? "not_started");
              setEpisodeCount(row.source?.episodeCount ?? 0);
            }} type="button"><Pencil size={15}/></button>:<button aria-label={`Opciones de ${row.title}`} type="button"><MoreHorizontal size={15}/></button>}{data?.canEdit&&onDeleteEntry&&row.entryId?<form action={onDeleteEntry}><input name="franchiseId" type="hidden" value={data.franchiseId}/><input name="entryId" type="hidden" value={row.entryId}/><input name="routeSlug" type="hidden" value={data.slug}/><button aria-label={data.entries[0]?.id===row.entryId?`${row.title} es la entrada principal y no se elimina por separado`:`Eliminar ${row.title}`} disabled={data.entries[0]?.id===row.entryId} title={data.entries[0]?.id===row.entryId?"La entrada principal se elimina desde las opciones generales del anime.":`Eliminar ${row.title}`} type="submit"><Trash2 size={15}/></button></form>:null}</span></div>
            {watchEntryId===row.entryId&&row.source?.watchLinks.length?<div className="season-row-popover is-watch"><strong><Play size={14}/>Dónde ver oficialmente</strong><p>La disponibilidad puede variar según tu región.</p><div>{row.source.watchLinks.map((link)=>{const tone=seasonProviderTone(link.provider,link.color);return <a href={link.url} key={`${row.entryId}-${link.provider}`} rel="noreferrer noopener" style={{"--provider-tone":tone} as CSSProperties} target="_blank"><SeasonProviderMark provider={link.provider} tone={tone}/><span>{link.provider}</span>{link.language&&<small>{link.language}</small>}<ExternalLink size={12}/></a>})}</div></div>:null}
            {progressEntryId===row.entryId&&row.entryId&&data&&onUpdateProgress?<form action={onUpdateProgress} className="season-row-popover is-progress"><input name="franchiseId" type="hidden" value={data.franchiseId}/><input name="entryId" type="hidden" value={row.entryId}/><input name="routeSlug" type="hidden" value={data.slug}/><strong><ListChecks size={14}/>Actualizar progreso</strong><div><button aria-label="Restar episodio" onClick={()=>setProgressDraft((value)=>Math.max(0,value-1))} type="button">−</button><input aria-label={`Episodios vistos de ${row.title}`} max={Number(row.total)||undefined} min="0" name="episodesWatched" onChange={(event)=>setProgressDraft(Number(event.target.value)||0)} type="number" value={progressDraft}/><button aria-label="Sumar episodio" onClick={()=>setProgressDraft((value)=>Math.min(Number(row.total)||value+1,value+1))} type="button">+</button><button type="submit">Guardar progreso</button></div></form>:null}
          </article>)}
        </section>
      </main>

      <aside className="season-aside">
        <section>
          <h2><PieChart size={15}/>Resumen de la franquicia</h2>
          <div className="season-summary"><i style={{"--season-progress":`${overallProgress * 3.6}deg`} as CSSProperties}/><strong>{overallProgress}%<small>Progreso general</small></strong></div>
          <div className="season-summary-metrics"><span>EPISODIOS VISTOS<strong>{watchedEpisodes} / {totalEpisodes}</strong></span><span>CONTENIDOS<strong>{rows.length}<small>registrados</small></strong></span></div>
          <ul>{[["Completado",String(completedEntries),"#22c55e"],["Viendo",String(watchingEntries),"#3b82f6"],["Sin comenzar",String(waitingEntries),"#f59e0b"]].map(([label,value,tone])=><li key={label}><i style={{background:tone}}/>{label}<strong>{value}</strong></li>)}</ul>
          <p className="season-total">Total episodios <strong>{totalEpisodes}</strong></p>
        </section>

        <section>
          <h2><Sparkles size={15}/>Siguiente recomendado</h2>
          {nextEntry ? <article className="season-next"><Image alt={nextEntry.title} height={80} quality={92} sizes="58px" src={nextEntry.image} width={58}/><div><strong>{nextEntry.title}</strong><span>{nextEntry.statusKind === "watching" ? "Continuar viendo" : "Pendiente de comenzar"}</span><b>{nextEntry.total === "?" ? "Fecha por anunciar" : `Episodio ${Math.min(Number(nextEntry.seen) + 1, Number(nextEntry.total))}`}</b><button type="button">Continuar<Play size={12}/></button></div></article>:<p className="season-all-complete"><CheckCheck size={14}/>Todo el contenido está completado.</p>}
        </section>

        <section className="season-flow">
          <h2><GitBranch size={15}/>Flujo de continuidad</h2>
          <ol>{rows.map((row,index)=><li key={row.id}>
            <div><span className={`is-${row.statusKind}`}><StatusIcon kind={row.statusKind} size={13}/></span><strong>{row.title}</strong><small>{row.kind==="movie"?`${row.source?.episodeDurationMinutes || "TBA"} min`:row.total==="?"?"TBA":`${row.seen} / ${row.total} episodios`}</small><StatusIcon kind={row.statusKind} size={13}/></div>
            {index<rows.length-1&&<ChevronDown aria-hidden="true" className="season-flow-arrow" size={14}/>}
          </li>)}</ol>
          <p><Info size={13}/>Sigue el orden recomendado para mejorar tu experiencia de la historia.</p>
        </section>
      </aside>
    </div>
  </div>;
}
