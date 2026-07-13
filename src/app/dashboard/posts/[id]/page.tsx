'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePage, usePages, useUpdatePage, useDeletePage } from '@/hooks/usePages';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Save, Paintbrush, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { slugify } from '@/lib/utils';

export default function EditPost() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: pages } = usePages();
  const { data: page, isLoading } = usePage(id);
  const { mutateAsync: updatePage, isPending: isUpdating } = useUpdatePage();
  const { mutateAsync: deletePage, isPending: isDeleting } = useDeletePage();
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [published, setPublished] = useState(false);
  const [categoryId, setCategoryId] = useState('uncategorized');

  const categories = (pages || []).filter(p => p.type === 'category');

  useEffect(() => {
    if (page) {
      setTitle(page.title || '');
      setSlug(page.slug || '');
      setPublished(page.published || false);
      setCategoryId((page.content?.categoryId as string) || 'uncategorized');
    }
  }, [page]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (!slug || slug === slugify(title)) {
      setSlug(slugify(e.target.value));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug) return toast.error('Title and slug are required');
    
    try {
      await updatePage({
        id,
        data: {
          title,
          slug,
          type: 'post',
          published,
          content: {
            ...((page?.content as object) || {}),
            categoryId: categoryId === 'uncategorized' ? null : categoryId
          },
        },
      });
      
      toast.success('Post saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save post');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await deletePage(id);
      toast.success('Post deleted');
      router.push('/dashboard/posts');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-neutral-400 text-center">Loading post metadata...</div>;
  }

  if (!page) {
    return <div className="p-8 text-neutral-400 text-center">Post not found.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10 anim-fade-in">
      <form onSubmit={onSubmit} id="post-form">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/posts">
            <Button variant="ghost" size="icon" type="button" className="text-neutral-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{page.title}</h1>
            <p className="text-sm text-neutral-400">Manage post metadata and categories.</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="destructive" size="icon" type="button" onClick={handleDelete} isLoading={isDeleting} className="h-9 w-9">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Link href={`/dashboard/builder?page=${id}`}>
              <Button type="button" variant="outline" className="border-border-strong bg-surface-2 text-white hover:bg-surface-2/80 gap-2">
                <Paintbrush className="h-4 w-4" /> Visual Editor
              </Button>
            </Link>
            <Button type="submit" isLoading={isUpdating} className="bg-brand text-black hover:bg-brand-hover gap-2">
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </div>
        </div>

        <Card className="bg-surface border-border">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-1.5 block">Post Title</label>
                <Input 
                  value={title} 
                  onChange={handleTitleChange}
                  className="bg-surface-2 border-border-strong text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-300 mb-1.5 block">URL Slug</label>
                <div className="flex rounded-md shadow-sm">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-border-strong bg-surface-2 px-3 text-neutral-500 sm:text-sm">
                    /posts/
                  </span>
                  <Input 
                    value={slug} 
                    onChange={e => setSlug(e.target.value)}
                    className="rounded-l-none bg-surface-2 border-border-strong text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-300 mb-1.5 block">Category</label>
                <select 
                  className="w-full h-10 rounded-md border border-border-strong bg-surface-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand"
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                >
                  <option value="uncategorized">Uncategorized</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border-strong bg-surface-2/50 p-4">
                <div>
                  <h4 className="text-sm font-medium text-white">Publish Status</h4>
                  <p className="text-[13px] text-neutral-400 mt-0.5">Make this post visible to the public.</p>
                </div>
                <Switch 
                  checked={published} 
                  onCheckedChange={setPublished} 
                  className="data-[state=checked]:bg-brand"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      <div className="mt-8 p-6 rounded-xl border border-border-strong bg-gradient-to-br from-brand/5 to-transparent flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Design this post</h3>
          <p className="text-sm text-neutral-400 max-w-md">
            The post content is managed through the Visual Editor. You can add text blocks, images, headers, and completely customize the layout.
          </p>
        </div>
        <Link href={`/dashboard/builder?page=${id}`}>
          <Button size="lg" className="bg-brand text-black hover:bg-brand-hover gap-2 shadow-xl shadow-brand/20">
            <Paintbrush className="h-5 w-5" /> Open Visual Editor
          </Button>
        </Link>
      </div>
    </div>
  );
}
