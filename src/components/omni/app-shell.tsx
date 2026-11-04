'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, Search, X, ExternalLink, Lock, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OmniWordmark } from '@/components/omni/omni-mark';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export type ShellNavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  /** Opens in a new tab (e.g. the live site). */
  external?: boolean;
  /** Plan label shown when the feature is locked on the current plan. */
  lockedLabel?: string;
  /** Small right-aligned count (mono). Only pass real numbers. */
  count?: number;
  /** Extra path prefixes that should also mark this item active. */
  match?: string[];
};
export type ShellNavGroup = { label?: string; items: ShellNavItem[] };

export function isNavActive(pathname: string, item: Pick<ShellNavItem, 'href' | 'match' | 'external'>) {
  if (item.external) return false;
  if (item.href === '/dashboard') return pathname === '/dashboard';
  return [item.href, ...(item.match ?? [])].some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function NavLink({ item, pathname, onNavigate }: { item: ShellNavItem; pathname: string; onNavigate?: () => void }) {
  const active = isNavActive(pathname, item);
  const locked = !!item.lockedLabel;
  const classes = cn(
    'group relative flex h-[30px] items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors',
    locked
      ? 'text-neutral-600 hover:text-neutral-400'
      : active
        ? 'bg-surface-2 font-medium text-foreground'
        : 'text-neutral-400 hover:bg-surface-2/60 hover:text-neutral-200',
  );
  const inner = (
    <>
      {active && <span aria-hidden className="absolute -left-3 top-1.5 bottom-1.5 w-[2px] rounded-r bg-brand" />}
      <item.icon
        aria-hidden
        className={cn('h-[15px] w-[15px] shrink-0', active ? 'text-brand-fg' : locked ? 'text-neutral-600' : 'text-neutral-500 group-hover:text-neutral-300')}
      />
      <span className="truncate">{item.name}</span>
      {locked ? (
        <span className="ml-auto flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-neutral-600" title={`Available on ${item.lockedLabel}`}>
          <Lock className="h-2.5 w-2.5" aria-hidden />
          {item.lockedLabel}
        </span>
      ) : item.external ? (
        <ExternalLink className="ml-auto h-3 w-3 text-neutral-600" aria-hidden />
      ) : typeof item.count === 'number' && item.count > 0 ? (
        <span className="ml-auto font-mono text-[11px] tabular-nums text-neutral-500">{item.count}</span>
      ) : null}
    </>
  );

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={classes}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={item.href} onClick={onNavigate} className={classes} aria-current={active ? 'page' : undefined}>
      {inner}
    </Link>
  );
}

