'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { createPulseClient } from '@/lib/novus-pulse-client';
import { useUIStore } from '@/store/useStore';
import { PlanGate } from '@/components/plan-gate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Users,
  Clock,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  TrendingUp,
  Eye,
  MousePointerClick,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// ── Helpers ──────────────────────────────────────────────

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

const DEVICE_ICONS: Record<string, React.ElementType> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

const BAR_COLORS = [
  'bg-brand',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-sky-500',
  'bg-rose-500',
  'bg-amber-500',
];

// ── Component ────────────────────────────────────────────

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const { activeTenantId } = useUIStore();
  const [range, setRange] = useState(30);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics', activeTenantId, range],
    queryFn: async () => {
      const pulse = createPulseClient(session?.accessToken);
      return pulse.getAnalyticsStats(range);
    },
    enabled: !!session?.accessToken,
    refetchInterval: 30_000,
  });

  return (
    <PlanGate feature="analytics">
      <div className="space-y-8 pb-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <BarChart3 className="h-7 w-7 text-brand" /> Analytics & Reports
            </h1>
            <p className="text-sm text-neutral-400 mt-2">
              Track your website traffic and visitor behavior in real-time.
            </p>
          </div>
          <div className="flex p-1 rounded-xl bg-surface-2 border border-border-strong w-max">
            {[7, 14, 30].map((d) => (
              <Button
                key={d}
                variant="ghost"
                size="sm"
                className={cn(
                  "text-sm px-5 py-1.5 rounded-lg font-medium transition-all",
                  range === d ? "bg-white text-black shadow-sm" : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                )}
                onClick={() => setRange(d)}
              >
                {d} Days
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl bg-surface-2 border border-border-strong" />
              ))}
            </div>
            <div className="h-96 animate-pulse rounded-xl bg-surface-2 border border-border-strong" />
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 anim-fade-up stagger-1">
              <StatCard
                icon={Eye}
                label="Total Views"
                value={formatNum(stats?.totalViews ?? 0)}
                hint="total page views"
                trend="+12%"
                trendUp={true}
                accent="text-brand"
                accentBg="bg-brand/10"
                accentBorder="border-brand/20"
              />
              <StatCard
                icon={Users}
                label="Unique Visitors"
                value={formatNum(stats?.uniqueVisitors ?? 0)}
                hint="fingerprinted sessions"
                trend="+8%"
                trendUp={true}
                accent="text-emerald-400"
                accentBg="bg-emerald-500/10"
                accentBorder="border-emerald-500/20"
              />
              <StatCard
                icon={MousePointerClick}
                label="Top Referrer"
                value={stats?.referrers?.[0]?.referrer ?? 'Direct'}
                hint={`${formatNum(stats?.referrers?.[0]?.count ?? 0)} visits`}
                accent="text-violet-400"
                accentBg="bg-violet-500/10"
                accentBorder="border-violet-500/20"
              />
              <StatCard
                icon={TrendingUp}
                label="Avg. Daily Views"
                value={formatNum(
                  stats?.dailyViews?.length
                    ? Math.round(
                        stats.dailyViews.reduce((s: number, d: any) => s + d.views, 0) /
                          stats.dailyViews.length,
                      )
                    : 0,
                )}
                hint={`daily average`}
                trend="-3%"
                trendUp={false}
                accent="text-sky-400"
                accentBg="bg-sky-500/10"
                accentBorder="border-sky-500/20"
              />
            </div>

            {/* Daily Views Area Chart */}
            <Card className="np-surface overflow-hidden anim-fade-up stagger-2">
              <CardHeader className="bg-surface-2/30 border-b border-border/50 pb-5">
                <CardTitle className="text-xl">Traffic Overview</CardTitle>
              </CardHeader>
              <CardContent className="pt-8 pb-4 pl-0">
                {stats?.dailyViews?.length > 0 ? (
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.dailyViews} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--brand-orange)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="var(--brand-orange)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(val) => {
                            const date = new Date(val);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          }}
                          stroke="rgba(255,255,255,0.4)" 
                          fontSize={12} 
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.4)" 
                          fontSize={12} 
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => formatNum(val)}
                          dx={-10}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="views" 
                          stroke="var(--brand-orange)" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorViews)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message="No pageview data yet. Install the tracking snippet in your site to start collecting data." />
                )}
              </CardContent>
            </Card>

            {/* Bottom Grid */}
            <div className="grid gap-6 lg:grid-cols-3 anim-fade-up stagger-3">
              
              {/* Top Pages */}
              <Card className="np-surface overflow-hidden lg:col-span-2">
                <CardHeader className="bg-surface-2/30 border-b border-border/50 pb-5">
                  <CardTitle className="text-lg">Top Pages</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {stats?.topPages?.length > 0 ? (
                    <div className="space-y-6">
                      {stats.topPages.map((page: any, i: number) => {
                        const max = stats.topPages[0].views;
                        const pct = max > 0 ? (page.views / max) * 100 : 0;
                        return (
                          <div key={page.slug} className="space-y-2.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-white truncate max-w-[70%]">/{page.slug}</span>
                              <span className="text-neutral-400 font-mono text-xs">{formatNum(page.views)} views</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-surface-2 border border-border overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all duration-1000 ease-out', BAR_COLORS[i % BAR_COLORS.length])}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState message="No page data collected yet." />
                  )}
                </CardContent>
              </Card>

              {/* Device & Browser */}
              <div className="space-y-6">
                <Card className="np-surface overflow-hidden">
                  <CardHeader className="bg-surface-2/30 border-b border-border/50 pb-4">
                    <CardTitle className="text-lg">Devices</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5">
                    {stats?.devices?.length > 0 ? (
                      <div className="space-y-1">
                        {stats.devices.map((d: any) => {
                          const Icon = DEVICE_ICONS[d.device.toLowerCase()] ?? Globe;
                          return (
                            <div key={d.device} className="flex items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-surface-2 transition-colors">
                              <div className="h-8 w-8 rounded-md bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                                <Icon className="h-4 w-4 shrink-0" />
                              </div>
                              <span className="text-sm font-medium text-neutral-200 flex-1 capitalize">{d.device}</span>
                              <span className="text-sm text-neutral-400 font-mono">{formatNum(d.count)}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500 pt-2 text-center">No device data yet</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="np-surface overflow-hidden">
                  <CardHeader className="bg-surface-2/30 border-b border-border/50 pb-4">
                    <CardTitle className="text-lg">Browsers</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5">
                    {stats?.browsers?.length > 0 ? (
                      <div className="space-y-5">
                        {stats.browsers.map((b: any, i: number) => {
                          const max = stats.browsers[0].count;
                          const pct = max > 0 ? (b.count / max) * 100 : 0;
                          return (
                            <div key={b.browser} className="space-y-2 px-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-neutral-200 capitalize">{b.browser}</span>
                                <span className="text-neutral-400 font-mono text-xs">{formatNum(b.count)}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden border border-border">
                                <div
                                  className={cn('h-full rounded-full transition-all duration-1000 ease-out', BAR_COLORS[i % BAR_COLORS.length])}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500 pt-2 text-center">No browser data yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </PlanGate>
  );
}

// ── Sub-components ───────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  trend,
  trendUp,
  accent,
  accentBg,
  accentBorder
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint: string;
  trend?: string;
  trendUp?: boolean;
  accent: string;
  accentBg: string;
  accentBorder: string;
}) {
  return (
    <Card className="np-surface hover:np-surface-hover group overflow-hidden relative transition-all">
      <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[50px] rounded-full opacity-20 -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:opacity-40", accentBg)} />
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm border', accentBg, accentBorder, accent)}>
            <Icon className="h-6 w-6" />
          </div>
          {trend && (
            <div className={cn("flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full", trendUp ? "text-green-400 bg-green-500/10" : "text-rose-400 bg-rose-500/10")}>
              {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trend}
            </div>
          )}
        </div>
        <div className="mt-6">
          <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm font-medium text-neutral-400">{label}</p>
            <span className="text-neutral-600 font-mono text-[10px] uppercase tracking-wider">{hint}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const date = new Date(label).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    return (
      <div className="bg-surface border border-border-strong rounded-xl p-4 shadow-xl">
        <p className="text-xs text-neutral-400 mb-2 font-medium uppercase tracking-wider">{date}</p>
        <p className="text-lg font-bold text-white flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-brand shadow-[0_0_8px_rgba(255,140,0,0.5)]"></span>
          {formatNum(payload[0].value)} <span className="text-sm font-normal text-neutral-400">views</span>
        </p>
      </div>
    );
  }
  return null;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 bg-surface-2 border border-border-strong rounded-2xl flex items-center justify-center mb-6 shadow-sm">
        <BarChart3 className="h-8 w-8 text-neutral-600" />
      </div>
      <p className="text-sm text-neutral-400 max-w-sm leading-relaxed">{message}</p>
    </div>
  );
}
