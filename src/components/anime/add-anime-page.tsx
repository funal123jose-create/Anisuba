"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import {
  Bookmark, Check, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink,
  Heart, LibraryBig, Minus, PlayCircle, Plus, Search, Star, X,
} from "lucide-react";

const apiResults = [
  { id:"eclipse",title:"Eclipse del Vacío",year:2024,episodes:24,score:8.74,votes:"12,458",genres:["Acción","Fantasía","Sci-Fi"],image:"/images/anime-eclipse-cover-v2.png" },
  { id:"aurora",title:"Aurora de Cristal",year:2024,episodes:12,score:8.32,votes:"8,917",genres:["Fantasía","Drama","Romance"],image:"https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145139-rRimpHGWLhym.png" },
  { id:"sombras",title:"Sombras de Hekai",year:2023,episodes:26,score:8.11,votes:"6,231",genres:["Acción","Dark Fantasy","Seinen"],image:"https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg" },
  { id:"notas",title:"Notas del Más Allá",year:2024,episodes:13,score:8.20,votes:"7,845",genres:["Drama","Sobrenatural","Escolar"],image:"https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx146065-IjirxRK26O03.png" },
  { id:"luminis",title:"Crónicas de Luminis",year:2024,episodes:22,score:8.29,votes:"5,672",genres:["Aventura","Sci-Fi","Misterio"],image:"https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg" },
  { id:"samurai",title:"Renacer del Samurái",year:2024,episodes:12,score:8.56,votes:"9,304",genres:["Acción","Histórico","Samurái"],image:"https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145064-hSNRJM03pvv1.jpg" },
];
const initialStatusOptions = [
  { value:"Planeo ver", detail:"Quiero verlo más adelante.", icon:Bookmark, tone:"#8b5cf6" },
  { value:"Viendo actualmente", detail:"Estoy viendo este anime.", icon:PlayCircle, tone:"#a855f7" },
  { value:"Completado", detail:"Ya terminé de verlo.", icon:CheckCircle2, tone:"#22c55e" },
];

