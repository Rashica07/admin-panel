'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePages, useUpdatePage } from '@/hooks/usePages';
import { PlanGate } from '@/components/plan-gate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Search,
  Globe,
  ExternalLink,
  X,
  Check,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

export default function SeoPage() {
  const { data: pages, isLoading } = usePages();
  const [editingPage, setEditingPage] = useState<any | null>(null);

  return (
    <PlanGate feature="seo">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Search className="h-7 w-7 text-brand" /> SEO & Meta Tags
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Optimize every page for search engines and social sharing.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-neutral-900" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {(pages ?? []).map((page: any) => {
              const seo = page.content?.seo ?? {};
              const hasData = seo.title || seo.description;
              return (
                <Card
                  key={page.id}
                  className={cn(
                    'group cursor-pointer hover:border-brand/40 transition-colors',
                    editingPage?.id === page.id && 'border-brand/50',
                  )}
                  onClick={() => setEditingPage(page)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl shrink-0',
                      hasData ? 'bg-green-500/10 text-green-400' : 'bg-neutral-800 text-neutral-500',
                    )}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{page.title}</p>
                      <p className="text-xs text-neutral-500 font-mono">/{page.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasData ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                          <Check className="h-3 w-3" /> Optimized
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-600">No SEO data</span>
                      )}
                      <Button variant="outline" size="sm" className="gap-1.5">
                        Edit SEO
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* SEO Editor Drawer */}
        {editingPage && (
          <SeoEditor page={editingPage} onClose={() => setEditingPage(null)} />
        )}
      </div>
    </PlanGate>
  );
}

// ── SEO Editor ───────────────────────────────────────────

function SeoEditor({ page, onClose }: { page: any; onClose: () => void }) {
  const updatePage = useUpdatePage();
  const seo = page.content?.seo ?? {};
  const [title, setTitle] = useState(seo.title ?? '');
  const [description, setDescription] = useState(seo.description ?? '');
  const [ogImage, setOgImage] = useState(seo.ogImage ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updatePage.mutateAsync({
        id: page.id,
        data: {
          content: {
            ...page.content,
            seo: { title, description, ogImage },
          },
        },
      });
      toast.success('SEO data saved!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-background border-l border-border overflow-y-auto">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">SEO Settings</h2>
            <p className="text-xs text-neutral-500 font-mono">/{page.slug}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-neutral-400">Meta Title</Label>
              <span className={cn('text-[10px] font-mono', title.length > 60 ? 'text-red-400' : 'text-neutral-600')}>
                {title.length}/60
              </span>
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={page.title}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-neutral-400">Meta Description</Label>
              <span className={cn('text-[10px] font-mono', description.length > 160 ? 'text-red-400' : 'text-neutral-600')}>
                {description.length}/160
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A compelling description of this page..."
              rows={3}
              className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand resize-none"
            />
          </div>

          {/* OG Image */}
          <div className="space-y-2">
            <Label className="text-xs text-neutral-400 flex items-center gap-1.5">
              <ImageIcon className="h-3 w-3" /> OG Image URL
            </Label>
            <Input
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              placeholder="https://yoursite.com/og-image.jpg"
            />
          </div>

          {/* Google Preview */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Google Search Preview</p>
            <div className="rounded-xl border border-border bg-white p-4 space-y-1">
              <p className="text-xs text-green-700 font-mono truncate">
                yoursite.com › {page.slug}
              </p>
              <p className="text-blue-700 text-base font-medium truncate hover:underline cursor-default">
                {title || page.title}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2">
                {description || 'No description set. Add a meta description to improve your search appearance.'}
              </p>
            </div>
          </div>

          {/* Social Preview */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Social Share Preview</p>
            <div className="rounded-xl border border-border overflow-hidden">
              {ogImage ? (
                <div className="aspect-[1.91/1] bg-neutral-800 flex items-center justify-center">
                  <img src={ogImage} alt="OG Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-[1.91/1] bg-neutral-900 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-neutral-700" />
                </div>
              )}
              <div className="p-3 border-t border-border bg-neutral-950">
                <p className="text-[10px] text-neutral-500 uppercase">yoursite.com</p>
                <p className="text-sm font-semibold truncate mt-0.5">{title || page.title}</p>
                <p className="text-xs text-neutral-400 truncate">{description || 'No description'}</p>
              </div>
            </div>
          </div>

          {/* Save */}
          <Button className="w-full gap-2" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : (
              <>
                <Check className="h-4 w-4" /> Save SEO Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
