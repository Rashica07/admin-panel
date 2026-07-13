'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Settings as SettingsIcon, 
  CreditCard, 
  Users, 
  Blocks, 
  Bell, 
  ScrollText, 
  ShoppingCart, 
  Store, 
  ShieldCheck, 
  Package, 
  Percent, 
  Building,
  HelpCircle,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const SETTINGS_SECTIONS = [
  { id: 'general', name: 'General', icon: SettingsIcon },
  { id: 'plan-billing', name: 'Plan & Billing', icon: CreditCard },
  { id: 'staff', name: 'Staff & Permissions', icon: Users },
  { id: 'apps', name: 'Apps & Integrations', icon: Blocks },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'policies', name: 'Policies', icon: ScrollText },
  { id: 'checkout', name: 'Checkout', icon: ShoppingCart },
  { id: 'sales-channels', name: 'Sales Channels', icon: Store },
  { id: 'privacy-security', name: 'Privacy & Security', icon: ShieldCheck },
  { id: 'shipping', name: 'Shipping & Fulfillment', icon: Package },
  { id: 'taxes', name: 'Taxes', icon: Percent },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* ─── HEADER ────────────────────────────────────────────── */}
      <div className="mb-6 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
          <div className="flex items-center text-sm text-neutral-400 mt-1 space-x-2">
            <Link href="/dashboard" className="hover:text-white transition-colors">Home</Link>
            <span>›</span>
            <span className="text-neutral-300">Settings</span>
          </div>
        </div>
        <button className="text-neutral-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
          <HelpCircle className="h-4 w-4" /> Help
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-1 min-h-0">
        {/* ─── LEFT SIDEBAR (220px) ──────────────────────────────── */}
        <div className="md:w-[220px] shrink-0 flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-hide pb-10">
          
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
            <Input 
              placeholder="Search settings..." 
              className="pl-8 h-9 bg-surface-2 border-border-strong text-sm text-white focus-visible:ring-brand"
            />
          </div>

          <nav className="flex flex-col gap-1">
            {SETTINGS_SECTIONS.map((s) => {
              const isActive = pathname.includes(`/settings/${s.id}`);
              return (
                <Link
                  key={s.id}
                  href={`/dashboard/settings/${s.id}`}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-brand/10 text-brand border-l-2 border-brand rounded-l-none pl-2.5'
                      : 'text-neutral-400 hover:bg-surface-2/80 hover:text-white border-l-2 border-transparent pl-2.5'
                  )}
                >
                  <s.icon 
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors', 
                      isActive ? 'text-brand' : 'text-neutral-500 group-hover:text-white'
                    )} 
                  />
                  {s.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ─── MAIN CONTENT AREA ─────────────────────────────────── */}
        <div className="flex-1 min-w-0 max-w-4xl overflow-y-auto pb-32 pr-2">
          {children}
        </div>
      </div>
    </div>
  );
}