export function AddAnimePage() {
  const [query,setQuery]=useState("kaiju");
  const [selected,setSelected]=useState(apiResults[0]);
  const [episode,setEpisode]=useState(9);
  const [initialStatus,setInitialStatus]=useState("Viendo actualmente");
  const [favorite,setFavorite]=useState(true);
  const [added,setAdded]=useState<string[]>([]);
  const filtered=useMemo(()=>apiResults.filter((anime)=>!query||anime.title.toLowerCase().includes(query.toLowerCase())||query==="kaiju"),[query]);
  return <div className="api-add-page">
    <header><div><p>CATÁLOGO EXTERNO</p><h1>Agregar anime desde API</h1><span>Busca anime desde fuentes externas y agrégalo a tu biblioteca.</span></div><Link href="/agregar-anime/manual"><Plus size={14}/>Registro manual</Link></header>
    <div className="api-add-layout">
      <main>
        <label className="api-search"><Search size={16}/><input aria-label="Buscar anime en API" onChange={(event)=>setQuery(event.target.value)} value={query}/>{query&&<button aria-label="Limpiar búsqueda" onClick={()=>setQuery("")} type="button"><X size={14}/></button>}</label>
        <div className="api-filters"><select aria-label="Temporada"><option>Temporada actual</option><option>Invierno</option></select><select aria-label="Año"><option>Año: 2023 - 2025</option></select><select aria-label="Tipo"><option>Tipo: Todo</option><option>TV</option></select><button type="button"><Search size={14}/>Buscar</button></div>
        <p className="api-results-count">Resultados encontrados: {filtered.length}</p>
        <section className="api-result-grid">{filtered.map((anime)=><article className={selected.id===anime.id?"is-selected":undefined} key={anime.id}><Image alt={`Portada de ${anime.title}`} height={280} quality={90} sizes="100px" src={anime.image} width={200}/><div><h2>{anime.title}</h2><p>{anime.year} · {anime.episodes} eps</p><div>{anime.genres.map((genre)=><span key={genre}>{genre}</span>)}</div><strong><Star fill="currentColor" size={11}/>{anime.score.toFixed(2)} <small>({anime.votes})</small><ExternalLink size={10}/></strong></div><button onClick={()=>setSelected(anime)} type="button"><Plus size={14}/>Agregar</button>{selected.id===anime.id&&<i><Check size={11}/></i>}</article>)}</section>
        <footer className="api-pagination"><button type="button"><ChevronLeft size={14}/></button><button className="is-active" type="button">1</button><button type="button"><ChevronRight size={14}/></button><span>Mostrando {filtered.length} de {filtered.length} resultados</span></footer>
      </main>

      <aside className="api-detail-panel">
        <header><h2>Detalle del anime</h2><button aria-label="Cerrar detalle" type="button"><X size={16}/></button></header>
        <div className="api-detail-banner"><Image alt="Banner de Eclipse del Vacío" fill quality={92} sizes="430px" src="/images/anime-eclipse-hero-v1.png"/></div>
        <section className="api-detail-title"><Image alt={`Portada de ${selected.title}`} height={212} quality={92} sizes="76px" src={selected.image} width={152}/><div><h2>{selected.title}<span>TV</span></h2><p>虚空のエクリプス</p><small>Kokuu no Ekuripusu</small><strong>{selected.year} · {selected.episodes} episodios · 24 min <Star fill="currentColor" size={11}/>{selected.score}</strong></div></section>
        <div className="api-detail-columns"><section><h3>Sinopsis</h3><p>En un mundo donde el vacío amenaza con consumir todo a su paso, un joven que ha perdido sus recuerdos descubre un poder capaz de alterar el destino. Mientras busca respuestas sobre su origen, se verá envuelto en una guerra entre dimensiones y secretos que podrían cambiar el universo para siempre.</p><h3>Fuente (API)</h3><dl><div><dt>Proveedor</dt><dd>Jikan API (MyAnimeList)</dd></div><div><dt>ID MAL</dt><dd>52347</dd></div><div><dt>Tipo</dt><dd>TV</dd></div><div><dt>Estado</dt><dd>Finished Airing</dd></div><div><dt>Emitido</dt><dd>Abr 6, 2024 – Sep 21, 2024</dd></div><div><dt>Estudio</dt><dd>Void Studio</dd></div><div><dt>Score</dt><dd>8.74 (12,458 votos)</dd></div></dl></section><section className="api-initial-state"><h3>Agregar con estado inicial</h3>{initialStatusOptions.map(({value,detail,icon:Icon,tone})=><button className={initialStatus===value?"is-active":undefined} key={value} onClick={()=>setInitialStatus(value)} style={{"--api-tone":tone} as CSSProperties} type="button"><Icon size={16}/><span><strong>{value}</strong><small>{detail}</small></span>{initialStatus===value&&<Check size={13}/>}</button>)}<label>Temporada actual en API<select><option>2024 Primavera</option></select></label><div className="api-episode-stepper"><button aria-label="Restar episodio inicial" onClick={()=>setEpisode((value)=>Math.max(0,value-1))} type="button"><Minus size={14}/></button><strong>{episode}</strong><button aria-label="Sumar episodio inicial" onClick={()=>setEpisode((value)=>Math.min(selected.episodes,value+1))} type="button"><Plus size={14}/></button><span>de {selected.episodes} episodios</span></div><div className="api-favorite-toggle"><span><Heart fill={favorite?"currentColor":"none"} size={15}/>Agregar a favoritos</span><button aria-label="Agregar a favoritos" aria-pressed={favorite} className={favorite?"is-active":undefined} onClick={()=>setFavorite((value)=>!value)} type="button"><i/></button></div></section></div>
        <button className="api-add-submit" onClick={()=>setAdded((current)=>current.includes(selected.id)?current:[...current,selected.id])} type="button">{added.includes(selected.id)?<Check size={15}/>:<LibraryBig size={15}/>} {added.includes(selected.id)?"Agregado a mi biblioteca":"Agregar a mi biblioteca"}</button>
      </aside>
    </div>
  </div>;
}
