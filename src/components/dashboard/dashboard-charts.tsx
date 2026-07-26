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
import type { DashboardData } from "@/types/dashboard";

const tooltipStyle = {
  background: "#171b2a",
  border: "1px solid #2a3145",
  borderRadius: "10px",
  color: "#f5f7fc",
  fontSize: "12px",
};

const tooltipWrapperStyle = {
  outline: "none",
  transition: "opacity 180ms ease, transform 180ms ease",
};

const activeEpisodeDot = {
  r: 5,
  fill: "#c084fc",
  stroke: "#f5f3ff",
  strokeWidth: 2,
};

export function StatusDonut({ data }: { data: DashboardData["statusDistribution"] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData = total === 0 ? [{ name: "Sin datos", value: 1, color: "#252c40" }] : data;

  return (
    <div className="status-chart-grid">
      <div className="donut-wrap" aria-label={`Distribución de ${total} animes por estado`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              innerRadius={43}
              outerRadius={60}
              paddingAngle={total === 0 ? 0 : 2}
              stroke="none"
              isAnimationActive={false}
              onMouseEnter={(_, index) => total > 0 && setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  className="donut-segment"
                  key={entry.name}
                  fill={entry.color}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} animationDuration={180} wrapperStyle={tooltipWrapperStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center"><strong>{total}</strong><span>Total</span></div>
      </div>
      <ul className="status-legend">
        {data.map((item, index) => (
          <li key={item.name}>
            <button
              className={activeIndex === index ? "is-active" : undefined}
              type="button"
              aria-label={`Resaltar ${item.name}: ${item.value} animes`}
              aria-pressed={activeIndex === index}
              onBlur={() => setActiveIndex(null)}
              onClick={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <span className="legend-dot" style={{ background: item.color }} />
              <span>{item.name}</span>
              <strong>{item.value} <small>({total === 0 ? 0 : Math.round((item.value / total) * 100)}%)</small></strong>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EpisodeTrend({ data }: { data: DashboardData["episodeTrend"] }) {
  return (
    <div className="trend-chart" aria-label="Tendencia de episodios vistos en los últimos 30 días">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 5, bottom: 8, left: -20 }}>
          <defs>
            <linearGradient id="episodesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.42} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#202638" strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="day" padding={{ left: 12, right: 4 }} tick={{ fill: "#747e94", fontSize: 9 }} axisLine={false} tickLine={false} tickMargin={8} />
          <YAxis tick={{ fill: "#747e94", fontSize: 9 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "#3a4259" }} animationDuration={180} wrapperStyle={tooltipWrapperStyle} />
          <Area
            type="monotone"
            dataKey="episodes"
            stroke="#9f67ff"
            strokeWidth={2.5}
            fill="url(#episodesGradient)"
            isAnimationActive={false}
            activeDot={activeEpisodeDot}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
