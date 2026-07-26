"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import {
  Bell,
  Bookmark,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CirclePlay,
  Clock3,
  GitBranch,
  Grid2X2,
  Info,
  List,
  ListChecks,
  MoreHorizontal,
  PieChart,
  Play,
  Sparkles,
  Star,
  Tv2,
} from "lucide-react";

type RowKind = "season" | "ova" | "movie";
type StatusKind = "completed" | "watching" | "waiting";

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

export function SeasonManagementPage(){
  const [filter,setFilter]=useState("Todas");
  const [listView,setListView]=useState(true);
  const visible=seasonRows.filter(row=>filter==="Todas"||filter==="Temporadas"&&row.type==="TV"||filter==="OVA/Especiales"&&row.type==="OVA"||filter==="Películas"&&row.type==="Película");

  return <div className="season-page">
    <p className="season-breadcrumb">Inicio <ChevronRight size={12}/> Eclipse del Vacío <ChevronRight size={12}/> Gestión de temporadas</p>

    <div className="season-layout">
      <main>
        <section className="season-hero">
          <Image alt="" fill priority sizes="(max-width: 1250px) 100vw, 75vw" src="/images/anime-eclipse-hero-v1.png"/>
          <div/>
          <div className="season-cover">
            <Image alt="Eclipse del Vacío" height={220} src="/images/anime-eclipse-cover-v2.png" width={160}/>
            <button aria-label="Anime guardado" type="button"><Bookmark fill="currentColor" size={16}/></button>
          </div>
          <div className="season-identity">
            <h1>Eclipse del Vacío</h1>
            <p>虚空のエクリプス</p>
            <span>Kokuu no Ekuripusu</span>
            <div className="season-meta"><b><Tv2 size={12}/>TV</b><b>2023</b><b>24 episodios</b><b>24 min</b><b><Star fill="currentColor" size={12}/>8.74 (12,458)</b></div>
            <div className="season-genres">{genres.map((genre,index)=><span key={genre} style={{"--genre-index":index} as CSSProperties}>{genre}</span>)}</div>
          </div>
          <aside>
            <p>En un mundo donde el vacío amenaza con consumir todo a su paso, un joven que ha perdido sus recuerdos descubre un poder capaz de alterar el destino. Mientras busca respuestas sobre su origen, se verá envuelto en una guerra entre dimensiones y secretos que podrían cambiar el universo para siempre.</p>
            <Link href="/anime/eclipse-del-vacio">Ver detalles del anime<ChevronRight size={13}/></Link>
          </aside>
        </section>

        <div className="season-toolbar">
          <nav>{["Todas","Temporadas","OVA/Especiales","Películas"].map(value=><button className={filter===value?"is-active":undefined} key={value} onClick={()=>setFilter(value)} type="button">{value}</button>)}</nav>
          <select aria-label="Ordenar temporadas"><option>Ordenar: Orden de lanzamiento</option></select>
          <div><button aria-label="Vista en lista" className={listView?"is-active":undefined} onClick={()=>setListView(true)} type="button"><List size={15}/></button><button aria-label="Vista en cuadrícula" className={!listView?"is-active":undefined} onClick={()=>setListView(false)} type="button"><Grid2X2 size={15}/></button></div>
        </div>

        <section className={`season-timeline ${listView?"":"is-grid"}`}>
          {visible.map(row=><article key={row.id} style={{"--season-tone":row.tone} as CSSProperties}>
            <b className={`season-marker is-${row.kind}`}>{row.id}</b>
            <div className="season-entry">
              <Image alt={row.title} height={110} quality={90} src={row.image} width={165}/>
              <div><h2>{row.title}</h2><p><span>{row.type}</span><b>{row.year}</b></p><small>{row.detail}</small></div>
            </div>
            <div className="season-progress"><small>PROGRESO</small><strong>{row.seen} <span>/ {row.total}</span></strong><div><i><span style={{width:`${row.progress}%`}}/></i><em>{row.progress}%</em></div></div>
            <div className={`season-status is-${row.statusKind}`}><small>ESTADO PERSONAL</small><strong><StatusIcon kind={row.statusKind}/>{row.status}</strong></div>
            <div className="season-actions"><small>ACCIONES</small><span><button aria-label={`Continuar ${row.title}`} type="button">{row.statusKind==="waiting"?<Bell size={15}/>:<Play size={15}/>}</button>{row.statusKind!=="waiting"&&<button aria-label={`Episodios de ${row.title}`} type="button"><ListChecks size={15}/></button>}<button aria-label={`Opciones de ${row.title}`} type="button"><MoreHorizontal size={15}/></button></span></div>
          </article>)}
        </section>
      </main>

      <aside className="season-aside">
        <section>
          <h2><PieChart size={15}/>Resumen de la franquicia</h2>
          <div className="season-summary"><i/><strong>65%<small>Progreso general</small></strong></div>
          <div className="season-summary-metrics"><span>EPISODIOS VISTOS<strong>24 / 37</strong></span><span>TIEMPO VISTO<strong>9h 36m<small>de 14h 48m</small></strong></span></div>
          <ul>{[["Completado","16","#22c55e"],["Viendo","8","#3b82f6"],["Planeo ver","0","#8b5cf6"],["Esperando","13","#f59e0b"]].map(([label,value,tone])=><li key={label}><i style={{background:tone}}/>{label}<strong>{value}</strong></li>)}</ul>
          <p className="season-total">Total episodios <strong>37</strong></p>
        </section>

        <section>
          <h2><Sparkles size={15}/>Siguiente recomendado</h2>
          <article className="season-next"><Image alt="Temporada 2" height={80} src="/images/anime-eclipse-cover-v2.png" width={58}/><div><strong>Temporada 2</strong><span>Continuar viendo</span><b>Episodio 9</b><button type="button">Continuar<Play size={12}/></button></div></article>
        </section>

        <section className="season-flow">
          <h2><GitBranch size={15}/>Flujo de continuidad</h2>
          <ol>{seasonRows.map((row,index)=><li key={row.id}>
            <div><span className={`is-${row.statusKind}`}><StatusIcon kind={row.statusKind} size={13}/></span><strong>{row.title}</strong><small>{row.kind==="movie"?"1h 48m":row.statusKind==="watching"?"8 / 12 episodios":row.statusKind==="waiting"?"TBA":`${row.total} episodios`}</small><StatusIcon kind={row.statusKind} size={13}/></div>
            {index<seasonRows.length-1&&<ChevronDown aria-hidden="true" className="season-flow-arrow" size={14}/>}
          </li>)}</ol>
          <p><Info size={13}/>Sigue el orden recomendado para mejorar tu experiencia de la historia.</p>
        </section>
      </aside>
    </div>
  </div>;
}
