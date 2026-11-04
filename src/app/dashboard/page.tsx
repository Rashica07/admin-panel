'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Inbox, Package, FileText, LineChart, Lock, Store, ArrowRight, CheckCircle2 } from 'lucide-react';
import { createPulseClient } from '@/lib/novus-pulse-client';
import { usePages } from '@/hooks/usePages';
import { usePlan } from '@/hooks/usePlan';
import { useUIStore } from '@/store/useStore';
import { hasFeature, PLAN_LABEL, requiredPlan } from '@/lib/plan';
import { Button } from '@/components/ui/button';
import { PageHeader, MetaTag } from '@/components/omni/page-header';
import { Panel } from '@/components/omni/panel';
import { Status } from '@/components/omni/status';
import { TrafficChart, FigureStrip } from '@/components/omni/traffic-chart';

type Product = { id: string; title: string; price: number; inventoryQty: number; status: string; images?: string[] };
type Submission = { id: string; formName: string; data: Record<string, unknown>; read: boolean; createdAt: string };
type Stats = { totalViews: number; uniqueVisitors: number; dailyViews: { date: string; views: number }[]; topPages: { slug: string; views: number }[] };

const LOW_STOCK = 10;
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || (process.env.NEXT_PUBLIC_DEMO_MODE !== 'false' ? '/demo-site' : 'http://localhost:21113');

const money = (n: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n);
const submitter = (s: Submission) => String(s.data?.name ?? s.data?.business ?? s.data?.email ?? 'Anonymous');

