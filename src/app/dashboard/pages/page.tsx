'use client';

import { usePages, useUpdatePage } from '@/hooks/usePages';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileText, Package, Newspaper, CalendarDays, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  page: { label: 'Page', icon: FileText, color: 'text-brand bg-brand/15' },
  product: { label: 'Product', icon: Package, color: 'text-blue-400 bg-blue-500/15' },
  article: { label: 'Article', icon: Newspaper, color: 'text-purple-400 bg-purple-500/15' },
  event: { label: 'Event', icon: CalendarDays, color: 'text-amber-400 bg-amber-500/15' },
};

function metaFor(type: string) {
  return TYPE_META[type] ?? { label: type, icon: FileText, color: 'text-neutral-400 bg-neutral-800' };
}

export default function PagesList() {
  const { data: pages, isLoading } = usePages();
  const { mutateAsync: updatePage } = useUpdatePage();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<string>(searchParams.get('type') ?? 'all');

  // Keep the tab in sync when navigated here via a sidebar link (?type=product)
  useEffect(() => {
    setActiveType(searchParams.get('type') ?? 'all');
  }, [searchParams]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of pages ?? []) counts[p.type ?? 'page'] = (counts[p.type ?? 'page'] ?? 0) + 1;
    return counts;
  }, [pages]);

  const filteredPages = (pages ?? []).filter((page) => {
    const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = activeType === 'all' || (page.type ?? 'page') === activeType;
    return matchesSearch && matchesType;
  });

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await updatePage({ id, data: { published: !currentStatus } });
    } catch (error) {
      console.error('Failed to toggle publish status', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Headless Pages</h1>
          <p className="text-neutral-400">
            Every content type your workspace has — pages, products, articles, events. Raw content,
            for developers.
          </p>
        </div>
        <Link href="/dashboard/pages/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Content
          </Button>
        </Link>
      </div>

      {/* Type filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveType('all')}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
            activeType === 'all' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-400 hover:text-white'
          )}
        >
          All ({pages?.length ?? 0})
        </button>
        {Object.entries(typeCounts).map(([type, count]) => {
          const meta = metaFor(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                activeType === type ? meta.color : 'bg-neutral-900 text-neutral-400 hover:text-white'
              )}
            >
              <meta.icon className="h-3 w-3" />
              {meta.label} ({count})
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Search by title..."
              className="max-w-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-12 w-full animate-pulse rounded-md bg-neutral-800" />
                </div>
              ))}
            </div>
          ) : filteredPages.length > 0 ? (
            <div className="rounded-md border border-border">
              <div className="grid grid-cols-12 gap-4 border-b border-border bg-neutral-900/50 px-4 py-3 text-sm font-medium text-neutral-400">
                <div className="col-span-5 md:col-span-4">Title</div>
                <div className="hidden md:block col-span-2">Type</div>
                <div className="hidden md:block col-span-2">Slug</div>
                <div className="col-span-3 md:col-span-2">Status</div>
                <div className="hidden md:block col-span-1">Updated</div>
                <div className="col-span-4 md:col-span-1 text-right">Actions</div>
              </div>
              <div className="divide-y divide-border">
                {filteredPages.map((page) => {
                  const meta = metaFor(page.type ?? 'page');
                  return (
                    <div key={page.id} className="grid grid-cols-12 items-center gap-4 px-4 py-3">
                      <div className="col-span-5 flex items-center md:col-span-4">
                        <meta.icon className="mr-2 h-4 w-4 text-brand shrink-0" />
                        <span className="truncate font-medium">{page.title}</span>
                      </div>
                      <div className="hidden md:block col-span-2">
                        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', meta.color)}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="hidden truncate text-sm text-neutral-400 md:block col-span-2">
                        {page.type === 'product' && typeof (page.content as any)?.price === 'number'
                          ? `€${(page.content as any).price.toFixed(2)}${(page.content as any).stockQuantity !== undefined ? ` · ${(page.content as any).stockQuantity} in stock` : ''}`
                          : `/${page.slug}`}
                      </div>
                      <div className="col-span-3 md:col-span-2">
                        <button
                          onClick={() => togglePublish(page.id, page.published)}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                            page.published
                              ? 'bg-brand/20 text-brand hover:bg-brand/30'
                              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                          }`}
                        >
                          {page.published ? 'Published' : 'Draft'}
                        </button>
                      </div>
                      <div className="hidden text-sm text-neutral-400 md:block col-span-1">
                        {formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true })}
                      </div>
                      <div className="col-span-4 flex justify-end md:col-span-1">
                        <Link href={`/dashboard/pages/${page.id}`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex h-[300px] flex-col items-center justify-center text-center">
              <FileText className="mb-4 h-12 w-12 text-neutral-600" />
              <h3 className="mb-2 text-lg font-medium">No content found</h3>
              <p className="mb-4 text-sm text-neutral-400">
                {searchQuery ? 'Try adjusting your search query.' : 'Get started by creating a new page, product, article or event.'}
              </p>
              {!searchQuery && (
                <Link href="/dashboard/pages/new">
                  <Button variant="outline">Create New Content</Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
