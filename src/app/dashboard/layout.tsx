'use client';

import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Bot,
  Tag,
  FileText,
  Newspaper,
  FolderTree,
  Image as ImageIcon,
  Paintbrush,
  Palette,
  AlignLeft,
  Globe,
  MessageCircle,
  FormInput,
  LineChart,
  SearchCheck,
  Link2,
  Settings,
  Store,
  Plus,
} from 'lucide-react';
import { useUIStore } from '@/store/useStore';
import { usePlan } from '@/hooks/usePlan';
import { useApiStatus } from '@/hooks/useApiStatus';
import { createPulseClient } from '@/lib/novus-pulse-client';
import { cn } from '@/lib/utils';
import { SupportWidget } from '@/components/support-widget';
import { DemoBanner } from '@/components/demo-banner';
import { AppShell, isNavActive, type ShellNavGroup, type ShellNavItem } from '@/components/omni/app-shell';
import { type Plan, type FeatureKey, PLAN_LABEL, hasFeature, requiredPlan } from '@/lib/plan';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NEXT_PUBLIC_DEMO_MODE !== 'false' ? '/demo-site' : 'http://localhost:21113');

type NavDef = Omit<ShellNavItem, 'lockedLabel'> & { gate?: FeatureKey };
type GroupDef = { label?: string; items: NavDef[] };

/** OMNI Admin information architecture — every item is an existing route. */
function navDefinition(unreadForms: number): GroupDef[] {
  return [
    {
      items: [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Assistant', href: '/dashboard/assistant', icon: Bot },
      ],
    },
    {
      label: 'Catalog',
      items: [
        { name: 'Products', href: '/dashboard/products', icon: Tag },
        { name: 'Pages', href: '/dashboard/pages', icon: FileText },
        { name: 'Posts', href: '/dashboard/posts', icon: Newspaper },
        { name: 'Categories', href: '/dashboard/categories', icon: FolderTree },
        { name: 'Media', href: '/dashboard/photos', icon: ImageIcon },
      ],
    },
    {
      label: 'Storefront',
      items: [
        { name: 'Visual editor', href: '/dashboard/builder', icon: Paintbrush },
        { name: 'Themes', href: '/dashboard/themes', icon: Palette, gate: 'themes' },
        { name: 'Menus', href: '/dashboard/menus', icon: AlignLeft, gate: 'menus' },
        { name: 'Websites', href: '/dashboard/websites', icon: Globe, gate: 'multisite' },
      ],
    },
    {
      label: 'Customers',
      items: [
        { name: 'Inbox', href: '/dashboard/inbox', icon: MessageCircle },
        { name: 'Forms & leads', href: '/dashboard/forms', icon: FormInput, gate: 'forms', count: unreadForms },
      ],
    },
    {
      label: 'Growth',
      items: [
        { name: 'Analytics', href: '/dashboard/analytics', icon: LineChart, gate: 'analytics' },
        { name: 'SEO', href: '/dashboard/seo', icon: SearchCheck, gate: 'seo' },
        { name: 'Connected apps', href: '/dashboard/connected-apps', icon: Link2 },
      ],
    },
  ];
}

const PREVIEW_PLANS: { value: Plan | null; label: string }[] = [
  { value: null, label: 'Real' },
  { value: 'starter', label: 'Starter' },
  { value: 'studio', label: 'Studio' },
  { value: 'agency', label: 'Agency' },
];

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isSidebarOpen, toggleSidebar, closeSidebar, previewPlan, setPreviewPlan, activeTenantId, setActiveTenant } = useUIStore();
  const apiOnline = useApiStatus();
  const { plan, isSuperAdmin } = usePlan();
  const canForms = hasFeature(plan, 'forms');

  useEffect(() => {
    if (session?.user && !activeTenantId) {
      setActiveTenant({
        id: session.user.tenantId || 'admin-workspace',
        slug: session.user.tenantSlug || 'admin-workspace',
        name: session.user.tenantSlug === 'admin-workspace' ? 'Admin Workspace' : session.user.name || 'Workspace',
      });
    }
  }, [session, activeTenantId, setActiveTenant]);

  // Real tenant record for the workspace label.
  const { data: tenant } = useQuery({
    queryKey: ['my-tenant', activeTenantId],
    queryFn: () => createPulseClient(session?.accessToken).getMyTenant(),
    enabled: !!session?.accessToken,
    staleTime: 60_000,
  });

  // Unread form submissions drive the only nav count — a real backlog number.
  const { data: submissions } = useQuery({
    queryKey: ['submissions', activeTenantId],
    queryFn: () => createPulseClient(session?.accessToken).getSubmissions(),
    enabled: !!session?.accessToken && canForms,
    staleTime: 30_000,
  });
  const unreadForms = (submissions ?? []).filter((s: { read?: boolean }) => !s.read).length;

  const groups: ShellNavGroup[] = navDefinition(unreadForms).map((g) => ({
    label: g.label,
    items: g.items.map(({ gate, ...i }) => ({
      ...i,
      lockedLabel: gate && !hasFeature(plan, gate) ? PLAN_LABEL[requiredPlan(gate)] : undefined,
    })),
  }));

  const footerItems: ShellNavItem[] = [
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, match: ['/dashboard/billing', '/dashboard/setup'] },
    { name: 'View store', href: SITE_URL, icon: Store, external: true },
  ];

  const pageTitle =
    [...groups.flatMap((g) => g.items), ...footerItems].find((i) => isNavActive(pathname, i))?.name ?? 'Workspace';

  return (
    <>
      <AppShell
        product="Admin"
        groups={groups}
        footerItems={footerItems}
        primaryAction={{ label: 'New page', href: '/dashboard/pages/new', icon: Plus }}
        workspace={{ name: tenant?.name ?? 'Workspace', plan: PLAN_LABEL[plan] }}
        user={{ name: session?.user?.name, email: session?.user?.email, role: session?.user?.role }}
        onLogout={() => signOut({ callbackUrl: '/login' })}
        apiOnline={apiOnline}
        banner={process.env.NEXT_PUBLIC_DEMO_MODE !== 'false' ? <DemoBanner /> : undefined}
        pageTitle={pageTitle}
        sidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        onCloseSidebar={closeSidebar}
        userMenuExtra={
          isSuperAdmin ? (
            <div className="border-b border-border px-2 py-2">
              <p className="omni-label mb-1">Preview plan</p>
              <div className="grid grid-cols-4 gap-1">
                {PREVIEW_PLANS.map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => setPreviewPlan(m.value)}
                    className={cn(
                      'rounded-sm px-1 py-1 text-[11px]',
                      previewPlan === m.value ? 'bg-brand/15 text-brand-fg' : 'text-neutral-400 hover:bg-surface-2',
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          ) : undefined
        }
      >
        {children}
      </AppShell>
      <SupportWidget />
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background text-sm text-neutral-500">Loading workspace…</div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
