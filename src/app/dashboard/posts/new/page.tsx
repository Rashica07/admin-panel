'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePages, useCreatePage } from '@/hooks/usePages';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Save, Paintbrush } from 'lucide-react';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { slugify } from '@/lib/utils';

export default function NewPost() {
  const router = useRouter();
  const { data: pages } = usePages();
  const { mutateAsync: createPage, isPending } = useCreatePage();
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [published, setPublished] = useState(false);
  const [categoryId, setCategoryId] = useState('uncategorized');

  const categories = (pages || []).filter(p => p.type === 'category');

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
      const page = await createPage({
        title,
        slug,
        type: 'post',
        published,
        content: {
          categoryId: categoryId === 'uncategorized' ? null : categoryId
        },
      });
      
      toast.success('Post created successfully!');
      // Prompt user to enter Visual Editor
      router.push(`/dashboard/posts/${page.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create post');
    }
  };

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
            <h1 className="text-2xl font-bold tracking-tight text-white">Create New Post</h1>
            <p className="text-sm text-neutral-400">Set up the metadata before designing the content.</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/dashboard/posts">
              <Button variant="outline" type="button" className="border-border-strong text-neutral-300">
                Cancel
              </Button>
            </Link>
            <Button type="submit" isLoading={isPending} className="bg-brand text-black hover:bg-brand-hover gap-2">
              <Save className="h-4 w-4" /> Save Post
            </Button>
          </div>
        </div>

        <Card className="bg-surface border-border">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-1.5 block">Post Title</label>
                <Input 
                  placeholder="e.g. 5 Ways to Improve UX" 
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
    </div>
  );
}
