'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreatePage } from '@/hooks/usePages';
import { PageForm, type PageFormValues } from '@/components/pages/page-form';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';


export default function NewPage() {
  const router = useRouter();
  const { mutateAsync: createPage, isPending } = useCreatePage();

  const onSubmit = async (data: PageFormValues) => {
    try {
      let parsedContent: Record<string, unknown> = {};
      if (data.type === 'product') {
        // Structured commerce fields — not free-text JSON
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

      await createPage({
        title: data.title,
        slug: data.slug,
        type: data.type,
        published: data.published,
        content: parsedContent,
      });
      
      toast.success('Page created successfully!');
      router.push('/dashboard/pages');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create page');
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
            <h1 className="text-2xl font-bold tracking-tight">Create New Content</h1>
            <p className="text-sm text-neutral-400">Add a new page, product, article or event.</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/dashboard/pages')}>
              Cancel
            </Button>
            <Button type="submit" form="page-form" isLoading={isPending}>
              Save
            </Button>
          </div>
        </div>

        <PageForm onSubmit={onSubmit} isLoading={isPending} />
    </div>
  );
}
