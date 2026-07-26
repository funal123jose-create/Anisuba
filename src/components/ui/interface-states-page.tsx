"use client";

import Link from "next/link";
import { useState } from "react";
import { BarChart3, Box, Boxes, Check, Compass, Grid2X2, Heart, ImageOff, Info, LoaderCircle, RefreshCw, SearchX, ServerCrash, Sparkles } from "lucide-react";

const skeletons=Array.from({length:4},(_,index)=>index);

export function InterfaceStatesPage(){
  const [retrying,setRetrying]=useState(false);
  return <div className="interface-states-page">
    <header><p>GUÍA DE EXPERIENCIA</p><h1>Estados vacíos, carga y errores</h1><span>Estados reutilizables para garantizar coherencia, claridad y una buena experiencia en toda AniSuba.</span></header>
    <div className="interface-state-grid">
      <section><h2><b>1</b>Biblioteca vacía</h2><div className="state-illustration is-box"><Box size={62}/><Sparkles size={20}/></div><h3>Tu biblioteca está vacía</h3><p>Aún no has agregado ningún anime.<br/>Explora, guarda y organiza tus favoritos.</p><Link href="/explorar"><Compass size={15}/>Explorar animes</Link></section>
      <section><h2><b>2</b>Sin resultados de búsqueda</h2><div className="state-illustration is-search"><SearchX size={76}/><Sparkles size={18}/></div><h3>No se encontraron resultados</h3><p>No hallamos coincidencias para tu búsqueda.<br/>Intenta con otras palabras clave o filtros.</p><div className="state-actions"><button type="button">Limpiar filtros</button><Link href="/explorar"><Compass size={15}/>Explorar animes</Link></div></section>
      <section><h2><b>3</b>Cargando contenido</h2><div className="state-skeletons">{skeletons.map(index=><article key={index}><span><ImageOff size={27}/></span><i/><i/><i/></article>)}</div><h3>Cargando contenido...</h3><p>Estamos preparando todo para ti.<br/>Esto puede tardar unos segundos.</p><div className="state-loading-bar"><span/></div></section>
      <section><h2><b>4</b>Error de API / servicio no disponible</h2><div className="state-illustration is-error"><ServerCrash size={76}/><span>×</span></div><h3>Ups, algo salió mal</h3><p>No pudimos conectar con nuestros servidores.<br/>Verifica tu conexión o inténtalo más tarde.</p><button onClick={()=>setRetrying((current)=>!current)} type="button">{retrying?<LoaderCircle className="is-spinning" size={16}/>:<RefreshCw size={16}/>}Reintentar</button></section>
      <section><h2><b>5</b>Imagen no disponible / fallback cover</h2><div className="state-fallback-cover"><ImageOff size={45}/><span>A</span></div><h3>Imagen no disponible</h3><p>No contamos con una imagen para este título.<br/>Pronto podrás ver su portada.</p><Link href="/explorar"><Compass size={15}/>Explorar animes</Link></section>
      <section><h2><b>6</b>Sin datos suficientes para estadísticas</h2><div className="state-illustration is-chart"><BarChart3 size={75}/><b>?</b></div><h3>Aún no hay datos suficientes</h3><p>Necesitamos más información para mostrar estadísticas significativas.<br/>Sigue usando AniSuba y vuelve más tarde.</p><Link href="/biblioteca"><BarChart3 size={15}/>Explorar más</Link></section>
    </div>
    <footer><p><Info size={14}/>Usa estos estados para comunicar claramente lo que ocurre y guiar al usuario hacia la siguiente acción.</p><div><span><Check size={14}/>Claridad</span><span><Grid2X2 size={14}/>Consistencia</span><span><Heart size={14}/>Empatía</span><span><Boxes size={14}/>Accionable</span></div></footer>
  </div>;
}
