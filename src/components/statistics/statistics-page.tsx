"use client";

import { useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Info,
  Library,
  PieChart,
  Sparkles,
  Star,
  Tags,
  Tv,
  UsersRound,
} from "lucide-react";
import { PanelHeading } from "@/components/ui/panel-heading";
import { StatisticsStatusChart, StatisticsTrendChart } from "@/components/statistics/statistics-charts";
import type { StatisticsData } from "@/types/statistics";

type StatisticsPageProps = { data: StatisticsData; isDemo: boolean };
type StatisticsRange = "30d" | "3m" | "1y" | "all";

const metricIcons = [Library, Tv, Clock3, Star, CheckCircle2];
const weekdayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function StatisticsPage({ data, isDemo }: StatisticsPageProps) {
  const [range, setRange] = useState<StatisticsRange>("30d");
  const maxGenre = Math.max(...data.genres.map((genre) => genre.episodes), 1);
  const maxStudio = Math.max(...data.studios.map((studio) => studio.episodes), 1);

  return (
    <div className="statistics-page">
      <header className="statistics-header">
        <div><h1>Estadísticas</h1><p>Explora tus hábitos y descubre tus insights anime.</p></div>
        <div className="statistics-header-actions">
          {isDemo && <div className="demo-data-pill"><Sparkles size={14} /><strong>Modo demo</strong><span>Insights de muestra</span></div>}
          <div className="statistics-range" role="group" aria-label="Periodo de estadísticas">
            <span><CalendarDays size={15} /></span>
            {([["30d", "30 días"], ["3m", "3 meses"], ["1y", "1 año"], ["all", "Todo el tiempo"]] as const).map(([value, label]) => (
              <button aria-pressed={range === value} className={range === value ? "is-active" : undefined} key={value} onClick={() => setRange(value)} type="button">{label}</button>
            ))}
          </div>
        </div>
      </header>

      <section className="statistics-metrics" aria-label="Indicadores principales">
        {data.metrics.map((metric, index) => {
          const Icon = metricIcons[index] ?? Sparkles;
          return (
            <article className={`statistics-metric tone-${metric.tone}`} key={metric.label}>
              <span><Icon size={24} /></span>
              <div><small>{metric.label}</small><strong>{metric.value}</strong><em>{metric.change}</em></div>
            </article>
          );
        })}
      </section>

      <div className="statistics-primary-grid">
        <section className="panel statistics-trend-panel">
          <PanelHeading icon={BarChart3} meta={<button type="button">Diario⌄</button>} title="Episodios vistos en el tiempo" tone="#a855f7" />
          <div className="statistics-legend"><i />Episodios</div>
          <StatisticsTrendChart data={data.trend} />
        </section>

        <section className="panel statistics-status-panel">
          <PanelHeading icon={PieChart} meta={<Info size={12} />} title="Distribución por estado" tone="#3b82f6" />
          <StatisticsStatusChart data={data.statusDistribution} />
        </section>

        <section className="panel statistics-genres-panel">
          <PanelHeading icon={Tags} meta="Por episodios⌄" title="Top géneros" tone="#22d3ee" />
          <ul>{data.genres.map((genre) => <li key={genre.name}><span>{genre.name}</span><span className="statistics-bar-track"><span style={{ "--bar-tone": genre.color, width: `${(genre.episodes / maxGenre) * 100}%` } as React.CSSProperties} /></span><strong>{genre.episodes}</strong><em>{genre.percentage}%</em></li>)}</ul>
        </section>
      </div>

      <div className="statistics-secondary-grid">
        <section className="panel statistics-studios-panel">
          <PanelHeading icon={UsersRound} meta={<Info size={12} />} title="Top estudios" tone="#8b5cf6" />
          <div className="statistics-studio-table"><header><span>#</span><span>Estudio</span><span>Episodios</span></header>{data.studios.map((studio, index) => <article key={studio.name}><strong>{index + 1}</strong><i style={{ "--studio-tone": studio.color } as React.CSSProperties}>{studio.name.slice(0, 2).toUpperCase()}</i><span>{studio.name}</span><span className="statistics-studio-track"><span style={{ width: `${(studio.episodes / maxStudio) * 100}%` }} /></span><em>{studio.episodes}</em></article>)}</div>
        </section>

        <section className="panel statistics-heatmap-panel">
          <PanelHeading icon={CalendarDays} meta={<Info size={12} />} title="Actividad de visualización" tone="#a855f7" />
          <div className="statistics-heatmap-months"><span>Abr</span><span>May</span></div>
          <div className="statistics-heatmap">{data.heatmap.map((row, rowIndex) => <div key={weekdayLabels[rowIndex]}><small>{weekdayLabels[rowIndex]}</small>{row.map((value, columnIndex) => <span aria-label={`${value} niveles de actividad, ${weekdayLabels[rowIndex]}`} className={`level-${value}`} key={`${rowIndex}-${columnIndex}`} tabIndex={0} title={`${value === 0 ? "Sin" : value} actividad`} />)}</div>)}</div>
          <div className="statistics-heatmap-legend"><span>Menos</span>{[0,1,2,3,4].map((value) => <i className={`level-${value}`} key={value} />)}<span>Más</span></div>
        </section>

        <section className="panel statistics-insight-panel">
          <PanelHeading icon={Sparkles} meta={<Info size={12} />} title="Insight personal" tone="#ec4899" />
          <div className="statistics-insight-copy"><span><Sparkles size={28} /></span><div><h3>{data.insight.title}</h3>{data.insight.lines.map((line) => <p key={line}>{line}</p>)}</div></div>
          <div className="statistics-streak"><Flame size={15} /><span>Racha actual: <strong>{data.insight.streakDays} días</strong></span></div>
        </section>
      </div>

      <footer className="statistics-footer"><span>Última actualización: {data.lastUpdated}</span><span>Los datos se calculan en base a tu historial de visualización y pueden tener pequeñas variaciones.</span></footer>
    </div>
  );
}
