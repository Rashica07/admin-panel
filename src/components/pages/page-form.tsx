'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';
import { Plus, Trash2, Calendar, LayoutTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';

const CONTENT_TYPES = [
  ['page', 'Page'],
  ['product', 'Product'],
  ['article', 'Article'],
  ['event', 'Event'],
] as const;

const variantSchema = z.object({
  name: z.string().min(1, 'Required'),
  value: z.string().min(1, 'Required'),
  stock: z.coerce.number().int().min(0),
});

const pageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  type: z.string().min(1),
  published: z.boolean(),
  content: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  compareAtPrice: z.coerce.number().min(0).optional(),
  sku: z.string().optional(),
  stockQuantity: z.coerce.number().int().min(0).optional(),
  inStock: z.boolean().optional(),
  variants: z.array(variantSchema).optional(),
});

export type PageFormValues = z.infer<typeof pageSchema>;

interface ProductContent {
  price?: number;
  compareAtPrice?: number;
  sku?: string;
  stockQuantity?: number;
  inStock?: boolean;
  variants?: { name: string; value: string; stock: number }[];
}

interface PageFormProps {
  defaultValues?: Omit<Partial<PageFormValues>, 'content'> & { content?: unknown };
  onSubmit: (data: PageFormValues) => void;
  isLoading?: boolean;
}