export function AppShell({
  product,
  groups,
  footerItems = [],
  primaryAction,
  workspace,
  user,
  onLogout,
  userMenuExtra,
  onSearch,
  apiOnline,
  banner,
  pageTitle,
  sidebarOpen,
  onToggleSidebar,
  onCloseSidebar,
  children,
}: {
  product: string;
  groups: ShellNavGroup[];
  footerItems?: ShellNavItem[];
  primaryAction?: { label: string; href: string; icon: React.ElementType };
  workspace: { name: string; plan?: string };
  user: { name?: string | null; email?: string | null; role?: string | null };
  onLogout: () => void;
  userMenuExtra?: React.ReactNode;
  onSearch?: () => void;
  apiOnline: boolean | null;
  banner?: React.ReactNode;
  pageTitle: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onCloseSidebar: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const initials =
    (user.name ?? user.email ?? '?')
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-surface-2 focus:px-3 focus:py-2 focus:text-sm">
        Skip to content
      </a>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onCloseSidebar} aria-hidden />}

      <aside
        aria-label="Primary"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[232px] -translate-x-full flex-col border-r border-border bg-sidebar transition-transform duration-150 lg:static lg:translate-x-0',
          sidebarOpen && 'translate-x-0',
        )}
      >
        <div className="flex h-12 shrink-0 items-center justify-between px-4">
          <Link href="/dashboard" aria-label={`OMNI ${product} home`}>
            <OmniWordmark product={product} />
          </Link>
          <button type="button" onClick={onCloseSidebar} className="rounded-md p-1 text-neutral-500 hover:text-foreground lg:hidden" aria-label="Close navigation">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 px-3 pb-3">
          <div className="flex items-center justify-between rounded-md border border-border bg-surface px-2.5 py-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-foreground">{workspace.name}</p>
              {workspace.plan && <p className="font-mono text-[10.5px] uppercase tracking-wider text-neutral-500">{workspace.plan} plan</p>}
            </div>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-neutral-600" aria-hidden />
          </div>
          {onSearch && (
            <button
              type="button"
              onClick={onSearch}
              className="flex h-8 w-full items-center gap-2 rounded-md border border-border bg-input px-2.5 text-[13px] text-neutral-500 transition-colors hover:border-border-strong hover:text-neutral-300"
            >
              <Search className="h-3.5 w-3.5" aria-hidden />
              Search content
              <kbd className="ml-auto rounded-sm border border-border-strong px-1 font-mono text-[10px] text-neutral-500">⌘K</kbd>
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
          {groups.map((group, i) => (
            <div key={group.label ?? i}>
              {group.label && <p className="omni-label mb-1 px-2.5">{group.label}</p>}
              <div className="space-y-px">
                {group.items.map((item) => (
                  <NavLink key={item.href + item.name} item={item} pathname={pathname} onNavigate={onCloseSidebar} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-2 border-t border-border px-3 py-3">
          {primaryAction && (
            <Link
              href={primaryAction.href}
              onClick={onCloseSidebar}
              className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-brand text-[13px] font-medium text-brand-foreground transition-colors hover:bg-brand-hover"
            >
              <primaryAction.icon className="h-3.5 w-3.5" aria-hidden />
              {primaryAction.label}
            </Link>
          )}
          {footerItems.length > 0 && (
            <div className="space-y-px">
              {footerItems.map((item) => (
                <NavLink key={item.href + item.name} item={item} pathname={pathname} onNavigate={onCloseSidebar} />
              ))}
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-surface-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-3 font-mono text-[11px] text-neutral-300">{initials}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-foreground">{user.name ?? 'Account'}</span>
                  <span className="block truncate text-[11px] text-neutral-500">{user.email}</span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" sideOffset={6} className="w-56">
              <div className="border-b border-border px-2 py-2">
                <p className="truncate text-[13px] font-medium text-foreground">{user.name}</p>
                <p className="truncate text-xs text-neutral-500">{user.email}</p>
                {user.role && <p className="mt-1 font-mono text-[10.5px] uppercase tracking-wider text-neutral-500">{user.role.replace('_', ' ')}</p>}
              </div>
              {userMenuExtra}
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Account &amp; settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="flex items-center gap-2">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {banner}
        <header className="flex h-11 shrink-0 items-center gap-3 border-b border-border px-4 lg:px-6">
          <button type="button" onClick={onToggleSidebar} className="-ml-1 rounded-md p-1 text-neutral-400 hover:text-foreground lg:hidden" aria-label="Open navigation">
            <Menu className="h-4 w-4" />
          </button>
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
            <span className="hidden truncate text-neutral-500 sm:inline">{workspace.name}</span>
            <span className="hidden text-neutral-700 sm:inline" aria-hidden>/</span>
            <span className="truncate font-medium text-foreground">{pageTitle}</span>
          </nav>
          <div className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-neutral-500" role="status" aria-live="polite">
            <span
              aria-hidden
              className={cn('h-1.5 w-1.5 rounded-full', apiOnline === null ? 'bg-neutral-600' : apiOnline ? 'bg-green-400' : 'bg-red-400')}
            />
            {apiOnline === null ? 'checking api' : apiOnline ? 'api connected' : 'api offline'}
          </div>
        </header>
        <main id="main" className="flex-1 overflow-y-auto">
          <div className="mx-auto min-h-full max-w-[1440px] px-4 py-5 lg:px-7 lg:py-6">
            <div key={pathname} className="anim-page h-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
