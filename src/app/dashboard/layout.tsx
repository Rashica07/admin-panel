'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Home,
  FileText,
  Image as ImageIcon,
  Settings,
  LogOut,
  Menu,
  X,
  Paintbrush,
  Globe,
  Building2,
  FormInput,
  SearchCheck,
  LineChart,
  Palette,
  AlignLeft,
  ChevronDown,
  Bell,
  HelpCircle,
  Search,
  Moon,
  Sun,
  Lock,
  Eye,
  Newspaper,
  Folder,
} from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useUIStore } from '@/store/useStore';
import { usePlan } from '@/hooks/usePlan';
import { useApiStatus } from '@/hooks/useApiStatus';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SupportWidget } from '@/components/support-widget';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
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
  gate?: FeatureKey;
  children?: { name: string; href: string; icon: React.ElementType }[];
};
type NavGroup = { label: string; items: NavItem[] };

function buildNav(isSuperAdmin: boolean): NavGroup[] {
  const groups: NavGroup[] = [];

  groups.push({
    label: '',
    items: [
      { name: 'Home', href: '/dashboard', icon: Home },
    ],
  });

  groups.push({
    label: 'Sales channels',
    items: [
      { name: 'Online Store', href: '/dashboard/websites', icon: Globe, gate: 'multisite' },
    ],
  });

  groups.push({
    label: 'Content Management',
    items: [
      { name: 'Pages', href: '/dashboard/pages', icon: FileText },
      { name: 'Posts', href: '/dashboard/posts', icon: Newspaper },
      { name: 'Categories', href: '/dashboard/categories', icon: Folder },
      { name: 'Visual Editor', href: '/dashboard/builder', icon: Paintbrush },
      { name: 'Media Library', href: '/dashboard/photos', icon: ImageIcon },
    ],
  });

  groups.push({
    label: 'Storefront',
    items: [
      { name: 'Forms & Leads', href: '/dashboard/forms', icon: FormInput, gate: 'forms' },
      { name: 'Themes', href: '/dashboard/themes', icon: Palette, gate: 'themes' },
      { name: 'Menus', href: '/dashboard/menus', icon: AlignLeft, gate: 'menus' },
    ],
  });

  groups.push({
    label: 'Growth',
    items: [
      { name: 'Analytics', href: '/dashboard/analytics', icon: LineChart, gate: 'analytics' },
      { name: 'SEO', href: '/dashboard/seo', icon: SearchCheck, gate: 'seo' },
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

  // Current page title for Breadcrumbs
  const activeNavItem = navGroups
    .flatMap((g) => g.items)
    .find((i) =>
      !i.external &&
      (i.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(i.href)),
    );
  
  const pageTitle = activeNavItem?.name ?? 'Settings';

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 lg:hidden" onClick={closeSidebar} />
      )}

      {/* ─── LEFT SIDEBAR ────────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col -translate-x-full border-r border-border bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0 w-[240px]',
          isSidebarOpen && 'translate-x-0'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-14 shrink-0 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight text-white hover:text-brand transition-colors">
            <div className="h-6 w-6 rounded bg-brand flex items-center justify-center text-black font-black text-xs">
              NP
            </div>
            <span>Novus Pulse</span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8 rounded-md" onClick={closeSidebar}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-6 custom-scrollbar">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {group.label && (
                <p className="px-3 mb-2 text-xs font-semibold text-neutral-500">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = !item.external && (item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href));
                  const hasChildren = !!item.children?.length;
                  const isOpen = hasChildren && (expanded.has(item.name) || isActive);
                  const isLocked = item.gate ? !hasFeature(plan, item.gate) : false;

                  const inner = (
                    <>
                      {/* Active Left Indicator Bar */}
                      {isActive && !isLocked && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-brand" />
                      )}
                      <item.icon
                        className={cn(
                          'h-[18px] w-[18px] shrink-0',
                          isLocked ? 'text-neutral-600' : isActive ? 'text-brand' : 'text-neutral-400 group-hover:text-neutral-200'
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                      {isLocked && item.gate && (
                        <span className="ml-auto rounded bg-neutral-800/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-neutral-500">
                          <Lock className="h-2.5 w-2.5 inline-block mr-0.5" />
                          {PLAN_LABEL[hasFeature('studio', item.gate) ? 'studio' : 'agency']}
                        </span>
                      )}
                      {hasChildren && !isLocked && (
                        <ChevronDown className={cn('ml-auto h-3.5 w-3.5 transition-transform text-neutral-500 group-hover:text-white', isOpen && 'rotate-180')} />
                      )}
                    </>
                  );

                  const classes = cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors w-full text-left',
                    isLocked ? 'text-neutral-600 cursor-not-allowed' 
                             : isActive ? 'bg-brand/10 text-brand' : 'text-neutral-400 hover:bg-surface-2 hover:text-neutral-200'
                  );

                  if (hasChildren) {
                    return (
                      <div key={item.name}>
                        <button
                          type="button"
                          onClick={() => {
                            if (isLocked) return;
                            setExpanded((prev) => {
                              const next = new Set(prev);
                              next.has(item.name) ? next.delete(item.name) : next.add(item.name);
                              return next;
                            });
                          }}
                          className={classes}
                        >
                          {inner}
                        </button>
                        {isOpen && !isLocked && (
                          <div className="mt-1 ml-4 border-l border-border/60 pl-3 space-y-0.5">
                            {item.children!.map((child) => {
                              const [childPath, childQuery] = child.href.split('?');
                              const childType = new URLSearchParams(childQuery).get('type');
                              const currentType = searchParams.get('type');
                              const childActive = pathname === childPath && (childType ? childType === currentType : !currentType);
                              return (
                                <Link
                                  key={child.name}
                                  href={child.href}
                                  onClick={closeSidebar}
                                  className={cn(
                                    'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
                                    childActive ? 'text-brand bg-brand/5' : 'text-neutral-500 hover:text-neutral-200 hover:bg-surface-2'
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

                  return item.external ? (
                    <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer" className={classes}>
                      {inner}
                    </a>
                  ) : (
                    <Link key={item.name} href={item.href} onClick={closeSidebar} className={classes}>
                      {inner}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Bottom Settings Nav */}
          <div className="pt-2">
            <Link 
              href="/dashboard/settings" 
              onClick={closeSidebar}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors w-full text-left',
                pathname.startsWith('/dashboard/settings') ? 'bg-brand/10 text-brand' : 'text-neutral-400 hover:bg-surface-2 hover:text-neutral-200'
              )}
            >
              {pathname.startsWith('/dashboard/settings') && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-brand" />
              )}
              <Settings className={cn('h-[18px] w-[18px] shrink-0', pathname.startsWith('/dashboard/settings') ? 'text-brand' : 'text-neutral-400 group-hover:text-neutral-200')} />
              <span>Settings</span>
            </Link>
          </div>
        </nav>

      </aside>

      {/* ─── MAIN CONTENT COLUMN ─────────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col min-w-0 bg-[#0a0a0a]">
        
        {/* ─── TOP NAVIGATION BAR ────────────────────────────────────────────────── */}
        <header className="h-14 shrink-0 flex items-center justify-between px-4 lg:px-6 bg-[#0a0a0a] border-b border-border/40">
          <div className="flex items-center gap-3 flex-1">
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8 rounded-md -ml-2 text-neutral-400" onClick={toggleSidebar}>
              <Menu className="h-4 w-4" />
            </Button>
            
            {/* Breadcrumb / Title */}
            <div className="hidden sm:flex items-center text-sm">
              <span className="text-neutral-500 font-medium cursor-default">Novus</span>
              <span className="mx-2 text-neutral-600">/</span>
              <span className="font-semibold text-neutral-200">{pageTitle}</span>
            </div>
            <div className="sm:hidden font-semibold text-neutral-200">{pageTitle}</div>

            {/* Global Search */}
            <div className="hidden md:flex ml-8 max-w-md w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full h-9 bg-surface border border-border-strong rounded-lg pl-9 pr-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="hidden lg:inline-flex items-center justify-center rounded border border-border-strong bg-surface-2 px-1.5 font-mono text-[10px] font-medium text-neutral-500">⌘K</kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* API Status Indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 h-8 rounded-md bg-surface border border-border-strong mr-2">
              <span className="relative flex h-2 w-2">
                {apiOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />}
                <span className={cn('relative inline-flex rounded-full h-2 w-2', apiOnline === null ? 'bg-neutral-500' : apiOnline ? 'bg-green-500' : 'bg-red-500')} />
              </span>
              <span className="text-[11px] font-medium text-neutral-400">
                {apiOnline === null ? 'Checking API' : apiOnline ? 'Connected' : 'Offline'}
              </span>
            </div>

            {/* Notifications & Help */}
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-neutral-400 hover:text-white">
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-neutral-400 hover:text-white relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-brand" />
            </Button>

            {/* User Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="ml-1 flex items-center gap-2 h-8 rounded-full pl-1 pr-3 bg-surface hover:bg-surface-2 border border-border-strong transition-colors focus:outline-none">
                  <div className="h-6 w-6 rounded-full bg-brand/20 text-brand flex items-center justify-center text-[10px] font-bold uppercase border border-brand/30">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-xs font-medium text-neutral-300 truncate max-w-[100px] hidden sm:block">
                    {session?.user?.name?.split(' ')[0]}
                  </span>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" sideOffset={8} className="w-56 z-50 rounded-xl border border-border-strong bg-surface-2 p-1.5 shadow-xl animate-in fade-in-80 zoom-in-95">
                  <div className="px-2 py-2 mb-1 border-b border-border">
                    <p className="text-sm font-semibold text-white truncate">{session?.user?.name}</p>
                    <p className="text-xs text-neutral-400 truncate">{session?.user?.email}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand border border-brand/20">
                        {role.replace('_', ' ')}
                      </span>
                      <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                        {PLAN_LABEL[plan]}
                      </span>
                    </div>
                  </div>
                  
                  {isSuperAdmin && (
                    <div className="px-2 py-1 mb-1 border-b border-border">
                      <p className="text-[10px] font-bold text-neutral-500 uppercase mb-1">Preview Mode</p>
                      <div className="grid grid-cols-2 gap-1">
                        {PREVIEW_PLANS.map((m) => (
                          <button
                            key={m.label}
                            onClick={() => setPreviewPlan(m.value)}
                            className={cn(
                              'text-left rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors',
                              previewPlan === m.value ? 'bg-brand/15 text-brand font-bold' : 'text-neutral-400 hover:bg-neutral-800'
                            )}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <DropdownMenu.Item className="rounded-md px-2 py-2 text-sm text-neutral-300 hover:bg-brand/10 hover:text-brand cursor-pointer outline-none transition-colors" asChild>
                    <Link href="/dashboard/settings">Manage Account</Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item 
                    className="flex items-center justify-between rounded-md px-2 py-2 text-sm text-neutral-300 hover:bg-neutral-800 cursor-pointer outline-none transition-colors"
                  >
                    Dark Mode <Moon className="h-3.5 w-3.5 text-neutral-500" />
                  </DropdownMenu.Item>
                  <div className="h-px bg-border my-1" />
                  <DropdownMenu.Item 
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-red-400 hover:bg-red-500/10 cursor-pointer outline-none transition-colors"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" /> Log out
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        {/* ─── PAGE CONTENT ──────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 lg:p-8 max-w-[1600px] mx-auto min-h-full">
            <div key={pathname} className="anim-page h-full">
              {children}
            </div>
          </div>
        </div>
      </main>

      <SupportWidget />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-neutral-400">Loading workspace...</div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
