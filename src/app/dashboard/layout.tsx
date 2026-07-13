'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  FileText,
  Image as ImageIcon,
  Settings,
  LogOut,
  Menu,
  X,
  Paintbrush,
  Globe,
  Building2,
  TerminalSquare,
  Braces,
  Package,
  Newspaper,
  CalendarDays,
  Layers,
  PlusCircle,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
  Eye,
  MessageCircle,
  Users,
  ShieldCheck,
  ScrollText,
  CreditCard,
  PiggyBank,
  Palette,
  AlignLeft,
  FormInput,
  SearchCheck,
  LineChart,
} from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useUIStore } from '@/store/useStore';
import { usePlan } from '@/hooks/usePlan';
import { useApiStatus } from '@/hooks/useApiStatus';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SupportWidget } from '@/components/support-widget';
import {
  type Plan,
  type FeatureKey,
  PLAN_LABEL,
  hasFeature,
  isPlan,
} from '@/lib/plan';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:21113';

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  external?: boolean;
  /** If set, this nav item requires this feature to be unlocked. */
  gate?: FeatureKey;
  children?: { name: string; href: string; icon: React.ElementType }[];
};
type NavGroup = { label: string; items: NavItem[] };

function buildNav(isSuperAdmin: boolean): NavGroup[] {
  const groups: NavGroup[] = [];

  if (isSuperAdmin) {
    groups.push({
      label: 'Workspace',
      items: [{ name: 'Tenant Websites', href: '/dashboard/websites', icon: Building2, gate: 'multisite' }],
    });
  }

  groups.push({
    label: 'Content',
    items: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Pages', href: '/dashboard/pages', icon: FileText },
      { name: 'Media Library', href: '/dashboard/photos', icon: ImageIcon },
    ],
  });

  groups.push({
    label: 'Appearance',
    items: [
      { name: 'Visual Editor', href: '/dashboard/builder', icon: Paintbrush },
      { name: 'Themes', href: '/dashboard/themes', icon: Palette, gate: 'themes' },
      { name: 'Menus', href: '/dashboard/menus', icon: AlignLeft, gate: 'menus' },
    ],
  });

  groups.push({
    label: 'Marketing & SEO',
    items: [
      { name: 'Forms', href: '/dashboard/forms', icon: FormInput, gate: 'forms' },
      { name: 'SEO', href: '/dashboard/seo', icon: SearchCheck, gate: 'seo' },
      { name: 'Analytics', href: '/dashboard/analytics', icon: LineChart, gate: 'analytics' },
    ],
  });

  groups.push({
    label: 'System',
    items: [
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      { name: 'Open Live Site', href: SITE_URL, icon: Globe, external: true },
    ],
  });

  return groups;
}

