'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPulseClient } from '@/lib/novus-pulse-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Tag, Search, ArrowRight, Package, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlanGate } from '@/components/plan-gate';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function ProductsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ title: '', price: 0, inventoryQty: 0 });

  const createProduct = useMutation({
    mutationFn: async (data: any) => {
      const pulse = createPulseClient(session?.accessToken);
      // Auto-generate slug from title
      const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      return pulse.createProduct({ ...data, slug, status: 'draft' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsAddModalOpen(false);
      setNewProduct({ title: '', price: 0, inventoryQty: 0 });
      toast.success('Product created as draft');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create product');
    }
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const pulse = createPulseClient(session?.accessToken);
      return pulse.getProducts();
    },
    enabled: !!session?.accessToken,
  });

  const filtered = products?.filter((p: any) => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PlanGate feature="multisite"> 
      {/* We can reuse the multisite/agency gate for ecommerce for now, or just leave it open if we want e-commerce for everyone */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-[19px] font-semibold tracking-[-0.01em] flex items-center gap-2"> Products
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Manage your inventory, pricing, and catalog.
            </p>
          </div>
          <Button 
            className="gap-2 bg-brand text-brand-foreground hover:bg-brand/90 font-semibold shadow-lg"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>

        <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur">
          <div className="p-4 border-b border-neutral-800 flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input 
                placeholder="Search products..." 
                className="pl-9 bg-neutral-950 border-neutral-800"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="text-sm text-neutral-500">
              {products?.length || 0} products
            </div>
          </div>

          <div className="divide-y divide-neutral-800/50">
            {isLoading ? (
              <div className="p-12 flex justify-center">
                <div className="h-6 w-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              </div>
            ) : filtered?.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center px-4">
                <div className="h-16 w-16 rounded-2xl bg-neutral-900 flex items-center justify-center border border-neutral-800 mb-4">
                  <Package className="h-8 w-8 text-neutral-600" />
                </div>
                <h3 className="font-semibold text-lg text-white mb-2">No products found</h3>
                <p className="text-neutral-500 max-w-sm text-sm">
                  {search ? 'Try adjusting your search terms.' : 'You haven\'t added any products yet. Create your first product to start selling.'}
                </p>
                {!search && (
                  <Button className="mt-6 bg-ivory text-[#1a1a1d] hover:bg-neutral-100" onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add your first product
                  </Button>
                )}
              </div>
            ) : (
              filtered?.map((product: any) => (
                <div key={product.id} className="p-4 hover:bg-neutral-800/50 transition-colors flex items-center gap-4 cursor-pointer group">
                  <div className="h-12 w-12 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-neutral-700" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate">{product.title}</h4>
                    <p className="text-xs text-neutral-500 truncate">{product.inventoryQty} in stock</p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[13px] tabular-nums text-foreground">€{Number(product.price).toFixed(2)}</div>
                    {product.compareAtPrice && (
                      <div className="font-mono text-[11px] tabular-nums text-neutral-500 line-through">€{Number(product.compareAtPrice).toFixed(2)}</div>
                    )}
                  </div>
                  <div className="pl-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      product.status === 'active' ? 'bg-green-500/10 text-green-400' :
                      product.status === 'draft' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-neutral-500/10 text-neutral-400'
                    }`}>
                      {product.status}
                    </span>
                  </div>
                  <div className="pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-4 w-4 text-neutral-500" />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogTitle>Add New Product</DialogTitle>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-xs text-neutral-400">Product Title</Label>
              <Input
                id="title"
                value={newProduct.title}
                onChange={e => setNewProduct({...newProduct, title: e.target.value})}
                placeholder="e.g. Vintage Denim Jacket"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price" className="text-xs text-neutral-400">Price (€)</Label>
                <Input
                  id="price"
                  type="number"
                  value={newProduct.price || ''}
                  onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inventory" className="text-xs text-neutral-400">Inventory Quantity</Label>
                <Input
                  id="inventory"
                  type="number"
                  value={newProduct.inventoryQty || ''}
                  onChange={e => setNewProduct({...newProduct, inventoryQty: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" className="text-neutral-400 hover:text-white hover:bg-neutral-800" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createProduct.mutate(newProduct)}
              disabled={!newProduct.title || createProduct.isPending}
              className="bg-brand text-brand-foreground hover:bg-brand/90 font-medium"
            >
              {createProduct.isPending ? 'Creating...' : 'Create Draft'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </PlanGate>
  );
}
