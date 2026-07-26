"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft, Bookmark, Check, ChevronRight, Heart, ImagePlus, Info,
  Save, Star, Upload, X,
} from "lucide-react";

const fields = [
  ["Título principal","Ej. Shingeki no Kyojin","text",true],["Título alternativo","Ej. Attack on Titan","text",false],
  ["Episodios","Ej. 24","number",true],["Temporadas","Ej. 2","number",false],
  ["Duración por episodio","Ej. 24 min","text",false],["Año de estreno","Ej. 2023","number",true],
  ["Estudio","Ej. MAPPA","text",false],["Etiquetas (tags)","Escribe y presiona Enter para agregar","text",false],
] as const;

export function ManualAnimePage() {
  const [favorite,setFavorite]=useState(false);
  const [rating,setRating]=useState(0);
  const [saved,setSaved]=useState<"draft"|"registered"|null>(null);
  const [coverVisible,setCoverVisible]=useState(true);
  const [bannerVisible,setBannerVisible]=useState(true);
  return <div className="manual-anime-page">
    <header><Link href="/agregar-anime"><ArrowLeft size={14}/>Volver</Link><span>/</span><strong>Registro manual de anime</strong></header>
    <form onSubmit={(event)=>event.preventDefault()}>
      <aside className="manual-media-column">
        <section><h2>Imagen de portada <Info size={12}/></h2><p>Sube la imagen principal del anime.</p>{coverVisible?<div className="manual-cover-preview"><Image alt="Portada de muestra" fill sizes="250px" src="/images/anime-eclipse-cover-v2.png"/><button aria-label="Quitar portada" onClick={()=>setCoverVisible(false)} type="button"><X size={14}/></button></div>:<div className="manual-empty-image"><ImagePlus size={24}/><span>Sin portada</span></div>}<button className="manual-upload" type="button"><Upload size={15}/><span>Arrastra y suelta tu imagen aquí<small>PNG, JPG, WEBP · Máx. 5MB</small></span></button></section>
        <section><h2>Imagen de banner <Info size={12}/></h2><p>Sube una imagen horizontal (opcional).</p>{bannerVisible?<div className="manual-banner-preview"><Image alt="Banner de muestra" fill sizes="250px" src="/images/anime-eclipse-hero-v1.png"/><button aria-label="Quitar banner" onClick={()=>setBannerVisible(false)} type="button"><X size={14}/></button></div>:<div className="manual-empty-image"><ImagePlus size={24}/><span>Sin banner</span></div>}<button className="manual-upload" type="button"><Upload size={15}/><span>Arrastra y suelta tu imagen aquí<small>PNG, JPG, WEBP · Máx. 5MB</small></span></button></section>
      </aside>
      <main>
        <section className="manual-info-panel"><h1><Bookmark size={18}/>Información del anime</h1><div className="manual-fields">
          {fields.slice(0,2).map(([label,placeholder,type,required])=><label key={label}><span>{label}{required&&<b>*</b>}</span><input placeholder={placeholder} required={required} type={type}/></label>)}
          <label className="manual-synopsis"><span>Sinopsis <b>*</b></span><textarea maxLength={2000} placeholder="Escribe una sinopsis del anime..." required/><em>0/2000</em></label>
          <label><span>Tipo <b>*</b></span><select required><option value="">Selecciona el tipo</option><option>TV</option><option>Película</option><option>OVA</option></select></label>
          {fields.slice(2,6).map(([label,placeholder,type,required])=><label key={label}><span>{label}{required&&<b>*</b>}</span><input placeholder={placeholder} required={required} type={type}/></label>)}
          <label><span>Temporada de estreno</span><select><option>Selecciona la temporada</option><option>Primavera</option></select></label>
          <label><span>Estudio</span><input placeholder="Ej. MAPPA"/></label>
          <label><span>País de origen</span><select><option>Selecciona el país</option><option>Japón</option></select></label>
          <label><span>Géneros <b>*</b></span><select required><option>Selecciona o escribe géneros</option><option>Acción</option></select></label>
          <label><span>Estado oficial <b>*</b></span><select required><option>Selecciona el estado</option><option>Finalizado</option></select></label>
          <label><span>Fuente</span><select><option>Selecciona la fuente</option><option>Manga</option></select></label>
          <label><span>Clasificación por edad</span><select><option>Selecciona la clasificación</option><option>PG-13</option></select></label>
          <label className="manual-tags"><span>Etiquetas (tags)</span><input placeholder="Escribe y presiona Enter para agregar"/><small>Ej. post-apocalíptico, militar, venganza</small></label>
        </div></section>
        <section className="manual-personal-panel"><h2><Bookmark size={16}/>Información para tu biblioteca personal</h2><div><label><span>Estado inicial</span><select><option>Quiero ver</option><option>Viendo actualmente</option></select></label><label><span>Episodio inicial</span><input placeholder="Ej. 1" type="number"/></label><label><span>Marcar como favorito</span><button aria-pressed={favorite} className={favorite?"is-active":undefined} onClick={()=>setFavorite((value)=>!value)} type="button"><Heart fill={favorite?"currentColor":"none"} size={19}/><i><span/></i></button></label><label><span>Puntuación (opcional)</span><div className="manual-rating">{Array.from({length:5},(_,index)=><button aria-label={`Puntuar ${index+1} estrellas`} key={index} onClick={()=>setRating(index+1)} type="button"><Star fill={rating>index?"currentColor":"none"} size={18}/></button>)}</div></label><label><span>Comentario rápido (opcional)</span><textarea maxLength={300} placeholder="Escribe un comentario breve..."/></label></div></section>
        <p className="manual-note"><Info size={13}/>Podrás editar toda esta información más adelante desde la página del anime.</p>
        <footer><button onClick={()=>setSaved("draft")} type="button"><Save size={15}/>Guardar borrador</button><button onClick={()=>setSaved("registered")} type="button">Registrar anime<ChevronRight size={15}/></button></footer>
      </main>
    </form>
    {saved&&<div className="manual-toast" role="status"><Check size={14}/>{saved==="draft"?"Borrador guardado":"Anime registrado en modo demo"}<button aria-label="Cerrar mensaje" onClick={()=>setSaved(null)} type="button"><X size={13}/></button></div>}
  </div>;
}
