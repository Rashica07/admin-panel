'use client';

import { usePages } from '@/hooks/usePages';
import { usePhotos } from '@/hooks/usePhotos';
import { useApiStatus } from '@/hooks/useApiStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Image as ImageIcon,
  Settings,
  Paintbrush,
  Globe,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:21113';

function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'text-brand bg-brand/15',
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  accent?: string;
  className?: string;
}) {
  return (
    <Card className={cn('np-surface-hover', className)}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', accent)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-bold leading-tight truncate">{value}</div>
          <div className="text-[11px] uppercase tracking-wider text-neutral-500">{label}</div>
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
    year: 'numeric',
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">{today}</p>
        </div>
        <div className="flex gap-2">
          <a href={SITE_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2">
              <Globe className="h-4 w-4" /> Open Live Site
            </Button>
          </a>
          <Link href="/dashboard/builder">
            <Button className="gap-2">
              <Paintbrush className="h-4 w-4" /> Visual Editor
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          className="anim-fade-up stagger-1"
          label="Total Pages"
          value={isLoadingPages ? '–' : pages?.length ?? 0}
          icon={FileText}
        />
        <StatCard
          className="anim-fade-up stagger-2"
          label="Published"
          value={isLoadingPages ? '–' : publishedCount}
          icon={CheckCircle2}
          accent="text-green-400 bg-green-500/15"
        />
        <StatCard
          className="anim-fade-up stagger-3"
          label="Photos"
          value={isLoadingPhotos ? '–' : photos?.length ?? 0}
          icon={ImageIcon}
          accent="text-blue-400 bg-blue-500/15"
        />
        <StatCard
          className="anim-fade-up stagger-4"
          label="Live Sync"
          value={
            <span
              className={cn(
                'text-lg font-semibold',
                apiOnline === null ? 'text-neutral-400' : apiOnline ? 'text-green-400' : 'text-red-400'
              )}
            >
              {apiOnline === null ? 'Checking…' : apiOnline ? 'Online' : 'Offline'}
            </span>
          }
          icon={Zap}
          accent={apiOnline === false ? 'text-red-400 bg-red-500/15' : 'text-brand bg-brand/15'}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent activity */}
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPages ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-800" />
                    <div className="space-y-2">
                      <div className="h-4 w-[200px] animate-pulse rounded bg-neutral-800" />
                      <div className="h-4 w-[150px] animate-pulse rounded bg-neutral-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentPages.length > 0 ? (
              <div className="space-y-5">
                {recentPages.map((page) => (
                  <div key={page.id} className="flex items-center gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-neutral-900">
                      <FileText className="h-4 w-4 text-brand" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-none truncate">{page.title}</p>
                      <p className="text-xs text-neutral-500 mt-1.5">
                        Updated {formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true })}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        page.published
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-yellow-500/15 text-yellow-400'
                      )}
                    >
                      {page.published ? 'Live' : 'Draft'}
                    </span>
                    <Link href="/dashboard/builder">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center text-center">
                <FileText className="h-10 w-10 text-neutral-600 mb-4" />
                <p className="text-sm text-neutral-400">No pages found.</p>
                <Link href="/dashboard/pages/new" className="mt-4">
                  <Button variant="outline" size="sm">
                    Create your first page
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/builder" className="block">
              <Button className="w-full justify-start gap-2">
                <Paintbrush className="h-4 w-4" />
                Edit Website Content
              </Button>
            </Link>
            <Link href="/dashboard/photos" className="block">
              <Button className="w-full justify-start gap-2" variant="outline">
                <ImageIcon className="h-4 w-4 text-brand" />
                Upload Photo
              </Button>
            </Link>
            <Link href="/dashboard/settings" className="block">
              <Button className="w-full justify-start gap-2" variant="outline">
                <Settings className="h-4 w-4 text-brand" />
                Tenant Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
