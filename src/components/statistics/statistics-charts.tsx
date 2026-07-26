"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StatisticsData } from "@/types/statistics";

const tooltipStyle = {
  background: "#151a29",
  border: "1px solid #313951",
  borderRadius: "9px",
  color: "#f6f7fb",
  fontSize: "11px",
};

export function StatisticsTrendChart({ data }: { data: StatisticsData["trend"] }) {
  if (!data.length) return <div className="statistics-chart-empty">Aún no hay actividad temporal.</div>;

  return (
    <div className="statistics-trend-chart" aria-label="Episodios vistos en el tiempo">
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart data={data} margin={{ bottom: 8, left: -20, right: 7, top: 10 }}>
          <defs>
            <linearGradient id="statisticsEpisodesGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.48} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#22283a" strokeDasharray="3 5" vertical={false} />
          <XAxis axisLine={false} dataKey="label" interval={3} padding={{ left: 12, right: 4 }} tick={{ fill: "#7e889c", fontSize: 8 }} tickLine={false} tickMargin={8} />
          <YAxis axisLine={false} tick={{ fill: "#7e889c", fontSize: 8 }} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "#4b556f" }} />
          <Area activeDot={{ fill: "#c084fc", r: 5, stroke: "#fff", strokeWidth: 2 }} animationDuration={900} dataKey="episodes" fill="url(#statisticsEpisodesGradient)" stroke="#a855f7" strokeWidth={2.5} type="monotone" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatisticsStatusChart({ data }: { data: StatisticsData["statusDistribution"] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData = total ? data : [{ name: "Sin datos", value: 1, color: "#252c40" }];

  return (
    <div className="statistics-status-content">
      <div className="statistics-status-donut">
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
            <Pie animationDuration={800} data={chartData} dataKey="value" innerRadius={47} outerRadius={68} paddingAngle={total ? 2 : 0} stroke="none">
              {chartData.map((item, index) => <Cell fill={item.color} key={item.name} opacity={activeIndex === null || activeIndex === index ? 1 : .28} onMouseEnter={() => total && setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <span><strong>{total}</strong><small>Total</small></span>
      </div>
      <ul>
        {data.map((item, index) => (
          <li key={item.name}>
            <button
              aria-pressed={activeIndex === index}
              onBlur={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              type="button"
            >
              <i style={{ background: item.color }} />
              <span>{item.name}</span>
              <strong>{item.value} <small>({Math.round((item.value / total) * 100)}%)</small></strong>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