export function PageForm({ defaultValues, onSubmit, isLoading }: PageFormProps) {
  const isProductDefault = defaultValues?.type === 'product';
  const productContent = (isProductDefault ? (defaultValues?.content as ProductContent) : undefined) ?? {};

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<z.input<typeof pageSchema>, unknown, PageFormValues>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      slug: defaultValues?.slug || '',
      type: defaultValues?.type || 'page',
      published: defaultValues?.published || false,
      content:
        isProductDefault
          ? ''
          : typeof defaultValues?.content === 'string'
            ? defaultValues.content
            : defaultValues?.content
              ? JSON.stringify(defaultValues.content, null, 2)
              : '',
      price: productContent.price,
      compareAtPrice: productContent.compareAtPrice,
      sku: productContent.sku ?? '',
      stockQuantity: productContent.stockQuantity ?? 0,
      inStock: productContent.inStock ?? true,
      variants: productContent.variants ?? [],
    },
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'variants',
  });

  const title = watch('title');
  const type = watch('type');
  const isPublished = watch('published');

  useEffect(() => {
    if (!defaultValues?.slug && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setValue('slug', generatedSlug, { shouldValidate: true });
    }
  }, [title, defaultValues?.slug, setValue]);

  return (
    <form id="page-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* ─── LEFT COLUMN (65%) ──────────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Title & Description Card */}
          <Card className="bg-surface border-border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-neutral-300">Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Summer Collection 2026" 
                  className="bg-surface-2 border-border-strong text-white focus-visible:ring-brand" 
                  {...register('title')} 
                />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              </div>

              {type !== 'product' && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="content" className="text-sm font-medium text-neutral-300">Raw Content (JSON/Text)</Label>
                  <textarea
                    id="content"
                    rows={12}
                    className="flex w-full rounded-md border border-border-strong bg-surface-2 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand font-mono"
                    placeholder="Enter raw content..."
                    {...register('content')}
                  />
                  {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* E-commerce specific cards */}
          {type === 'product' && (
            <>
              {/* Pricing Card */}
              <Card className="bg-surface border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base font-semibold">Pricing</CardTitle>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm text-neutral-300">Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">€</span>
                      <Input id="price" type="number" step="0.01" placeholder="0.00" className="pl-7 bg-surface-2 border-border-strong text-white" {...register('price')} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="compareAtPrice" className="text-sm text-neutral-300">Compare-at price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">€</span>
                      <Input id="compareAtPrice" type="number" step="0.01" placeholder="0.00" className="pl-7 bg-surface-2 border-border-strong text-white" {...register('compareAtPrice')} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inventory Card */}
              <Card className="bg-surface border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base font-semibold">Inventory</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center space-x-2 pb-2">
                    <input
                      type="checkbox"
                      id="inStock"
                      className="h-4 w-4 rounded border-border-strong bg-surface-2 text-brand focus:ring-brand accent-brand cursor-pointer"
                      {...register('inStock')}
                    />
                    <Label htmlFor="inStock" className="font-normal cursor-pointer text-neutral-200">
                      Track quantity (mark as in stock)
                    </Label>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="sku" className="text-sm text-neutral-300">SKU (Stock Keeping Unit)</Label>
                      <Input id="sku" placeholder="SKU-123" className="bg-surface-2 border-border-strong text-white" {...register('sku')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stockQuantity" className="text-sm text-neutral-300">Quantity available</Label>
                      <Input id="stockQuantity" type="number" placeholder="0" className="bg-surface-2 border-border-strong text-white" {...register('stockQuantity')} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Variants Card */}
              <Card className="bg-surface border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold">Variants</CardTitle>
                  <button
                    type="button"
                    onClick={() => appendVariant({ name: 'Size', value: '', stock: 0 })}
                    className="flex items-center gap-1 text-sm text-brand font-medium hover:text-brand-hover transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Add options like size or color
                  </button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {variantFields.length === 0 && (
                    <p className="text-sm text-neutral-400">
                      This product doesn't have options, like size or color.
                    </p>
                  )}
                  {variantFields.map((field, i) => (
                    <div key={field.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-lg border border-border-strong bg-surface-2 p-3">
                      <div className="flex-1 w-full space-y-1">
                        <Label className="text-xs text-neutral-500">Option Name</Label>
                        <Input placeholder="Size" className="h-8 text-sm" {...register(`variants.${i}.name` as const)} />
                      </div>
                      <div className="flex-1 w-full space-y-1">
                        <Label className="text-xs text-neutral-500">Option Value</Label>
                        <Input placeholder="M" className="h-8 text-sm" {...register(`variants.${i}.value` as const)} />
                      </div>
                      <div className="w-full sm:w-24 space-y-1">
                        <Label className="text-xs text-neutral-500">Stock</Label>
                        <Input type="number" placeholder="0" className="h-8 text-sm" {...register(`variants.${i}.stock` as const)} />
                      </div>
                      <div className="pt-5 sm:pt-0 pl-1">
                        <button type="button" onClick={() => removeVariant(i)} className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors bg-neutral-800 rounded-md mt-4 sm:mt-0">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          {/* Search Engine Listing Preview Card */}
          <Card className="bg-surface border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Search engine listing</CardTitle>
              <p className="text-sm text-neutral-400">Add a description to see how this {type} might appear in a search engine listing.</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-sm font-medium text-neutral-300">URL Handle (Slug)</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border-strong bg-surface-2 text-neutral-500 text-sm">
                    https://yoursite.com/
                  </span>
                  <Input 
                    id="slug" 
                    placeholder="my-page-slug" 
                    className="rounded-l-none bg-surface-2 border-border-strong text-white focus-visible:ring-brand" 
                    {...register('slug')} 
                  />
                </div>
                {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ─── RIGHT COLUMN (35%) ─────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Status Card */}
          <Card className="bg-surface border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border-strong bg-surface-2">
                <div className="flex items-center gap-3">
                  <span className={cn('h-2.5 w-2.5 rounded-full', isPublished ? 'bg-green-500' : 'bg-amber-500')} />
                  <span className="font-semibold text-sm text-white">{isPublished ? 'Active' : 'Draft'}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" {...register('published')} />
                  <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
                </label>
              </div>
              <p className="text-xs text-neutral-400">
                {isPublished ? 'This content is live and visible to your visitors.' : 'This content is hidden from your live site.'}
              </p>
            </CardContent>
          </Card>

          {/* Organization Card */}
          <Card className="bg-surface border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Organization</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium text-neutral-300">Content Type</Label>
                <select
                  id="type"
                  className="flex h-10 w-full items-center rounded-md border border-border-strong bg-surface-2 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand appearance-none"
                  {...register('type')}
                >
                  {CONTENT_TYPES.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-neutral-300">Collections / Category</Label>
                <Input placeholder="e.g. Summer, Featured" className="h-10 bg-surface-2 border-border-strong text-white" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-neutral-300">Tags</Label>
                <Input placeholder="e.g. Vintage, Cotton" className="h-10 bg-surface-2 border-border-strong text-white" />
              </div>
            </CardContent>
          </Card>

          {/* Theme Template Card */}
          <Card className="bg-surface border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Theme template</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-sm text-neutral-300 p-3 bg-surface-2 rounded-lg border border-border-strong">
                <LayoutTemplate className="h-4 w-4 text-neutral-500" />
                <span>Default {type}</span>
              </div>
              <p className="text-xs text-neutral-400 mt-3">
                Design the layout for this content using the Visual Editor.
              </p>
            </CardContent>
          </Card>
          
        </div>
      </div>
    </form>
  );
}
