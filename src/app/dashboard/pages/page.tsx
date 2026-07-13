'use client';

import { usePages, useUpdatePage } from '@/hooks/usePages';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileText, Package, Newspaper, CalendarDays, Plus, Search, Filter, MoreHorizontal, Download, Upload, CheckSquare, Square } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPages.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      
      {/* ─── HEADER ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Pages & Content</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 hidden sm:flex text-neutral-300 border-border-strong hover:bg-surface-2 hover:text-white">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button variant="outline" className="gap-2 hidden sm:flex text-neutral-300 border-border-strong hover:bg-surface-2 hover:text-white">
            <Upload className="h-4 w-4" /> Import
          </Button>
          <Link href="/dashboard/pages/new">
            <Button className="gap-2 shadow-md bg-brand text-black hover:bg-brand-hover">
              <Plus className="h-4 w-4" /> Add Content
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── TABS ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveType('all')}
          className={cn(
            'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors',
            activeType === 'all' ? 'bg-surface-2 text-white border border-border-strong' : 'bg-transparent border border-transparent text-neutral-400 hover:text-white hover:bg-surface-2/50'
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
                'flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors',
                activeType === type ? 'bg-surface-2 text-white border border-border-strong' : 'bg-transparent border border-transparent text-neutral-400 hover:text-white hover:bg-surface-2/50'
              )}
            >
              <meta.icon className="h-3 w-3 text-neutral-400" />
              {meta.label} ({count})
            </button>
          );
        })}
      </div>

      {/* ─── MAIN TABLE CARD ──────────────────────────────── */}
      <Card className="bg-surface border-border shadow-sm overflow-hidden">
        
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface-2/30">
          <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search content..."
                className="pl-9 h-9 bg-surface border-border-strong focus-visible:ring-brand"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-9 px-3 gap-2 border-border-strong text-neutral-400 hover:text-white hidden sm:flex">
              <Filter className="h-4 w-4" /> Filter
            </Button>
          </div>
        </div>

        {/* Bulk Actions Toolbar (shows when items selected) */}
        {selectedIds.size > 0 && (
          <div className="bg-brand/10 border-b border-brand/20 px-4 py-2 flex items-center justify-between text-sm anim-fade-in">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-brand">{selectedIds.size} selected</span>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-brand hover:bg-brand/20">Bulk edit</Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-brand hover:bg-brand/20">Change status</Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300">Delete files</Button>
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-brand" onClick={() => setSelectedIds(new Set())}>
              <Plus className="h-4 w-4 rotate-45" />
            </Button>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-400 bg-surface-2/50 border-b border-border/50">
              <tr>
                <th className="px-4 py-3 w-12 text-center font-medium">
                  <button onClick={toggleSelectAll} className="text-neutral-500 hover:text-white transition-colors">
                    {selectedIds.size === filteredPages.length && filteredPages.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-brand" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Modified</th>
                <th className="px-4 py-3 font-medium text-right w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                [1, 2, 3, 4].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 w-4 rounded bg-neutral-800 mx-auto" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-48 rounded bg-neutral-800" /></td>
                    <td className="px-4 py-4 hidden md:table-cell"><div className="h-4 w-16 rounded bg-neutral-800" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-20 rounded bg-neutral-800" /></td>
                    <td className="px-4 py-4 hidden md:table-cell"><div className="h-4 w-24 rounded bg-neutral-800" /></td>
                    <td className="px-4 py-4 text-right"></td>
                  </tr>
                ))
              ) : filteredPages.length > 0 ? (
                filteredPages.map((page) => {
                  const meta = metaFor(page.type ?? 'page');
                  const isSelected = selectedIds.has(page.id);
                  return (
                    <tr 
                      key={page.id} 
                      className={cn(
                        "group transition-colors",
                        isSelected ? "bg-brand/5 hover:bg-brand/10" : "hover:bg-surface-2/30"
                      )}
                    >
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleSelect(page.id)} className="text-neutral-500 hover:text-white transition-colors">
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-brand" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/50 bg-surface-2 shadow-sm", meta.color)}>
                            <meta.icon className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <Link href={`/dashboard/pages/${page.id}`} className="font-semibold text-white hover:underline">
                              {page.title}
                            </Link>
                            <div className="text-xs text-neutral-500 mt-0.5 truncate max-w-[200px]">
                              /{page.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-neutral-300 capitalize">{meta.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => togglePublish(page.id, page.published)}
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors',
                            page.published
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                          )}
                        >
                          {page.published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-400 hidden md:table-cell">
                        {formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content align="end" className="w-40 z-50 rounded-xl border border-border-strong bg-surface-2 p-1.5 shadow-xl animate-in fade-in-80 zoom-in-95">
                              <DropdownMenu.Item className="rounded-md px-2 py-1.5 text-sm text-neutral-200 hover:bg-brand/10 hover:text-brand cursor-pointer outline-none transition-colors" asChild>
                                <Link href={`/dashboard/pages/${page.id}`}>Edit Metadata</Link>
                              </DropdownMenu.Item>
                              <DropdownMenu.Item className="rounded-md px-2 py-1.5 text-sm text-neutral-200 hover:bg-brand/10 hover:text-brand cursor-pointer outline-none transition-colors" asChild>
                                <Link href={`/dashboard/builder?page=${page.id}`}>Visual Editor</Link>
                              </DropdownMenu.Item>
                              <div className="h-px bg-border my-1" />
                              <DropdownMenu.Item className="rounded-md px-2 py-1.5 text-sm text-neutral-200 hover:bg-surface cursor-pointer outline-none transition-colors">
                                Duplicate
                              </DropdownMenu.Item>
                              <DropdownMenu.Item className="rounded-md px-2 py-1.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer outline-none transition-colors">
                                Delete
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <FileText className="mx-auto h-12 w-12 text-neutral-600 mb-4" />
                    <h3 className="mb-2 text-lg font-medium text-white">No content found</h3>
                    <p className="mb-6 text-sm text-neutral-400 max-w-sm mx-auto">
                      {searchQuery ? 'Try adjusting your search query or filters to find what you are looking for.' : 'Get started by creating a new page, product, article or event.'}
                    </p>
                    {!searchQuery && (
                      <Link href="/dashboard/pages/new">
                        <Button className="bg-brand text-black hover:bg-brand-hover">Add Content</Button>
                      </Link>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
