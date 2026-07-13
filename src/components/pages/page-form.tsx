'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

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
  // Generic content — used for page/article/event types
  content: z.string().optional(),
  // Structured commerce fields — used only when type === 'product'
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
  // `content` may arrive as the raw JSON object from the API — it's
  // stringified for the editor textarea below, or destructured into
  // product fields when type === 'product'.
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

  // Auto-generate slug from title if we're creating a new page and the slug hasn't been manually touched
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
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Content Type</Label>
            <select
              id="type"
              className="flex h-9 w-full items-center rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              {...register('type')}
            >
              {CONTENT_TYPES.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="About Us" {...register('title')} />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input id="slug" placeholder="about-us" {...register('slug')} />
              {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="published"
              className="h-4 w-4 rounded border-border bg-input text-brand focus:ring-brand accent-brand"
              {...register('published')}
            />
            <Label htmlFor="published" className="font-normal cursor-pointer">
              Publish this {type === 'product' ? 'product' : 'page'} immediately
            </Label>
          </div>

          {type === 'product' ? (
            <div className="space-y-5 pt-4 border-t border-border mt-6">
              <p className="text-xs uppercase tracking-wider text-neutral-500">Pricing & Inventory</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" type="number" step="0.01" placeholder="29.99" {...register('price')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compareAtPrice">Compare-at price</Label>
                  <Input id="compareAtPrice" type="number" step="0.01" placeholder="39.99" {...register('compareAtPrice')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" placeholder="TSHIRT-BLK-M" {...register('sku')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Stock quantity</Label>
                  <Input id="stockQuantity" type="number" placeholder="0" {...register('stockQuantity')} />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="inStock"
                  className="h-4 w-4 rounded border-border bg-input text-brand focus:ring-brand accent-brand"
                  {...register('inStock')}
                />
                <Label htmlFor="inStock" className="font-normal cursor-pointer">
                  In stock (visible as purchasable)
                </Label>
              </div>

              {/* Variants */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-neutral-400">
                    Variants <span className="text-neutral-600">({variantFields.length})</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => appendVariant({ name: 'Size', value: '', stock: 0 })}
                    className="flex items-center gap-1 text-[11px] text-brand hover:text-brand/80 transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Add variant
                  </button>
                </div>
                {variantFields.length === 0 && (
                  <p className="text-xs text-neutral-600">
                    No variants — this product has a single price and stock count above.
                  </p>
                )}
                <div className="space-y-2">
                  {variantFields.map((field, i) => (
                    <div key={field.id} className="flex items-center gap-2 rounded-lg border border-border/50 bg-neutral-950/40 p-2.5">
                      <Input
                        placeholder="Size"
                        className="flex-1 text-sm"
                        {...register(`variants.${i}.name` as const)}
                      />
                      <Input
                        placeholder="M"
                        className="flex-1 text-sm"
                        {...register(`variants.${i}.value` as const)}
                      />
                      <Input
                        type="number"
                        placeholder="Stock"
                        className="w-24 text-sm"
                        {...register(`variants.${i}.stock` as const)}
                      />
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        className="p-1.5 text-neutral-600 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 pt-4 border-t border-border mt-6">
              <Label htmlFor="content">Content (JSON/Text)</Label>
              <p className="text-xs text-neutral-400 mb-2">
                Enter raw text or a JSON structure for your frontend to consume.
              </p>
              <textarea
                id="content"
                rows={12}
                className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand font-mono"
                placeholder="Enter content here..."
                {...register('content')}
              />
              {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
