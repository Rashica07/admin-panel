'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePage, useUpdatePage, useDeletePage } from '@/hooks/usePages';
import { PageForm, type PageFormValues } from '@/components/pages/page-form';
import { PageRevisionsPanel } from '@/components/pages/page-revisions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, ExternalLink, History, Paintbrush, Save } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const { data: page, isLoading } = usePage(id);
  const { mutateAsync: updatePage, isPending: isUpdating } = useUpdatePage();
  const { mutateAsync: deletePage, isPending: isDeleting } = useDeletePage();
  
  const [showHistory, setShowHistory] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-4xl">
          <div className="h-8 bg-neutral-800 rounded w-1/4"></div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 space-y-4">
              <div className="h-64 bg-neutral-800 rounded"></div>
              <div className="h-40 bg-neutral-800 rounded"></div>
            </div>
            <div className="col-span-4 space-y-4">
              <div className="h-32 bg-neutral-800 rounded"></div>
              <div className="h-32 bg-neutral-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20">
        <h2 className="text-xl font-semibold">Content not found</h2>
        <Link href="/dashboard/pages">
          <Button variant="outline">Go back</Button>
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: PageFormValues) => {
    try {
      let parsedContent: Record<string, unknown> = {};
      if (data.type === 'product') {
        parsedContent = {
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          sku: data.sku,
          stockQuantity: data.stockQuantity,
          inStock: data.inStock,
          variants: data.variants ?? [],
        };
      } else if (data.content) {
        try {
          parsedContent = JSON.parse(data.content);
        } catch {
          parsedContent = { text: data.content };
        }
      }

      await updatePage({
        id,
        data: {
          title: data.title,
          slug: data.slug,
          type: data.type,
          published: data.published,
          content: parsedContent,
        },
      });
      
      toast.success('Content saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update content');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deletePage(id);
      toast.success('Content deleted successfully');
      router.push('/dashboard/pages');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete content');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      
      {/* ─── HEADER ───────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/pages">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{page.title}</h1>
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowHistory(!showHistory)} className="border-border-strong text-neutral-300 hidden sm:flex">
            <History className="mr-2 h-4 w-4" />
            {showHistory ? 'Hide History' : 'Version History'}
          </Button>
          <Button variant="destructive" onClick={handleDelete} isLoading={isDeleting} size="icon" className="h-9 w-9 hidden sm:flex">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Link href={`/dashboard/builder?page=${id}`}>
            <Button variant="outline" className="border-border-strong bg-surface-2 text-white hover:bg-surface-2/80 gap-2">
              <Paintbrush className="h-4 w-4" />
              Visual Editor
            </Button>
          </Link>
          <Button type="submit" form="page-form" isLoading={isUpdating} className="gap-2 bg-brand text-black hover:bg-brand-hover">
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>
      </div>

      <PageRevisionsPanel pageId={id} open={showHistory} />

      <PageForm
        key={String(page.updatedAt)}
        defaultValues={{
          title: page.title,
          slug: page.slug,
          type: page.type,
          published: page.published,
          content: page.content,
        }}
        onSubmit={onSubmit}
        isLoading={isUpdating}
      />
    </div>
  );
}
