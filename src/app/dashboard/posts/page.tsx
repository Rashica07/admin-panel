'use client';

import { useState } from 'react';
import { usePages, useUpdatePage, useDeletePage } from '@/hooks/usePages';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Plus, Trash2, Edit2, Newspaper, Folder, Paintbrush } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export default function PostsPage() {
  const { data: pages, isLoading } = usePages();
  const { mutateAsync: updatePage } = useUpdatePage();
  const { mutateAsync: deletePage } = useDeletePage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // We filter out 'post' for the posts table, and 'category' for the filter dropdown
  const posts = (pages || []).filter(p => p.type === 'post');
  const categories = (pages || []).filter(p => p.type === 'category');

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || post.content?.categoryId === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await updatePage({ id, data: { published: !currentStatus } });
    } catch (error) {
      console.error('Failed to toggle publish status', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      await deletePage(id);
      toast.success('Post deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const getCategoryName = (categoryId?: unknown) => {
    if (!categoryId || typeof categoryId !== 'string') return 'Uncategorized';
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.title : 'Uncategorized';
  };

  return (
    <div className="space-y-6 max-w-7xl pb-10 anim-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-brand" /> Posts
          </h1>
          <p className="text-neutral-400 text-sm mt-1">Manage your blog articles and news updates.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/posts/new">
            <Button className="gap-2 shadow-md bg-brand text-black hover:bg-brand-hover">
              <Plus className="h-4 w-4" /> Add Post
            </Button>
          </Link>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mr-2">Category:</span>
        <button
          onClick={() => setSelectedCategory('all')}
          className={cn(
            'rounded-lg px-3 py-1 text-xs font-medium transition-colors',
            selectedCategory === 'all' ? 'bg-brand/10 text-brand border border-brand/20' : 'bg-surface-2 text-neutral-400 border border-transparent hover:bg-surface border-border-strong'
          )}
        >
          All ({posts.length})
        </button>
        {categories.map(cat => {
          const count = posts.filter(p => p.content?.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'rounded-lg px-3 py-1 text-xs font-medium transition-colors',
                selectedCategory === cat.id ? 'bg-brand/10 text-brand border border-brand/20' : 'bg-surface-2 text-neutral-400 border border-transparent hover:bg-surface border-border-strong'
              )}
            >
              {cat.title} ({count})
            </button>
          )
        })}
      </div>

      {/* TABLE */}
      <Card className="bg-surface border-border overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-surface-2/30">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Search posts..."
              className="pl-9 h-9 bg-surface border-border-strong focus-visible:ring-brand"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-400 bg-surface-2/50 border-b border-border/50">
              <tr>
                <th className="px-4 py-3 font-medium">Post Details</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Modified</th>
                <th className="px-4 py-3 font-medium text-right w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">Loading posts...</td>
                </tr>
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-surface-2/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div>
                        <Link href={`/dashboard/posts/${post.id}`} className="font-semibold text-white hover:text-brand transition-colors">
                          {post.title}
                        </Link>
                        <div className="text-xs text-neutral-500 mt-0.5 truncate max-w-[200px]">/{post.slug}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-2 text-xs text-neutral-300 border border-border-strong">
                        <Folder className="h-3 w-3 text-neutral-500" />
                        {getCategoryName(post.content?.categoryId)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePublish(post.id, post.published)}
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors',
                          post.published
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                        )}
                      >
                        {post.published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-400 hidden md:table-cell">
                      {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/dashboard/builder?page=${post.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-brand hover:bg-brand/10" title="Visual Editor">
                            <Paintbrush className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/posts/${post.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-white" title="Settings">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => handleDelete(post.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <Newspaper className="mx-auto h-12 w-12 text-neutral-600 mb-4" />
                    <h3 className="mb-2 text-lg font-medium text-white">No posts found</h3>
                    <p className="mb-6 text-sm text-neutral-400 max-w-sm mx-auto">
                      Get started by creating your first post.
                    </p>
                    <Link href="/dashboard/posts/new">
                      <Button className="bg-brand text-black hover:bg-brand-hover">Add Post</Button>
                    </Link>
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
