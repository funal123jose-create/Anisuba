"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties, type ReactNode } from "react";
import {
  Activity,
  Building2,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  CircleDot,
  Clapperboard,
  Clock3,
  Copy,
  Database,
  GalleryHorizontalEnd,
  Globe2,
  History,
  ImageIcon,
  ImageUp,
  Link2,
  ListChecks,
  RotateCcw,
  Save,
  Star,
  Tags,
  Upload,
  type LucideIcon,
} from "lucide-react";

interface PanelTitleProps {
  icon: LucideIcon;
  title: string;
  info?: boolean;
}

function PanelTitle({ icon: Icon, title, info = false }: PanelTitleProps) {
  return <h2><Icon size={15}/>{title}{info&&<span className="anime-edit-info">i</span>}</h2>;
}

function FieldName({ children, required = false }: { children: ReactNode; required?: boolean }) {
  return <span className="anime-edit-label">{children}{required&&<b aria-label="obligatorio">*</b>}</span>;
}

const historyEntries = [
  { date: "21/05/2024", time: "14:35", user: "José Luis (Admin)", action: "Actualizó sinopsis y géneros", avatar: "/images/profile-avatar-v1.png" },
  { date: "20/05/2024", time: "10:12", user: "María Admin", action: "Cambió estado a Finalizado", avatar: "/images/profile-avatar-v1.png" },
  { date: "18/05/2024", time: "22:47", user: "María Admin", action: "Actualizó información básica", avatar: "/images/profile-avatar-v1.png" },
];

const genreTags = [
  ["Acción","#a855f7"],
  ["Fantasía","#ec4899"],
  ["Sci-Fi","#84cc16"],
  ["Aventura","#f97316"],
  ["Seinen","#3b82f6"],
];

const descriptiveTags = [
  ["Viajes en el tiempo","#8b5cf6"],
  ["Poderes sobrenaturales","#22d3ee"],
  ["Realidad alternativa","#f59e0b"],
];

