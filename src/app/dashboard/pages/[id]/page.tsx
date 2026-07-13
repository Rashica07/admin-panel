'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePage, useUpdatePage, useDeletePage } from '@/hooks/usePages';
import { PageForm, type PageFormValues } from '@/components/pages/page-form';
import { PageRevisionsPanel } from '@/components/pages/page-revisions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, ExternalLink, History } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';


export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const { data: page, isLoading } = usePage(id);
  const { mutateAsync: updatePage, isPending: isUpdating } = useUpdatePage();
  const { mutateAsync: deletePage, isPending: isDeleting } = useDeletePage();
  
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">Loading...</div>
    );
  }

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20">
        <h2 className="text-xl font-semibold">Page not found</h2>
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
      
      toast.success('Page updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update page');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deletePage(id);
      toast.success('Page deleted successfully');
      router.push('/dashboard/pages');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete page');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/pages">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Page</h1>
          <p className="text-sm text-neutral-400">Make changes to your page.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
            <History className="mr-2 h-4 w-4 text-brand" />
            {showHistory ? 'Hide History' : 'History'}
          </Button>
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <ExternalLink className="mr-2 h-4 w-4 text-brand" />
            {showPreview ? 'Hide Preview' : 'Preview'}
          </Button>
          <Button variant="destructive" onClick={handleDelete} isLoading={isDeleting}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button type="submit" form="page-form" isLoading={isUpdating}>
            Save Changes
          </Button>
        </div>
      </div>

      <PageRevisionsPanel pageId={id} open={showHistory} />

      {showPreview && (
        <Card className="border-brand">
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-brand">Live Preview</h3>
            <div className="rounded-md border border-border bg-neutral-900 p-4 font-mono text-sm">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(page.content, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

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
