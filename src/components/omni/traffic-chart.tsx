'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Point = { date: string; views: number };

/** Daily page views. One series, one colour, readable axes — no glow fills. */
export function TrafficChart({ data, height = 180 }: { data: Point[]; height?: number }) {
  const rows = data.map((d) => ({
    label: new Date(`${d.date}T12:00:00`).toLocaleDateString('en-US', data.length > 10 ? { month: 'short', day: 'numeric' } : { weekday: 'short' }),
    views: d.views,
  }));
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="#2c2b2d" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8c8476', fontFamily: 'var(--font-data)' }} dy={6} interval="preserveStartEnd" />
          <YAxis axisLine={false} tickLine={false} width={44} tick={{ fontSize: 11, fill: '#8c8476', fontFamily: 'var(--font-data)' }} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: '#3c3a39' }}
            contentStyle={{ background: '#1d1d20', border: '1px solid #3c3a39', borderRadius: 6, fontSize: 12, padding: '6px 10px' }}
            labelStyle={{ color: '#aea492', marginBottom: 2 }}
            itemStyle={{ color: '#ede4d3', fontFamily: 'var(--font-data)' }}
            formatter={(v) => [Number(v).toLocaleString(), 'views']}
          />
          <Line type="monotone" dataKey="views" stroke="#e86373" strokeWidth={1.75} dot={false} activeDot={{ r: 3, fill: '#e86373', stroke: '#1d1d20' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal strip of key figures separated by hairlines — replaces stat-card grids. */
export function FigureStrip({ items }: { items: { label: string; value: React.ReactNode; hint?: React.ReactNode; href?: string }[] }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-surface sm:grid-cols-3 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none">
      {items.map((it, i) => {
        const body = (
          <>
            <p className="omni-label">{it.label}</p>
            <p className="mt-1 font-mono text-[22px] leading-none tabular-nums text-foreground">{it.value}</p>
            {it.hint && <p className="mt-1.5 truncate text-xs text-neutral-500">{it.hint}</p>}
          </>
        );
        const cls = 'block border-border px-4 py-3 [&:not(:first-child)]:border-l max-lg:[&:nth-child(n+3)]:border-t';
        return it.href ? (
          <a key={i} href={it.href} className={`${cls} transition-colors hover:bg-surface-2/60`}>
            {body}
          </a>
        ) : (
          <div key={i} className={cls}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
