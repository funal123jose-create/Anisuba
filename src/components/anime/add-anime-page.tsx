"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import {
  Bookmark, Check, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink,
  Heart, LibraryBig, LoaderCircle, Minus, PlayCircle, Plus, Search, Star, X,
} from "lucide-react";
import type { AniListAnime } from "@/lib/anilist/client";

type SearchResponse = {
  pageInfo: {
    currentPage: number;
    hasNextPage: boolean;
    lastPage: number;
    total: number;
  };
  results: AniListAnime[];
  message?: string;
};

const initialStatusOptions = [
  { value:"Planeo ver", detail:"Quiero verlo más adelante.", icon:Bookmark, tone:"#8b5cf6" },
  { value:"Viendo actualmente", detail:"Estoy viendo este anime.", icon:PlayCircle, tone:"#a855f7" },
  { value:"Completado", detail:"Ya terminé de verlo.", icon:CheckCircle2, tone:"#22c55e" },
];

const statusLabels: Record<string, string> = {
  FINISHED: "Finalizado",
  RELEASING: "En emisión",
  NOT_YET_RELEASED: "Próximamente",
  CANCELLED: "Cancelado",
  HIATUS: "Pausado",
};

const formatLabels: Record<string, string> = {
  TV: "TV",
  TV_SHORT: "TV corto",
  MOVIE: "Película",
  SPECIAL: "Especial",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Musical",
};