export default function AdminOverview() {
  const { data: session } = useSession();
  const { activeTenantId } = useUIStore();
  const { plan } = usePlan();
  const token = session?.accessToken;
  const canForms = hasFeature(plan, 'forms');
  const canAnalytics = hasFeature(plan, 'analytics');

  const { data: tenant } = useQuery({
    queryKey: ['my-tenant', activeTenantId],
    queryFn: () => createPulseClient(token).getMyTenant(),
    enabled: !!token,
  });
  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => createPulseClient(token).getProducts<Product>(),
    enabled: !!token,
  });
  const { data: submissions, isLoading: loadingSubs } = useQuery({
    queryKey: ['submissions', activeTenantId],
    queryFn: () => createPulseClient(token).getSubmissions() as Promise<Submission[]>,
    enabled: !!token && canForms,
  });
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['stats', activeTenantId, 7],
    queryFn: () => createPulseClient(token).getAnalyticsStats(7) as Promise<Stats>,
    enabled: !!token && canAnalytics,
  });
  const { data: pages } = usePages();

  const sitePages = (pages ?? []).filter((p) => p.type === 'page');
  const activeProducts = (products ?? []).filter((p) => p.status === 'active');
  const lowStock = activeProducts.filter((p) => p.inventoryQty <= LOW_STOCK).sort((a, b) => a.inventoryQty - b.inventoryQty);
  const unread = (submissions ?? []).filter((s) => !s.read);
  const draftPages = sitePages.filter((p) => !p.published);
  const draftProducts = (products ?? []).filter((p) => p.status === 'draft');

  const attention: { key: string; icon: React.ElementType; tone: string; text: React.ReactNode; href: string; action: string }[] = [
    ...(unread.length
      ? [{ key: 'unread', icon: Inbox, tone: 'text-brand-fg', text: <><span className="font-mono">{unread.length}</span> unread {unread.length === 1 ? 'lead' : 'leads'} waiting for a reply</>, href: '/dashboard/forms', action: 'Open inbox' }]
      : []),
    ...lowStock.map((p) => ({
      key: `stock-${p.id}`,
      icon: AlertTriangle,
      tone: 'text-amber-400',
      text: <>{p.title} — <span className="font-mono">{p.inventoryQty}</span> left in stock</>,
      href: '/dashboard/products',
      action: 'Restock',
    })),
    ...draftPages.map((p) => ({ key: `page-${p.id}`, icon: FileText, tone: 'text-neutral-400', text: <>Page “{p.title}” is unpublished</>, href: `/dashboard/pages/${p.id}`, action: 'Review' })),
    ...draftProducts.map((p) => ({ key: `prod-${p.id}`, icon: Package, tone: 'text-neutral-400', text: <>Product “{p.title}” is still a draft</>, href: '/dashboard/products', action: 'Review' })),
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Overview"
        qualifier={tenant?.name}
        meta={<MetaTag>{PLAN_LABEL[plan]}</MetaTag>}
        actions={
          <>
            <Button variant="outline" asChild>
              <a href={SITE_URL} target="_blank" rel="noopener noreferrer">
                <Store className="h-3.5 w-3.5" /> View store
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/products">Manage products</Link>
            </Button>
          </>
        }
      />

      <FigureStrip
        items={[
          ...(canAnalytics
            ? [
                { label: 'Views · 7d', value: loadingStats ? '—' : (stats?.totalViews ?? 0).toLocaleString(), hint: loadingStats ? undefined : `${(stats?.uniqueVisitors ?? 0).toLocaleString()} unique visitors`, href: '/dashboard/analytics' },
              ]
            : []),
          { label: 'Unread leads', value: !canForms ? '—' : loadingSubs ? '—' : unread.length, hint: canForms ? `${submissions?.length ?? 0} total submissions` : `${PLAN_LABEL[requiredPlan('forms')]} plan`, href: '/dashboard/forms' },
          { label: 'Products live', value: loadingProducts ? '—' : `${activeProducts.length}/${products?.length ?? 0}`, hint: lowStock.length ? `${lowStock.length} low on stock` : 'Stock levels healthy', href: '/dashboard/products' },
          { label: 'Pages published', value: pages ? `${sitePages.length - draftPages.length}/${sitePages.length}` : '—', hint: draftPages.length ? `${draftPages.length} unpublished` : 'All pages live', href: '/dashboard/pages' },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          icon={LineChart}
          title="Store traffic"
          description="Page views per day, last 7 days"
          action={canAnalytics ? <Link href="/dashboard/analytics" className="text-xs text-brand-fg hover:underline">Full report</Link> : undefined}
        >
          {canAnalytics ? (
            <div className="grid gap-0 md:grid-cols-[1fr_220px]">
              <div className="px-2 py-3">
                {loadingStats ? <div className="h-[180px] animate-pulse rounded bg-surface-2/40" /> : <TrafficChart data={stats?.dailyViews ?? []} />}
              </div>
              <div className="border-t border-border px-4 py-3 md:border-l md:border-t-0">
                <p className="omni-label mb-2">Top pages</p>
                <ol className="space-y-1.5">
                  {(stats?.topPages ?? []).slice(0, 5).map((p) => (
                    <li key={p.slug} className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="truncate text-neutral-300">/{p.slug}</span>
                      <span className="font-mono text-xs tabular-nums text-neutral-500">{p.views.toLocaleString()}</span>
                    </li>
                  ))}
                  {!loadingStats && !stats?.topPages?.length && <li className="text-xs text-neutral-500">No visits recorded yet.</li>}
                </ol>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-6 text-[13px] text-neutral-400">
              <Lock className="h-4 w-4 text-neutral-500" />
              Traffic reports are part of the {PLAN_LABEL[requiredPlan('analytics')]} plan.
              <Link href="/dashboard/settings/plan-billing" className="ml-auto text-brand-fg hover:underline">See plans</Link>
            </div>
          )}
        </Panel>

        <Panel icon={AlertTriangle} title="Needs attention" description={attention.length ? `${attention.length} open ${attention.length === 1 ? 'item' : 'items'}` : 'Nothing outstanding'}>
          {attention.length ? (
            <ul className="divide-y divide-border">
              {attention.slice(0, 7).map((a) => (
                <li key={a.key}>
                  <Link href={a.href} className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-2/50">
                    <a.icon className={`h-3.5 w-3.5 shrink-0 ${a.tone}`} aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-neutral-200">{a.text}</span>
                    <span className="shrink-0 text-xs text-neutral-500 group-hover:text-brand-fg">{a.action}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 px-4 py-6 text-[13px] text-neutral-400">
              <CheckCircle2 className="h-4 w-4 text-green-400" /> Your store is in good shape.
            </p>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          icon={Inbox}
          title="Latest leads"
          description="Contact, wholesale and newsletter forms"
          action={canForms ? <Link href="/dashboard/forms" className="text-xs text-brand-fg hover:underline">All submissions</Link> : undefined}
        >
          {!canForms ? (
            <p className="px-4 py-6 text-[13px] text-neutral-400">Form submissions are part of the {PLAN_LABEL[requiredPlan('forms')]} plan.</p>
          ) : loadingSubs ? (
            <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <div key={i} className="h-8 animate-pulse rounded bg-surface-2/40" />)}</div>
          ) : submissions?.length ? (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left">
                  <th scope="col" className="omni-label px-4 py-2 font-normal">From</th>
                  <th scope="col" className="omni-label hidden px-4 py-2 font-normal sm:table-cell">Form</th>
                  <th scope="col" className="omni-label hidden px-4 py-2 font-normal md:table-cell">Message</th>
                  <th scope="col" className="omni-label px-4 py-2 text-right font-normal">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {submissions.slice(0, 6).map((s) => (
                  <tr key={s.id} className="hover:bg-surface-2/40">
                    <td className="px-4 py-2">
                      <Link href="/dashboard/forms" className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.read ? 'bg-transparent' : 'bg-brand-fg'}`} aria-label={s.read ? undefined : 'Unread'} />
                        <span className={s.read ? 'text-neutral-300' : 'font-medium text-foreground'}>{submitter(s)}</span>
                      </Link>
                    </td>
                    <td className="hidden px-4 py-2 text-neutral-400 sm:table-cell">{s.formName}</td>
                    <td className="hidden max-w-[280px] truncate px-4 py-2 text-neutral-500 md:table-cell">{String(s.data?.message ?? s.data?.email ?? '—')}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-right font-mono text-xs text-neutral-500">{formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-4 py-6 text-[13px] text-neutral-400">No submissions yet. They appear here as soon as a visitor sends a form on your site.</p>
          )}
        </Panel>

        <Panel icon={Package} title="Inventory" description="Active products, lowest stock first" action={<Link href="/dashboard/products" className="text-xs text-brand-fg hover:underline">Products</Link>}>
          {loadingProducts ? (
            <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-surface-2/40" />)}</div>
          ) : (products ?? []).length ? (
            <ul className="divide-y divide-border">
              {[...(products ?? [])].sort((a, b) => a.inventoryQty - b.inventoryQty).slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.images?.[0] ? <img src={p.images[0]} alt="" className="h-8 w-8 shrink-0 rounded-sm object-cover" /> : <div className="h-8 w-8 shrink-0 rounded-sm bg-surface-2" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-neutral-200">{p.title}</p>
                    <Status status={p.status} />
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[13px] tabular-nums text-neutral-200">{money(p.price)}</p>
                    <p className={`font-mono text-[11px] tabular-nums ${p.inventoryQty <= LOW_STOCK ? 'text-amber-400' : 'text-neutral-500'}`}>{p.inventoryQty} in stock</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-[13px] text-neutral-400">
              No products yet.{' '}
              <Link href="/dashboard/products" className="inline-flex items-center gap-1 text-brand-fg hover:underline">
                Add your first product <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
