'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPulseClient } from '@/lib/novus-pulse-client';
import { PlanGate } from '@/components/plan-gate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { GripVertical, Plus, Trash2, LayoutList, Check, X, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  id: string;
  label: string;
  url: string;
  children?: MenuItem[];
}

interface Menu {
  id: string;
  name: string;
  slug: string;
  items: MenuItem[];
}

export default function MenusPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: menus, isLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: async () => {
      const pulse = createPulseClient(session?.accessToken);
      return pulse.getMenus();
    },
    enabled: !!session?.accessToken,
  });

  const createMenu = useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      const pulse = createPulseClient(session?.accessToken);
      return pulse.createMenu({ ...data, items: [] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      setIsCreating(false);
      toast.success('Menu created');
    },
  });

  const activeMenu = menus?.find((m: Menu) => m.id === activeMenuId) || menus?.[0];

  return (
    <PlanGate feature="menus">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <LayoutList className="h-7 w-7 text-brand" /> Navigation & Menus
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Build and manage your site's navigation structures.
          </p>
        </div>

        {isLoading ? (
          <div className="h-64 animate-pulse rounded-xl bg-neutral-900" />
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            
            {/* Sidebar: Menu List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">All Menus</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {isCreating && (
                <Card className="border-brand border-dashed bg-brand/5">
                  <CardContent className="p-3 space-y-3">
                    <Input id="new-menu-name" placeholder="Menu Name (e.g. Footer)" className="h-8 text-sm" />
                    <Input id="new-menu-slug" placeholder="slug (e.g. footer-nav)" className="h-8 text-sm" />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 h-8 text-xs bg-brand hover:bg-brand/90"
                        onClick={() => {
                          const name = (document.getElementById('new-menu-name') as HTMLInputElement).value;
                          const slug = (document.getElementById('new-menu-slug') as HTMLInputElement).value;
                          if (name && slug) createMenu.mutate({ name, slug });
                        }}
                      >
                        Create
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsCreating(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {menus?.map((menu: Menu) => (
                  <button
                    key={menu.id}
                    onClick={() => setActiveMenuId(menu.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                      (activeMenuId === menu.id || (!activeMenuId && activeMenu?.id === menu.id))
                        ? "bg-neutral-800 border-neutral-700 shadow-sm"
                        : "bg-transparent border-transparent hover:bg-neutral-900"
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium">{menu.name}</p>
                      <p className="text-[10px] text-neutral-500 font-mono">{menu.slug}</p>
                    </div>
                    <Navigation className="h-4 w-4 text-neutral-600" />
                  </button>
                ))}
              </div>
            </div>

            {/* Main Area: Menu Builder */}
            <div className="lg:col-span-3">
              {activeMenu ? (
                <MenuBuilder menu={activeMenu} />
              ) : (
                <div className="h-64 flex flex-col items-center justify-center border border-dashed border-neutral-800 rounded-xl text-neutral-500">
                  <LayoutList className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Create a menu to get started</p>
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
    </PlanGate>
  );
}

// ── Sub-component: MenuBuilder ────────────────────────────

function MenuBuilder({ menu }: { menu: Menu }) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<MenuItem[]>(menu.items || []);
  const [saving, setSaving] = useState(false);

  // Sync state when active menu changes
  if (items !== menu.items && !saving) {
    // setItems(menu.items || []);
  }

  const saveMenu = async () => {
    setSaving(true);
    try {
      const pulse = createPulseClient(session?.accessToken);
      await pulse.updateMenu(menu.id, { items });
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast.success('Menu saved successfully');
    } catch (err: any) {
      toast.error('Failed to save menu');
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: Math.random().toString(36).slice(2), label: 'New Link', url: '/' },
    ]);
  };

  const updateItem = (id: string, field: 'label' | 'url', value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b border-neutral-800 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{menu.name}</CardTitle>
            <p className="text-xs text-neutral-400 font-mono mt-1">slug: {menu.slug}</p>
          </div>
          <Button onClick={saveMenu} disabled={saving} className="gap-2">
            <Check className="h-4 w-4" /> Save Menu
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 flex-1 bg-neutral-950/50">
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 p-3 rounded-lg group">
              <div className="cursor-grab p-1 text-neutral-600 hover:text-neutral-300 active:cursor-grabbing">
                <GripVertical className="h-5 w-5" />
              </div>
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="space-y-1">
                  <Label className="text-[10px] text-neutral-500 uppercase tracking-wider">Label</Label>
                  <Input 
                    value={item.label} 
                    onChange={e => updateItem(item.id, 'label', e.target.value)}
                    className="h-9 bg-neutral-950 border-neutral-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-neutral-500 uppercase tracking-wider">URL</Label>
                  <Input 
                    value={item.url} 
                    onChange={e => updateItem(item.id, 'url', e.target.value)}
                    className="h-9 bg-neutral-950 border-neutral-800 font-mono text-sm"
                  />
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-red-400 shrink-0 mt-5" onClick={() => removeItem(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {items.length === 0 && (
            <div className="py-8 text-center text-sm text-neutral-500 border border-dashed border-neutral-800 rounded-lg">
              No links in this menu. Add one below.
            </div>
          )}

          <Button variant="outline" className="w-full border-dashed gap-2 text-neutral-400 hover:text-white" onClick={addItem}>
            <Plus className="h-4 w-4" /> Add Link
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