export function AnimeEditPage() {
  const [saved,setSaved]=useState(false);

  return <div className="anime-edit-page">
    <header>
      <div>
        <p>Administración <span>›</span> Animes <span>›</span> Eclipse del Vacío <span>›</span> Editar</p>
        <h1>Editar anime</h1>
        <small>Modifica la información registrada del anime. Los cambios se reflejarán en toda la plataforma.</small>
      </div>
      <Link href="/anime/eclipse-del-vacio"><ChevronLeft size={14}/>Volver a la ficha</Link>
    </header>

    <div className="anime-edit-layout">
      <main>
        <section className="anime-edit-media">
          <div>
            <PanelTitle icon={ImageIcon} info title="Portada"/>
            <Image alt="Portada de Eclipse del Vacío" height={250} quality={92} src="/images/anime-eclipse-cover-v2.png" width={190}/>
            <button type="button"><Upload size={14}/>Cambiar imagen</button>
            <small>Recomendado: 600×900px<br/>JPG, PNG o WebP. Máx. 5MB</small>
          </div>
          <div>
            <PanelTitle icon={GalleryHorizontalEnd} info title="Banner"/>
            <Image alt="Banner de Eclipse del Vacío" height={250} quality={92} src="/images/anime-eclipse-hero-v1.png" width={900}/>
            <button type="button"><ImageUp size={14}/>Cambiar imagen</button>
            <small>Recomendado: 1920×640px<br/>JPG, PNG o WebP. Máx. 5MB</small>
          </div>
        </section>

        <div className="anime-edit-form-grid">
          <section className="anime-edit-basic">
            <PanelTitle icon={ListChecks} title="Información básica"/>
            <label><FieldName required>Título principal</FieldName><input defaultValue="Eclipse del Vacío"/></label>
            <label><FieldName>Título alternativo</FieldName><input defaultValue="虚空のエクリプス"/></label>
            <label><FieldName>Título en inglés</FieldName><input defaultValue="Kokuu no Ekuripusu"/></label>
            <label><FieldName required>Sinopsis</FieldName><textarea defaultValue="En un mundo donde el vacío amenaza con consumir todo a su paso, un joven que ha perdido sus recuerdos descubre un poder capaz de alterar el destino. Mientras busca respuestas sobre su origen, se verá envuelto en una guerra entre dimensiones y secretos que podrían cambiar el universo para siempre."/></label>
          </section>

          <section className="anime-edit-details">
            <PanelTitle icon={Clapperboard} title="Detalles del anime"/>
            <div className="anime-edit-three">
              <label><FieldName required>Tipo</FieldName><select defaultValue="TV"><option>TV</option></select></label>
              <label><FieldName required>Episodios</FieldName><input defaultValue="24"/></label>
              <label><FieldName>Duración por episodio</FieldName><input defaultValue="24 min"/></label>
              <label><FieldName>Temporadas</FieldName><select defaultValue="1"><option>1</option></select></label>
              <label><FieldName required>Año de estreno</FieldName><input defaultValue="2023"/></label>
              <label><FieldName required>Estado</FieldName><select><option>Finalizado</option></select></label>
            </div>
            <div className="anime-edit-two">
              <label><FieldName required>Fuente / Origen</FieldName><select><option>Novela ligera</option></select></label>
              <label><FieldName>Fecha de emisión</FieldName><input type="date" defaultValue="2023-04-06"/></label>
              <label><FieldName>Fecha final</FieldName><input type="date" defaultValue="2023-09-21"/></label>
            </div>
          </section>

          <section className="anime-edit-classification">
            <PanelTitle icon={Tags} title="Clasificación y géneros"/>
            <label><FieldName>Clasificación</FieldName><p className="anime-edit-score"><Star fill="currentColor" size={14}/>8.74</p></label>
            <label><FieldName required>Géneros</FieldName><div className="anime-edit-tags">{genreTags.map(([tag,tone])=><button key={tag} style={{"--tag-tone":tone} as CSSProperties} type="button">{tag} ×</button>)}<button aria-label="Desplegar géneros" className="anime-edit-tags-toggle" type="button"><ChevronDown size={13}/></button></div></label>
            <label><FieldName>Etiquetas</FieldName><div className="anime-edit-tags is-soft">{descriptiveTags.map(([tag,tone])=><button key={tag} style={{"--tag-tone":tone} as CSSProperties} type="button">{tag} ×</button>)}<button aria-label="Desplegar etiquetas" className="anime-edit-tags-toggle" type="button"><ChevronDown size={13}/></button></div></label>
            <label><FieldName>Audiencia</FieldName><select><option>+13</option></select></label>
          </section>

          <section className="anime-edit-studio">
            <PanelTitle icon={Building2} title="Estudio y producción"/>
            <label><FieldName required>Estudio</FieldName><div className="anime-edit-multiselect"><span>Void Studio <button aria-label="Quitar Void Studio" type="button">×</button></span><button aria-label="Desplegar estudios" type="button"><ChevronDown size={13}/></button></div></label>
            <label><FieldName>Productores</FieldName><select defaultValue=""><option disabled value="">Selecciona o escribe los productores</option></select></label>
            <label><FieldName>Licencia</FieldName><select defaultValue=""><option disabled value="">Selecciona o escribe la licencia</option></select></label>
          </section>

          <section className="anime-edit-links">
            <PanelTitle icon={Link2} title="Media y enlaces"/>
            <label><FieldName>Sitio web oficial</FieldName><div><Globe2 size={13}/><input defaultValue="https://eclipsedelvacio-anime.com"/></div></label>
            <label><FieldName>Tráiler oficial (YouTube)</FieldName><div><Clapperboard size={13}/><input defaultValue="https://youtube.com/watch?v=eclipse_vacio"/></div></label>
            <label><FieldName>Página en MyAnimeList</FieldName><div><Link2 size={13}/><input defaultValue="https://myanimelist.net/anime/50721"/></div></label>
          </section>

          <section className="anime-edit-related">
            <PanelTitle icon={Activity} title="Media relacionada"/>
            <label><FieldName>Secuela</FieldName><select><option>Selecciona un anime</option></select></label>
            <label><FieldName>Precuela</FieldName><select><option>Selecciona un anime</option></select></label>
            <label><FieldName>Adaptación de</FieldName><select><option>Selecciona una obra</option></select></label>
          </section>
        </div>
      </main>

      <aside>
        <section>
          <PanelTitle icon={Globe2} title="Estado actual"/>
          <small>Estado en la plataforma</small>
          <strong className="is-published"><Globe2 size={13}/>Publicado</strong>
          <label><FieldName>Visibilidad</FieldName><select><option>Público</option></select></label>
          <label><FieldName>ID del anime</FieldName><div><input readOnly value="ANI-2023-00042"/><button aria-label="Copiar ID" type="button"><Copy size={13}/></button></div></label>
        </section>

        <section className="anime-edit-updated">
          <PanelTitle icon={CalendarClock} title="Última actualización"/>
          <div><p><CalendarDays size={13}/>Hoy, 21 de mayo de 2024</p><p><Clock3 size={13}/>14:35</p></div>
          <small>Actualizado por</small>
          <strong><Image alt="José Luis" height={26} src="/images/profile-avatar-v1.png" width={26}/><span>José Luis <small>(Admin)</small></span></strong>
        </section>

        <section className="anime-edit-origin">
          <PanelTitle icon={Database} title="Origen del registro"/>
          <small>Método de registro</small>
          <div className="anime-origin-choice">
            <button type="button"><CircleDot size={16}/><span>API<small>Obtenido automáticamente desde una fuente externa.</small></span></button>
            <button className="is-active" type="button"><CircleDot size={16}/><span>Manual<small>Creado y gestionado manualmente.</small></span></button>
          </div>
        </section>

        <section className="anime-edit-history">
          <header><PanelTitle icon={History} title="Historial de cambios"/><button type="button">Ver todo</button></header>
          {historyEntries.map((entry)=><article key={`${entry.date}-${entry.time}`}>
            <i/>
            <Image alt={entry.user} height={28} src={entry.avatar} width={28}/>
            <div><small>{entry.date} · {entry.time}</small><strong>{entry.user}</strong><span>{entry.action}</span></div>
          </article>)}
        </section>
      </aside>
    </div>

    <footer>
      <div><button type="button">Cancelar</button><button type="reset"><RotateCcw size={14}/>Restablecer cambios</button></div>
      <button onClick={()=>setSaved(true)} type="button"><Save size={15}/>Guardar cambios</button>
    </footer>
    {saved&&<aside className="manual-toast" role="status"><Check size={14}/>Cambios guardados en modo demo<button aria-label="Cerrar mensaje" onClick={()=>setSaved(false)} type="button">×</button></aside>}
  </div>;
}