export function AddAnimePage({ initialQuery = "" }: { initialQuery?: string }) {
  const [query,setQuery]=useState(initialQuery);
  const [format,setFormat]=useState("");
  const [year,setYear]=useState("");
  const [results,setResults]=useState<AniListAnime[]>([]);
  const [selected,setSelected]=useState<AniListAnime|null>(null);
  const [pageInfo,setPageInfo]=useState<SearchResponse["pageInfo"]>({currentPage:1,hasNextPage:false,lastPage:1,total:0});
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [episode,setEpisode]=useState(0);
  const [initialStatus,setInitialStatus]=useState("Planeo ver");
  const [favorite,setFavorite]=useState(false);
  const [importing,setImporting]=useState(false);
  const [importResult,setImportResult]=useState<{message:string;success:boolean}|null>(null);

  useEffect(() => {
    if (initialQuery.trim().length < 2) return;
    const timer = window.setTimeout(() => {
      document.querySelector<HTMLFormElement>(".api-search-form")?.requestSubmit();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialQuery]);

  async function search(page = 1) {
    if (query.trim().length < 2) {
      setError("Escribe al menos dos caracteres para buscar en AniList.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({q:query.trim(),page:String(page)});
      if (format) params.set("format",format);
      if (year) params.set("year",year);
      const response = await fetch(`/api/anilist/search?${params.toString()}`, {cache:"no-store"});
      const payload = await response.json() as SearchResponse;
      if (!response.ok) throw new Error(payload.message || "No se pudo consultar AniList.");
      setResults(payload.results);
      setPageInfo(payload.pageInfo);
      const nextSelected = payload.results[0] ?? null;
      setSelected(nextSelected);
      setEpisode(0);
    } catch (searchError) {
      setResults([]);
      setSelected(null);
      setError(searchError instanceof Error ? searchError.message : "No se pudo consultar AniList.");
    } finally {
      setLoading(false);
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void search(1);
  }

  function chooseAnime(anime: AniListAnime) {
    setSelected(anime);
    setEpisode(0);
    setInitialStatus("Planeo ver");
    setFavorite(false);
    setImportResult(null);
  }

  async function importSelectedAnime() {
    if (!selected || importing) return;
    setImporting(true);
    setImportResult(null);
    try {
      const libraryStatus = initialStatus === "Completado"
        ? "completed"
        : initialStatus === "Viendo actualmente"
          ? "watching"
          : "plan_to_watch";
      const response = await fetch("/api/anilist/import", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          anilistId: selected.id,
          libraryStatus,
          episodesWatched: episode,
          favorite,
        }),
      });
      const payload = await response.json() as {
        message?: string;
        reused?: boolean;
        tracking?: {
          ok: boolean;
          skippedCount: number;
          syncedCount: number;
          totalCount: number;
        };
      };
      if (!response.ok) throw new Error(payload.message || "No se pudo incorporar el anime.");
      const trackingMessage = payload.tracking?.ok
        ? ` Tracking generado con ${payload.tracking.syncedCount} contenido${payload.tracking.syncedCount === 1 ? "" : "s"} relacionado${payload.tracking.syncedCount === 1 ? "" : "s"}.`
        : " El anime quedó agregado, pero el tracking podrá sincronizarse nuevamente desde Gestión de temporadas.";
      setImportResult({
        success: true,
        message: payload.reused
          ? `El registro existente se añadió a tu biblioteca sin duplicarlo.${trackingMessage}`
          : `Anime incorporado a tu catálogo y a tu biblioteca.${trackingMessage}`,
      });
      setResults((current)=>current.map((anime)=>anime.id===selected.id
        ? {...anime,isAlreadyCatalogued:true}
        : anime));
      setSelected((current)=>current ? {...current,isAlreadyCatalogued:true} : current);
    } catch (importError) {
      setImportResult({
        success: false,
        message: importError instanceof Error ? importError.message : "No se pudo incorporar el anime.",
      });
    } finally {
      setImporting(false);
    }
  }

  return <div className="api-add-page">
    <header><div><p>CATÁLOGO EXTERNO · ANILIST</p><h1>Agregar anime desde API</h1><span>Busca información real de AniList y revísala antes de incorporarla a AniSuba.</span></div><Link href="/agregar-anime/manual"><Plus size={14}/>Registro manual</Link></header>
    <div className={`api-add-layout ${selected ? "" : "has-no-selection"}`}>
      <main>
        <form className="api-search-form" onSubmit={submitSearch}>
          <label className="api-search"><Search size={16}/><input aria-label="Buscar anime en AniList" onChange={(event)=>setQuery(event.target.value)} placeholder="Ej. One Piece, Dragon Ball Z…" value={query}/>{query&&<button aria-label="Limpiar búsqueda" onClick={()=>setQuery("")} type="button"><X size={14}/></button>}</label>
          <div className="api-filters">
            <select aria-label="Tipo" onChange={(event)=>setFormat(event.target.value)} value={format}><option value="">Tipo: Todo</option><option value="TV">TV</option><option value="MOVIE">Película</option><option value="OVA">OVA</option><option value="ONA">ONA</option><option value="SPECIAL">Especial</option></select>
            <input aria-label="Año de estreno" max={new Date().getFullYear()+2} min="1940" onChange={(event)=>setYear(event.target.value)} placeholder="Año de estreno" type="number" value={year}/>
            <span className="api-provider-note">Fuente oficial: AniList GraphQL</span>
            <button disabled={loading} type="submit"><Search size={14}/>{loading?"Buscando…":"Buscar"}</button>
          </div>
        </form>
        {error&&<p className="api-search-message is-error">{error}</p>}
        {!error&&results.length===0&&<p className="api-search-message"><Search size={15}/>Escribe el nombre de un anime para consultar el catálogo real.</p>}
        {results.length>0&&<p className="api-results-count">Resultados encontrados: {pageInfo.total}</p>}
        <section className="api-result-grid">{results.map((anime)=><article className={selected?.id===anime.id?"is-selected":undefined} key={anime.id}><Image alt={`Portada de ${anime.title}`} height={280} quality={90} sizes="100px" src={anime.coverUrl} width={200}/><div><h2>{anime.title}</h2><p>{anime.seasonYear ?? "TBA"} · {anime.episodes ?? "?"} eps <span className="api-result-format">{anime.format ? formatLabels[anime.format] ?? anime.format : "Anime"}</span></p><div>{anime.genres.slice(0,3).map((genre)=><span key={genre}>{genre}</span>)}</div><strong><Star fill="currentColor" size={11}/>{anime.averageScore ? (anime.averageScore/10).toFixed(2) : "—"} <small>({anime.popularity.toLocaleString("es-ES")})</small><a aria-label={`Abrir ${anime.title} en AniList`} href={anime.sourceUrl} rel="noreferrer" target="_blank"><ExternalLink size={10}/></a></strong>{anime.isAlreadyCatalogued&&<em>Ya existe en el catálogo</em>}</div><button onClick={()=>chooseAnime(anime)} type="button">{anime.isAlreadyCatalogued?<Check size={14}/>:<Plus size={14}/>}Revisar</button>{selected?.id===anime.id&&<i><Check size={11}/></i>}</article>)}</section>
        {results.length>0&&<footer className="api-pagination"><button aria-label="Página anterior" disabled={pageInfo.currentPage<=1||loading} onClick={()=>void search(pageInfo.currentPage-1)} type="button"><ChevronLeft size={14}/></button><button className="is-active" type="button">{pageInfo.currentPage}</button><button aria-label="Página siguiente" disabled={!pageInfo.hasNextPage||loading} onClick={()=>void search(pageInfo.currentPage+1)} type="button"><ChevronRight size={14}/></button><span>Mostrando {results.length} de {pageInfo.total} resultados</span></footer>}
      </main>

      {selected&&<aside className="api-detail-panel">
        <header><h2>Revisión del resultado</h2><button aria-label="Cerrar detalle" onClick={()=>setSelected(null)} type="button"><X size={16}/></button></header>
        <div className="api-detail-banner"><Image alt={`Banner de ${selected.title}`} fill quality={92} sizes="430px" src={selected.bannerUrl || selected.coverUrl}/></div>
        <section className="api-detail-title"><Image alt={`Portada de ${selected.title}`} height={212} quality={92} sizes="76px" src={selected.coverUrl} width={152}/><div><h2>{selected.title}<span>{selected.format ? formatLabels[selected.format] ?? selected.format : "ANIME"}</span></h2>{selected.nativeTitle&&<p>{selected.nativeTitle}</p>}<small>{selected.alternativeTitle}</small><strong>{selected.seasonYear ?? "TBA"} · {selected.episodes ?? "?"} episodios · {selected.duration ?? "?"} min <Star fill="currentColor" size={11}/>{selected.averageScore ? (selected.averageScore/10).toFixed(2) : "—"}</strong></div></section>
        <div className="api-detail-columns"><section><h3>Sinopsis</h3><p>{selected.description || "AniList no proporciona una sinopsis para este título."}</p><h3>Fuente (API)</h3><dl><div><dt>Proveedor</dt><dd>AniList GraphQL</dd></div><div><dt>ID AniList</dt><dd>{selected.id}</dd></div><div><dt>ID MAL</dt><dd>{selected.idMal ?? "No disponible"}</dd></div><div><dt>Tipo</dt><dd>{selected.format ? formatLabels[selected.format] ?? selected.format : "Sin definir"}</dd></div><div><dt>Estado</dt><dd>{selected.status ? statusLabels[selected.status] ?? selected.status : "Sin definir"}</dd></div><div><dt>Temporada</dt><dd>{selected.season ?? "—"} {selected.seasonYear ?? ""}</dd></div><div><dt>Estudio</dt><dd>{selected.studios.join(", ") || "No disponible"}</dd></div><div><dt>Popularidad</dt><dd>{selected.popularity.toLocaleString("es-ES")}</dd></div></dl></section><section className="api-initial-state"><h3>Preferencias personales</h3>{initialStatusOptions.map(({value,detail,icon:Icon,tone})=><button className={initialStatus===value?"is-active":undefined} key={value} onClick={()=>{setInitialStatus(value);setEpisode(value==="Completado"?(selected.episodes??0):0);}} style={{"--api-tone":tone} as CSSProperties} type="button"><Icon size={16}/><span><strong>{value}</strong><small>{detail}</small></span>{initialStatus===value&&<Check size={13}/>}</button>)}<label>Episodio inicial<div className="api-episode-stepper"><button aria-label="Restar episodio inicial" disabled={initialStatus!=="Viendo actualmente"} onClick={()=>setEpisode((value)=>Math.max(0,value-1))} type="button"><Minus size={14}/></button><strong>{episode}</strong><button aria-label="Sumar episodio inicial" disabled={initialStatus!=="Viendo actualmente"} onClick={()=>setEpisode((value)=>Math.min(selected.episodes??9999,value+1))} type="button"><Plus size={14}/></button><span>de {selected.episodes ?? "?"} episodios</span></div></label><div className="api-favorite-toggle"><span><Heart fill={favorite?"currentColor":"none"} size={15}/>Agregar a favoritos</span><button aria-label="Agregar a favoritos" aria-pressed={favorite} className={favorite?"is-active":undefined} onClick={()=>setFavorite((value)=>!value)} type="button"><i/></button></div></section></div>
        <div className={`api-catalog-status ${selected.isAlreadyCatalogued?"is-duplicate":""}`}>{selected.isAlreadyCatalogued?<><CheckCircle2 size={15}/>Este ID de AniList ya está vinculado. Se reutilizará el registro existente sin crear duplicados.</>:<><LibraryBig size={15}/>Resultado validado. Puedes incorporarlo directamente a tu biblioteca.</>}</div>
        {importResult&&<div className={`api-import-feedback ${importResult.success?"is-success":"is-error"}`} role="status">{importResult.success?<CheckCircle2 size={15}/>:<X size={15}/>}<span>{importResult.message}</span>{importResult.success&&<Link href="/biblioteca">Ver mi biblioteca</Link>}</div>}
        <button className="api-import-button" disabled={importing} onClick={()=>void importSelectedAnime()} type="button">{importing?<LoaderCircle className="is-spinning" size={16}/>:<LibraryBig size={16}/>} {importing?"Incorporando…":selected.isAlreadyCatalogued?"Añadir a mi biblioteca":"Agregar este anime a mi biblioteca"}</button>
        <p className="api-import-scope">AniSuba detectará automáticamente temporadas, OVA, especiales y películas relacionadas mediante AniList, manteniendo separado tu progreso en cada contenido.</p>
      </aside>}
    </div>
  </div>;
}
