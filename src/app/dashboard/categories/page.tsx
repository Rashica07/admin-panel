'use client';

import { useState } from 'react';
import { usePages, useCreatePage, useDeletePage, useUpdatePage } from '@/hooks/usePages';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Folder, Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CategoriesPage() {
  const { data: pages, isLoading } = usePages();
  const { mutateAsync: createPage, isPending: isCreating } = useCreatePage();
  const { mutateAsync: deletePage, isPending: isDeleting } = useDeletePage();
  const { mutateAsync: updatePage, isPending: isUpdating } = useUpdatePage();

  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const categories = (pages || []).filter(p => p.type === 'category');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSlug) return toast.error('Name and slug are required');
    try {
      await createPage({
        title: newTitle,
        slug: newSlug,
        type: 'category',
        published: true,
        content: {},
      });
      toast.success('Category created');
      setNewTitle('');
      setNewSlug('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await deletePage(id);
      toast.success('Category deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 anim-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Folder className="h-6 w-6 text-brand" /> Categories
        </h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="bg-surface border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold text-white">Add New Category</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-1 block">Name</label>
                  <Input 
                    placeholder="e.g. News" 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)}
                    className="bg-surface-2 border-border-strong text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-1 block">Slug</label>
                  <Input 
                    placeholder="e.g. news" 
                    value={newSlug} 
                    onChange={e => setNewSlug(e.target.value)}
                    className="bg-surface-2 border-border-strong text-sm"
                  />
                </div>
                <Button type="submit" isLoading={isCreating} className="w-full bg-brand text-black hover:bg-brand-hover">
                  <Plus className="h-4 w-4 mr-2" /> Add Category
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="bg-surface border-border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-neutral-400 bg-surface-2/50 border-b border-border/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-neutral-500">Loading...</td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-neutral-500">
                      No categories found. Create one to get started!
                    </td>
                  </tr>
                ) : (
                  categories.map(cat => (
                    <tr key={cat.id} className="hover:bg-surface-2/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{cat.title}</td>
                      <td className="px-4 py-3 text-neutral-400">{cat.slug}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
