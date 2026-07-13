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
} from 'lucide-react';

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <BarChart3 className="h-7 w-7 text-brand" /> Analytics & Reports
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Track your website traffic and visitor behavior in real-time.
            </p>
          </div>
          <div className="flex gap-1 rounded-lg border border-border p-1">
            {[7, 14, 30].map((d) => (
              <Button
                key={d}
                variant={range === d ? 'default' : 'ghost'}
                size="sm"
                className="text-xs px-3"
                onClick={() => setRange(d)}
              >
                {d}d
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-neutral-900" />
            ))}
            <div className="col-span-full h-64 animate-pulse rounded-xl bg-neutral-900" />
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Eye}
                label="Total Views"
                value={formatNum(stats?.totalViews ?? 0)}
                hint={`Last ${range} days`}
                accent="text-brand"
              />
              <StatCard
                icon={Users}
                label="Unique Visitors"
                value={formatNum(stats?.uniqueVisitors ?? 0)}
                hint="By visitor fingerprint"
                accent="text-emerald-400"
              />
              <StatCard
                icon={MousePointerClick}
                label="Top Referrer"
                value={stats?.referrers?.[0]?.referrer ?? 'Direct'}
                hint={`${formatNum(stats?.referrers?.[0]?.count ?? 0)} visits`}
                accent="text-violet-400"
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
                hint={`Over ${range} days`}
                accent="text-sky-400"
              />
            </div>

            {/* Daily Views Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daily Pageviews</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.dailyViews?.length > 0 ? (
                  <DailyChart data={stats.dailyViews} />
                ) : (
                  <EmptyState message="No pageview data yet. Install the tracking snippet in your site to start collecting data." />
                )}
              </CardContent>
            </Card>

            {/* Bottom Grid */}
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Top Pages */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Top Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.topPages?.length > 0 ? (
                    <div className="space-y-3">
                      {stats.topPages.map((page: any, i: number) => {
                        const max = stats.topPages[0].views;
                        const pct = max > 0 ? (page.views / max) * 100 : 0;
                        return (
                          <div key={page.slug} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-mono text-neutral-300">/{page.slug}</span>
                              <span className="text-neutral-400">{formatNum(page.views)} views</span>
                            </div>
                            <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all', BAR_COLORS[i % BAR_COLORS.length])}
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
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Devices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.devices?.length > 0 ? (
                      <div className="space-y-3">
                        {stats.devices.map((d: any) => {
                          const Icon = DEVICE_ICONS[d.device.toLowerCase()] ?? Globe;
                          return (
                            <div key={d.device} className="flex items-center gap-3">
                              <Icon className="h-4 w-4 text-neutral-400 shrink-0" />
                              <span className="text-sm flex-1 capitalize">{d.device}</span>
                              <span className="text-sm text-neutral-400 font-mono">{formatNum(d.count)}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500">No device data yet</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Browsers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.browsers?.length > 0 ? (
                      <div className="space-y-2">
                        {stats.browsers.map((b: any, i: number) => {
                          const max = stats.browsers[0].count;
                          const pct = max > 0 ? (b.count / max) * 100 : 0;
                          return (
                            <div key={b.browser} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-neutral-300 capitalize">{b.browser}</span>
                                <span className="text-neutral-500">{formatNum(b.count)}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                                <div
                                  className={cn('h-full rounded-full', BAR_COLORS[i % BAR_COLORS.length])}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500">No browser data yet</p>
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
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint: string;
  accent: string;
}) {
  return (
    <Card className="group hover:border-brand/30 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 border border-border', accent)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-neutral-400 mt-1">{label}</p>
          <p className="text-[10px] text-neutral-600 mt-0.5">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DailyChart({ data }: { data: { date: string; views: number }[] }) {
  const max = Math.max(...data.map((d) => d.views), 1);

  return (
    <div className="flex items-end gap-1 h-40">
      {data.map((d) => {
        const height = Math.max((d.views / max) * 100, 2);
        const day = new Date(d.date).toLocaleDateString('en', { weekday: 'short' });
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group" title={`${d.date}: ${d.views} views`}>
            <span className="text-[9px] text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {d.views}
            </span>
            <div
              className="w-full rounded-t-sm bg-brand/70 group-hover:bg-brand transition-all min-h-[2px]"
              style={{ height: `${height}%` }}
            />
            <span className="text-[9px] text-neutral-600">{day}</span>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BarChart3 className="h-8 w-8 text-neutral-700 mb-3" />
      <p className="text-sm text-neutral-500 max-w-xs">{message}</p>
    </div>
  );
}
