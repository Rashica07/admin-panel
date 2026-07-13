'use client';

import { usePages } from '@/hooks/usePages';
import { usePhotos } from '@/hooks/usePhotos';
import { useApiStatus } from '@/hooks/useApiStatus';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Image as ImageIcon,
  Settings,
  Paintbrush,
  Globe,
  Zap,
  CheckCircle2,
  TrendingUp,
  Plus,
  ArrowUpRight,
  MonitorPlay,
  Lightbulb,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:21113';

// Mock chart data
const chartData = [
  { date: 'Mon', views: 400 },
  { date: 'Tue', views: 300 },
  { date: 'Wed', views: 550 },
  { date: 'Thu', views: 450 },
  { date: 'Fri', views: 700 },
  { date: 'Sat', views: 650 },
  { date: 'Sun', views: 800 },
];

function StatCard({
  label,
  value,
  trend,
  className,
}: {
  label: string;
  value: React.ReactNode;
  trend?: string;
  className?: string;
}) {
  return (
    <Card className={cn('bg-surface hover:bg-surface-2 transition-colors border-border shadow-sm', className)}>
      <CardContent className="p-5">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-400">{label}</span>
          <div className="flex items-end gap-3 mt-1">
            <span className="text-2xl font-bold text-white leading-none">{value}</span>
            {trend && (
              <span className="flex items-center text-xs font-semibold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                {trend}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardOverview() {
  const { data: session } = useSession();
  const { data: pages, isLoading: isLoadingPages } = usePages();
  const { data: photos, isLoading: isLoadingPhotos } = usePhotos();
  const apiOnline = useApiStatus();

  const firstName = session?.user?.name?.split(' ')[0];
  const publishedCount = pages?.filter((p) => p.published).length ?? 0;

  // Last 5 updated pages
  const recentPages = pages
    ? [...pages]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5)
    : [];

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ─── HEADER ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {greeting()}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">Here's what's happening with your store today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/builder">
            <Button className="gap-2 shadow-md">
              <Plus className="h-4 w-4" /> Add Page
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── STATS GRID ───────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Pages" value={isLoadingPages ? '–' : pages?.length ?? 0} trend="12%" className="anim-fade-up stagger-1" />
        <StatCard label="Published" value={isLoadingPages ? '–' : publishedCount} trend="5%" className="anim-fade-up stagger-2" />
        <StatCard label="Media Assets" value={isLoadingPhotos ? '–' : photos?.length ?? 0} trend="24%" className="anim-fade-up stagger-3" />
        <StatCard 
          label="Live Sync Status" 
          value={
            <span className={cn('text-lg', apiOnline === null ? 'text-neutral-400' : apiOnline ? 'text-green-400' : 'text-red-400')}>
              {apiOnline === null ? 'Checking…' : apiOnline ? 'Online' : 'Offline'}
            </span>
          } 
          className="anim-fade-up stagger-4" 
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ─── MAIN COLUMN (Chart + Table) ────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Chart Card */}
          <Card className="bg-surface border-border shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50 bg-surface-2/30">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">Store Sessions</CardTitle>
                <CardDescription>Page views over the last 7 days</CardDescription>
              </div>
              <select className="h-8 rounded-md border border-border-strong bg-surface-2 px-2 text-xs text-neutral-300 focus:outline-none focus:ring-1 focus:ring-brand">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[280px] w-full pt-6 pr-6 pb-2 pl-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff8c00" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ff8c00" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#888' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#888' }} 
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="views" 
                      stroke="#ff8c00" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorViews)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Table Card */}
          <Card className="bg-surface border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Recent Pages</CardTitle>
              <Link href="/dashboard/pages">
                <Button variant="link" className="text-brand h-auto p-0 font-medium">View all</Button>
              </Link>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-400 bg-surface-2/50 uppercase border-b border-border/50">
                  <tr>
                    <th className="px-5 py-3 font-medium">Page Title</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Date Modified</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {isLoadingPages ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-5 py-4"><div className="h-4 bg-neutral-800 rounded w-3/4"></div></td>
                        <td className="px-5 py-4"><div className="h-4 bg-neutral-800 rounded w-16"></div></td>
                        <td className="px-5 py-4"><div className="h-4 bg-neutral-800 rounded w-24"></div></td>
                        <td className="px-5 py-4"></td>
                      </tr>
                    ))
                  ) : recentPages.length > 0 ? (
                    recentPages.map((page) => (
                      <tr key={page.id} className="hover:bg-surface-2/30 transition-colors group">
                        <td className="px-5 py-3.5 font-medium text-white flex items-center gap-3">
                          <FileText className="h-4 w-4 text-neutral-500" />
                          <Link href={`/dashboard/pages/${page.id}`} className="hover:underline">{page.title}</Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                            page.published ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
                          )}>
                            {page.published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-neutral-400">
                          {formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true })}
                        </td>
                        <td className="px-5 py-3.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/dashboard/pages/${page.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs font-medium">Edit</Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-neutral-500">
                        No pages found. <Link href="/dashboard/pages/new" className="text-brand hover:underline">Create one</Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* ─── RIGHT SIDEBAR (Quick Actions / Setup) ──────── */}
        <div className="space-y-6">
          <Card className="bg-brand/5 border-brand/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Lightbulb className="h-24 w-24 text-brand" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-brand">Setup Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-300 mb-5 relative z-10">
                You're almost there! Complete these remaining steps to launch your store.
              </p>
              <div className="space-y-3 relative z-10">
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  <span className="text-neutral-400 line-through">Create workspace</span>
                </div>
                <div className="flex items-start gap-3 text-sm font-medium text-white">
                  <div className="h-5 w-5 rounded-full border-2 border-brand flex items-center justify-center shrink-0">
                    <div className="h-2 w-2 rounded-full bg-brand" />
                  </div>
                  Add your first page
                </div>
                <div className="flex items-start gap-3 text-sm text-neutral-400">
                  <div className="h-5 w-5 rounded-full border-2 border-neutral-600 shrink-0" />
                  Customize your theme
                </div>
                <div className="flex items-start gap-3 text-sm text-neutral-400">
                  <div className="h-5 w-5 rounded-full border-2 border-neutral-600 shrink-0" />
                  Invite your team
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col">
                <Link href="/dashboard/builder" className="flex items-center gap-3 p-4 hover:bg-surface-2 transition-colors border-b border-border/50">
                  <div className="h-8 w-8 rounded bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    <Paintbrush className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Visual Editor</p>
                    <p className="text-xs text-neutral-400">Design your live site</p>
                  </div>
                </Link>
                <Link href="/dashboard/photos" className="flex items-center gap-3 p-4 hover:bg-surface-2 transition-colors border-b border-border/50">
                  <div className="h-8 w-8 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Upload Media</p>
                    <p className="text-xs text-neutral-400">Add photos to your library</p>
                  </div>
                </Link>
                <Link href="/dashboard/settings" className="flex items-center gap-3 p-4 hover:bg-surface-2 transition-colors">
                  <div className="h-8 w-8 rounded bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                    <Settings className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Manage Settings</p>
                    <p className="text-xs text-neutral-400">Configure your tenant</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