const PREVIEW_PLANS: { value: Plan | null; label: string; hint: string }[] = [
  { value: null, label: 'Real', hint: 'Show your actual plan' },
  { value: 'starter', label: 'Starter', hint: 'Preview as Starter (trial)' },
  { value: 'studio', label: 'Studio', hint: 'Preview as Studio' },
  { value: 'agency', label: 'Agency', hint: 'Preview as Agency' },
];

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const {
    isSidebarOpen,
    toggleSidebar,
    closeSidebar,
    sidebarCollapsed,
    toggleCollapsed,
    previewPlan,
    setPreviewPlan,
    activeTenantId,
    activeTenantName,
    setActiveTenant,
  } = useUIStore();
  const apiOnline = useApiStatus();
  const { plan, isPreviewing, isSuperAdmin } = usePlan();

  useEffect(() => {
    if (session?.user && !activeTenantId) {
      setActiveTenant({
        id: session.user.tenantId || 'admin-workspace',
        slug: session.user.tenantSlug || 'admin-workspace',
        name: session.user.tenantSlug === 'admin-workspace' ? 'Admin Workspace' : (session.user.name || 'Workspace'),
      });
    }
  }, [session, activeTenantId, setActiveTenant]);

  const role = session?.user?.role ?? '';
  const navGroups = buildNav(isSuperAdmin);

  // Collapsed only applies on desktop; the mobile drawer is always full width
  const collapsed = sidebarCollapsed;

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 lg:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 -translate-x-full flex-col border-r border-border bg-background transition-all duration-200 lg:static lg:flex lg:translate-x-0',
          isSidebarOpen && 'flex translate-x-0',
          collapsed ? 'w-64 lg:w-[76px]' : 'w-64'
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-border',
            collapsed ? 'lg:justify-center lg:px-0 px-6 justify-between' : 'justify-between px-6'
          )}
        >
          <div className="flex flex-col min-w-0">
            <Link
              href="/dashboard"
              className={cn('font-bold tracking-tight text-brand truncate', collapsed ? 'text-xl lg:text-lg' : 'text-xl')}
            >
              {collapsed ? <span className="hidden lg:inline">NP</span> : null}
              <span className={collapsed ? 'lg:hidden' : ''}>Novus Pulse</span>
            </Link>
            {!collapsed && activeTenantName && (
              <span className="text-[10px] text-neutral-400 font-mono mt-0.5 truncate max-w-[180px]">
                Site: {activeTenantName}
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={closeSidebar}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav */}
        <nav className={cn('flex-1 py-4 overflow-y-auto overflow-x-hidden', collapsed ? 'px-2 lg:px-3' : 'px-4')}>
          {navGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <p
                className={cn(
                  'px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-600',
                  collapsed && 'lg:hidden'
                )}
              >
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    !item.external &&
                    (item.href === '/dashboard'
                      ? pathname === '/dashboard'
                      : pathname.startsWith(item.href));
                  const hasChildren = !!item.children?.length;
                  const isOpen = hasChildren && (expanded.has(item.name) || isActive);
                  const isLocked = item.gate ? !hasFeature(plan, item.gate) : false;

                  const classes = cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    collapsed && 'lg:justify-center lg:px-0 lg:py-2.5',
                    isLocked
                      ? 'text-neutral-600 hover:bg-neutral-800/40 hover:text-neutral-500 border border-transparent'
                      : isActive
                      ? 'bg-brand/10 text-brand border border-brand/20'
                      : 'text-neutral-400 hover:bg-neutral-800/70 hover:text-white border border-transparent'
                  );

                  const inner = (
                    <>
                      <item.icon
                        className={cn(
                          'h-[18px] w-[18px] shrink-0',
                          isLocked ? 'text-neutral-600' : isActive ? 'text-brand' : 'text-neutral-400'
                        )}
                      />
                      <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.name}</span>
                      {item.external && (
                        <span className={cn('ml-auto text-[9px] text-neutral-600', collapsed && 'lg:hidden')}>↗</span>
                      )}
                      {/* Lock badge for gated items */}
                      {isLocked && item.gate && (
                        <span className={cn('ml-auto flex items-center gap-1 rounded-full bg-neutral-800/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-neutral-500', collapsed && 'lg:hidden')}>
                          <Lock className="h-2.5 w-2.5" />
                          {PLAN_LABEL[hasFeature('studio', item.gate) ? 'studio' : 'agency']}
                        </span>
                      )}
                      {hasChildren && !isLocked && (
                        <ChevronDown
                          className={cn(
                            'ml-auto h-3.5 w-3.5 shrink-0 transition-transform',
                            collapsed && 'lg:hidden',
                            isOpen && 'rotate-180'
                          )}
                        />
                      )}
                    </>
                  );

                  if (hasChildren) {
                    return (
                      <div key={item.name}>
                        <button
                          type="button"
                          onClick={() => {
                            if (isLocked) return; // Don't expand locked items
                            setExpanded((prev) => {
                              const next = new Set(prev);
                              next.has(item.name) ? next.delete(item.name) : next.add(item.name);
                              return next;
                            });
                          }}
                          className={cn(classes, 'w-full')}
                          title={isLocked ? `Requires ${PLAN_LABEL[hasFeature('studio', item.gate!) ? 'studio' : 'agency']} plan` : item.name}
                        >
                          {inner}
                        </button>
                        {isOpen && !isLocked && (
                          <div className={cn('mt-0.5 space-y-0.5', collapsed ? 'lg:hidden' : 'ml-4 border-l border-border/60 pl-3')}>
                            {item.children!.map((child) => {
                              const [childPath, childQuery] = child.href.split('?');
                              const childType = new URLSearchParams(childQuery).get('type');
                              const currentType = searchParams.get('type');
                              const childActive =
                                pathname === childPath && (childType ? childType === currentType : !currentType);
                              return (
                                <Link
                                  key={child.name}
                                  href={child.href}
                                  onClick={closeSidebar}
                                  className={cn(
                                    'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
                                    childActive
                                      ? 'text-brand'
                                      : 'text-neutral-500 hover:text-white'
                                  )}
                                >
                                  <child.icon className="h-3.5 w-3.5 shrink-0" />
                                  {child.name}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Non-gated items are normal links; gated items still link to the page
                  // (PlanGate handles the paywall on the page itself)
                  return item.external ? (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={classes}
                      title={item.name}
                    >
                      {inner}
                    </a>
                  ) : (
                    <Link key={item.name} href={item.href} onClick={closeSidebar} className={classes} title={isLocked ? `Requires ${PLAN_LABEL[item.gate && hasFeature('studio', item.gate) ? 'studio' : 'agency']} plan` : item.name}>
                      {inner}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={cn('border-t border-border space-y-3', collapsed ? 'p-2 lg:p-3' : 'p-4')}>
          {/* API status */}
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg bg-neutral-900/70 border border-border/50 px-3 py-2',
              collapsed && 'lg:justify-center lg:px-0'
            )}
            title={apiOnline === null ? 'Checking API…' : apiOnline ? 'API Connected' : 'API Offline'}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              {apiOnline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              )}
              <span
                className={cn(
                  'relative inline-flex rounded-full h-2 w-2',
                  apiOnline === null ? 'bg-neutral-500' : apiOnline ? 'bg-green-500' : 'bg-red-500'
                )}
              />
            </span>
            <span className={cn('text-[11px] font-mono text-neutral-400', collapsed && 'lg:hidden')}>
              {apiOnline === null ? 'Checking API…' : apiOnline ? 'API Connected' : 'API Offline'}
            </span>
          </div>

          {/* Preview as plan — super_admin only */}
          {isSuperAdmin && (
            <div className={cn(collapsed && 'lg:hidden')}>
              <p className="px-1 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-600 flex items-center gap-1.5">
                <Eye className="h-3 w-3" /> Preview as plan
              </p>
              <div className="grid grid-cols-4 gap-1 rounded-lg bg-neutral-900/70 border border-border/50 p-1">
                {PREVIEW_PLANS.map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => setPreviewPlan(m.value)}
                    title={m.hint}
                    className={cn(
                      'rounded-md px-1 py-1.5 text-[10px] font-semibold transition-colors',
                      previewPlan === m.value
                        ? 'bg-brand text-black'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {isPreviewing && (
                <p className="text-[9px] text-amber-400/70 mt-1.5 px-1 flex items-center gap-1">
                  <Eye className="h-2.5 w-2.5" />
                  Previewing as {PLAN_LABEL[previewPlan!]} — your real plan is {PLAN_LABEL[isPlan(session?.user?.plan) ? session!.user!.plan as Plan : 'starter']}
                </p>
              )}
            </div>
          )}

          {/* Profile + role + plan badge */}
          <div className={cn('flex items-center gap-3 px-1', collapsed && 'lg:justify-center lg:px-0')}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand font-semibold">
              {session?.user?.name?.charAt(0) || 'U'}
            </div>
            <div className={cn('flex flex-col overflow-hidden', collapsed && 'lg:hidden')}>
              <span className="truncate text-sm font-medium">{session?.user?.name}</span>
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[10px] uppercase tracking-wider text-brand/80 font-semibold">
                  {role.replace('_', ' ')}
                </span>
                <span className="rounded-full bg-brand/10 px-1.5 py-0 text-[9px] font-semibold text-brand/70 uppercase">
                  {PLAN_LABEL[plan]}
                </span>
              </div>
            </div>
          </div>

          <div className={cn('flex gap-1', collapsed ? 'lg:flex-col lg:items-center' : 'items-center')}>
            <Button
              variant="ghost"
              className={cn(
                'text-neutral-400 hover:text-white',
                collapsed ? 'lg:w-auto lg:px-2 flex-1 justify-start' : 'flex-1 justify-start'
              )}
              onClick={handleLogout}
              title="Log Out"
            >
              <LogOut className={cn('h-5 w-5', !collapsed && 'mr-3')} />
              <span className={cn(collapsed && 'lg:hidden')}>Log Out</span>
            </Button>
            {/* Collapse toggle — desktop only */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex text-neutral-500 hover:text-white"
              onClick={toggleCollapsed}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-16 items-center justify-between border-b border-border px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="font-semibold">Novus Pulse</div>
          <div className="w-9" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</div>
      </main>

      {/* Floating chat support (local assistant — no API keys) */}
      <SupportWidget />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background text-neutral-400">Loading workspace...</div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
