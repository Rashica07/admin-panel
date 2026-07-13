'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPulseClient } from '@/lib/novus-pulse-client';
import { usePages } from '@/hooks/usePages';
import { usePlan } from '@/hooks/usePlan';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  type FeatureKey,
  PLAN_LABEL,
  PLAN_PRICE,
  FEATURE_COPY,
  type Plan,
} from '@/lib/plan';
import {
  Settings as SettingsIcon,
  Bell,
  ToggleLeft,
  MessageCircle,
  ListChecks,
  CalendarDays,
  CreditCard,
  PiggyBank,
  BadgeDollarSign,
  Users,
  ShieldCheck,
  ScrollText,
  UserCircle,
  Languages,
  Check,
  Lock,
  ArrowRight,
  Eye,
  KeyRound,
  Globe,
  Shield,
  Loader2,
  Save,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Generic, locally-persisted settings
// (Server-side settings storage is on the roadmap; until then these
// persist per-tenant in the browser so the panel is fully usable.)
// ─────────────────────────────────────────────────────────────

type Field =
  | { type: 'text'; key: string; label: string; placeholder?: string }
  | { type: 'toggle'; key: string; label: string; hint?: string }
  | { type: 'select'; key: string; label: string; options: [string, string][] };

type SectionId =
  | 'general' | 'api' | 'notifications' | 'features' | 'whatsapp' | 'setup' | 'calendar'
  | 'payments' | 'finances' | 'subscriptions' | 'staff' | 'roles' | 'audit'
  | 'profile' | 'language';

/** Map section IDs to the feature key that gates them (if any). */
const SECTION_GATE: Partial<Record<SectionId, FeatureKey>> = {
  whatsapp: 'whatsapp',
  calendar: 'calendar',
  staff: 'staff',
  roles: 'roles',
  audit: 'audit',
  payments: 'payments',
  finances: 'finances',
};

const SECTIONS: { id: SectionId; name: string; icon: React.ElementType }[] = [
  { id: 'general', name: 'General', icon: SettingsIcon },
  { id: 'api', name: 'API & Integrations', icon: KeyRound },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'features', name: 'Features', icon: ToggleLeft },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle },
  { id: 'setup', name: 'Setup Guide', icon: ListChecks },
  { id: 'calendar', name: 'Calendar', icon: CalendarDays },
  { id: 'payments', name: 'Payments', icon: CreditCard },
  { id: 'finances', name: 'Finances', icon: PiggyBank },
  { id: 'subscriptions', name: 'Subscriptions', icon: BadgeDollarSign },
  { id: 'staff', name: 'Staff', icon: Users },
  { id: 'roles', name: 'Roles & Rules', icon: ShieldCheck },
  { id: 'audit', name: 'Audit Logs', icon: ScrollText },
  { id: 'profile', name: 'Profile', icon: UserCircle },
  { id: 'language', name: 'Language', icon: Languages },
];

const FIELD_SECTIONS: Partial<Record<SectionId, { title: string; desc: string; fields: Field[] }>> = {
  general: {
    title: 'General',
    desc: 'Basic information about your business and workspace.',
    fields: [
      { type: 'text', key: 'businessName', label: 'Business name', placeholder: 'Your company' },
      { type: 'text', key: 'tagline', label: 'Tagline', placeholder: 'What you do, in one line' },
      { type: 'text', key: 'contactEmail', label: 'Contact email', placeholder: 'you@company.com' },
      { type: 'select', key: 'timezone', label: 'Timezone', options: [['Europe/Rome', 'Europe/Rome (CET)'], ['Europe/Tirane', 'Europe/Tirane (CET)'], ['UTC', 'UTC'], ['Europe/London', 'Europe/London']] },
    ],
  },
  notifications: {
    title: 'Notifications',
    desc: 'Choose what you get emailed about.',
    fields: [
      { type: 'toggle', key: 'notifyEdits', label: 'Content changes', hint: 'When someone on your team edits the site' },
      { type: 'toggle', key: 'notifyForms', label: 'Form submissions', hint: 'When a visitor sends a contact/quote form' },
      { type: 'toggle', key: 'notifyBilling', label: 'Billing & invoices', hint: 'Receipts and payment reminders' },
      { type: 'toggle', key: 'notifyProduct', label: 'Product updates', hint: 'New Novus Pulse features' },
    ],
  },
  features: {
    title: 'Features',
    desc: 'Turn site capabilities on or off.',
    fields: [
      { type: 'toggle', key: 'featBlog', label: 'Blog / Writing section' },
      { type: 'toggle', key: 'featBooking', label: 'Booking & appointments' },
      { type: 'toggle', key: 'featEcommerce', label: 'E-commerce (products & cart)' },
      { type: 'toggle', key: 'featChat', label: 'Website chat widget' },
      { type: 'toggle', key: 'featAnalytics', label: 'Visitor analytics' },
    ],
  },
  whatsapp: {
    title: 'WhatsApp',
    desc: 'The floating WhatsApp button on your website.',
    fields: [
      { type: 'toggle', key: 'waEnabled', label: 'Show WhatsApp button' },
      { type: 'text', key: 'waNumber', label: 'Phone number', placeholder: '+39 …' },
      { type: 'text', key: 'waPrefill', label: 'Pre-filled message', placeholder: "Hi! I'd like to ask about…" },
    ],
  },
  calendar: {
    title: 'Calendar',
    desc: 'Booking availability and calendar connections.',
    fields: [
      { type: 'toggle', key: 'calEnabled', label: 'Accept bookings' },
      { type: 'text', key: 'calLink', label: 'Booking link (Cal.com / Calendly)', placeholder: 'https://cal.com/you' },
      { type: 'select', key: 'calSlot', label: 'Default slot length', options: [['15', '15 minutes'], ['30', '30 minutes'], ['60', '1 hour']] },
    ],
  },
  payments: {
    title: 'Payments',
    desc: 'How customers pay you through your website.',
    fields: [
      { type: 'select', key: 'payCurrency', label: 'Currency', options: [['EUR', 'EUR €'], ['USD', 'USD $'], ['GBP', 'GBP £'], ['ALL', 'ALL L']] },
      { type: 'text', key: 'payIban', label: 'Payout IBAN', placeholder: 'IT00 …' },
      { type: 'toggle', key: 'payInvoices', label: 'Auto-generate invoices' },
    ],
  },
  finances: {
    title: 'Finances',
    desc: 'Bookkeeping preferences for your reports.',
    fields: [
      { type: 'text', key: 'finVat', label: 'VAT / Tax ID', placeholder: 'IT01234567890' },
      { type: 'select', key: 'finPeriod', label: 'Reporting period', options: [['monthly', 'Monthly'], ['quarterly', 'Quarterly'], ['yearly', 'Yearly']] },
      { type: 'text', key: 'finAccountant', label: "Accountant's email", placeholder: 'books@studio.it' },
    ],
  },
};

const LANGUAGES: [string, string][] = [
  ['en', 'English'],
  ['it', 'Italiano'],
  ['sq', 'Shqip'],
  ['de', 'Deutsch'],
];

const ROLES_MATRIX: { role: string; desc: string; perms: [string, boolean][] }[] = [
  {
    role: 'Tenant Owner',
    desc: 'You — full control of the workspace.',
    perms: [['Edit content', true], ['Manage staff', true], ['Billing', true], ['Dev tools', true], ['Delete workspace', true]],
  },
  {
    role: 'Editor',
    desc: 'Staff who keep the site up to date.',
    perms: [['Edit content', true], ['Manage staff', false], ['Billing', false], ['Dev tools', false], ['Delete workspace', false]],
  },
  {
    role: 'Viewer',
    desc: 'Read-only access for stakeholders.',
    perms: [['Edit content', false], ['Manage staff', false], ['Billing', false], ['Dev tools', false], ['Delete workspace', false]],
  },
];

const SETUP_STEPS: { label: string; done: boolean }[] = [
  { label: 'Create your workspace', done: true },
  { label: 'Connect your website', done: true },
  { label: 'Make your first edit in the Visual Editor', done: true },
  { label: 'Upload your photos', done: false },
  { label: 'Configure WhatsApp button', done: false },
  { label: 'Invite your team', done: false },
];

// ─────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session } = useSession();
  const { plan, can, isPreviewing } = usePlan();
  const [active, setActive] = useState<SectionId>('general');
  const [values, setValues] = useState<Record<string, unknown>>({});
  const storageKey = `np_settings_${session?.user?.tenantId ?? 'default'}`;

  // Load / persist local settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setValues(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  const setValue = useCallback(
    (key: string, value: unknown) => {
      setValues((prev) => {
        const next = { ...prev, [key]: value };
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [storageKey]
  );

  // Check if the active section is gated and locked
  const activeGate = SECTION_GATE[active];
  const isActiveLocked = activeGate ? !can(activeGate) : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-neutral-400 mt-1">Everything about your workspace, in one place. Changes save automatically.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Section list */}
        <div className="lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {SECTIONS.map((s) => {
              const gate = SECTION_GATE[s.id];
              const locked = gate ? !can(gate) : false;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(s.id)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors w-full text-left',
                    active === s.id
                      ? locked
                        ? 'bg-neutral-800/50 text-neutral-400 border border-neutral-700/50'
                        : 'bg-brand/10 text-brand border border-brand/20'
                      : locked
                      ? 'text-neutral-600 hover:bg-neutral-800/30 hover:text-neutral-500 border border-transparent'
                      : 'text-neutral-400 hover:bg-neutral-800/70 hover:text-white border border-transparent'
                  )}
                >
                  <s.icon className={cn('h-4 w-4 shrink-0', locked && 'opacity-50')} />
                  {s.name}
                  {locked && (
                    <Lock className="h-3 w-3 ml-auto text-neutral-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel */}
        <div className="flex-1 min-w-0 max-w-3xl">
          {isActiveLocked && activeGate ? (
            <SectionPaywall feature={activeGate} isPreviewing={isPreviewing} />
          ) : active === 'api' ? (
            <ApiPanel />
          ) : FIELD_SECTIONS[active] ? (
            <FieldPanel def={FIELD_SECTIONS[active]!} values={values} setValue={setValue} />
          ) : active === 'setup' ? (
            <SetupPanel />
          ) : active === 'subscriptions' ? (
            <SubscriptionsPanel plan={plan} isPreviewing={isPreviewing} />
          ) : active === 'staff' ? (
            <StaffPanel />
          ) : active === 'roles' ? (
            <RolesPanel />
          ) : active === 'audit' ? (
            <AuditPanel />
          ) : active === 'profile' ? (
            <ProfilePanel />
          ) : active === 'language' ? (
            <LanguagePanel value={(values.language as string) ?? 'en'} onChange={(v) => setValue('language', v)} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Section Paywall ─────────────────────────────────────────

function SectionPaywall({ feature, isPreviewing }: { feature: FeatureKey; isPreviewing: boolean }) {
  const copy = FEATURE_COPY[feature];
  const { requiredPlan: getRequired } = usePlan();
  const required = getRequired(feature);

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-brand/20 blur-xl" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 border border-border">
            <Lock className="h-6 w-6 text-brand" />
          </div>
        </div>

        <div className="space-y-2 max-w-sm">
          <h2 className="text-xl font-bold">{copy.title}</h2>
          <p className="text-sm text-neutral-400">{copy.desc}</p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-brand/10 border border-brand/20 px-4 py-2">
          <span className="text-xs text-neutral-400">Included in</span>
          <span className="text-sm font-semibold text-brand">{PLAN_LABEL[required]}</span>
          <span className="text-xs text-neutral-500">{PLAN_PRICE[required]}</span>
        </div>

        <Button
          className="gap-2"
          onClick={() => {
            // Scroll to subscriptions — it's on the same page
            const el = document.getElementById('subscriptions-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          View Plans <ArrowRight className="h-4 w-4" />
        </Button>

        {isPreviewing && (
          <p className="flex items-center gap-1.5 text-[10px] text-amber-400/80 uppercase tracking-wider mt-1">
            <Eye className="h-3 w-3" />
            Preview mode — your real plan unlocks this
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Generic field panel ─────────────────────────────────────

function FieldPanel({
  def,
  values,
  setValue,
}: {
  def: { title: string; desc: string; fields: Field[] };
  values: Record<string, unknown>;
  setValue: (k: string, v: unknown) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{def.title}</CardTitle>
        <CardDescription>{def.desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {def.fields.map((f) => {
          if (f.type === 'toggle') {
            const on = Boolean(values[f.key]);
            return (
              <div key={f.key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{f.label}</p>
                  {f.hint && <p className="text-xs text-neutral-500 mt-0.5">{f.hint}</p>}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => setValue(f.key, !on)}
                  className={cn(
                    'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                    on ? 'bg-brand' : 'bg-neutral-700'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                      on ? 'translate-x-[22px]' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>
            );
          }
          if (f.type === 'select') {
            return (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-xs text-neutral-400">{f.label}</Label>
                <select
                  value={(values[f.key] as string) ?? f.options[0][0]}
                  onChange={(e) => setValue(f.key, e.target.value)}
                  className="flex h-9 w-full items-center rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  {f.options.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            );
          }
          return (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-xs text-neutral-400">{f.label}</Label>
              <Input
                value={(values[f.key] as string) ?? ''}
                placeholder={f.placeholder}
                onChange={(e) => setValue(f.key, e.target.value)}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ── Custom panels ───────────────────────────────────────────

function SetupPanel() {
  const done = SETUP_STEPS.filter((s) => s.done).length;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup Guide</CardTitle>
        <CardDescription>
          {done}/{SETUP_STEPS.length} complete — you&apos;re {Math.round((done / SETUP_STEPS.length) * 100)}% of the way there.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <div className="h-2 rounded-full bg-neutral-800 overflow-hidden mb-4">
          <div className="h-full bg-brand transition-all" style={{ width: `${(done / SETUP_STEPS.length) * 100}%` }} />
        </div>
        {SETUP_STEPS.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-lg bg-neutral-900/50 px-4 py-3">
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                s.done ? 'bg-green-500/20 text-green-400' : 'border border-neutral-700 text-transparent'
              )}
            >
              <Check className="h-3 w-3" />
            </span>
            <span className={cn('text-sm', s.done ? 'text-neutral-400 line-through' : 'text-neutral-200')}>{s.label}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SubscriptionsPanel({ plan, isPreviewing }: { plan: Plan; isPreviewing: boolean }) {
  return (
    <div className="space-y-4" id="subscriptions-section">
      <Card className="border-brand/30">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">Current plan</p>
            <p className="text-2xl font-bold mt-1">
              {PLAN_LABEL[plan]}{' '}
              <span className="text-sm font-normal text-neutral-500">— {PLAN_PRICE[plan]}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isPreviewing && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-400">
                <Eye className="h-3 w-3" /> Preview
              </span>
            )}
            <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-400">Active</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upgrade</CardTitle>
          <CardDescription>Card payments via Stripe are launching soon. You&apos;ll be able to upgrade right here.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          {([
            ['studio', 'Studio', PLAN_PRICE.studio, '3 websites · staff roles · priority support'],
            ['agency', 'Agency', PLAN_PRICE.agency, 'Unlimited sites · headless API · white-label'],
          ] as const).map(([key, name, price, feats]) => {
            const isCurrent = plan === key;
            return (
              <div key={name} className={cn('rounded-xl border p-4 space-y-2', isCurrent ? 'border-brand/40 bg-brand/5' : 'border-border')}>
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold">{name}</span>
                  <span className="text-brand font-bold">{price}</span>
                </div>
                <p className="text-xs text-neutral-500">{feats}</p>
                <Button
                  variant={isCurrent ? 'default' : 'outline'}
                  size="sm"
                  className="w-full"
                  disabled
                  title={isCurrent ? 'Current plan' : 'Stripe integration coming soon'}
                >
                  {isCurrent ? 'Current' : 'Coming soon'}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function StaffPanel() {
  const { data: session } = useSession();
  const { data: users, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const pulse = createPulseClient(session?.accessToken);
      return pulse.getUsers();
    },
    enabled: !!session?.accessToken,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Staff</CardTitle>
          <CardDescription>Everyone with access to this workspace.</CardDescription>
        </div>
        <Button size="sm" variant="outline" disabled title="Email invites coming soon">Invite</Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-neutral-900" />)}</div>
        ) : (
          <div className="space-y-2">
            {(users ?? []).map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 rounded-lg bg-neutral-900/50 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/20 text-brand font-semibold text-sm">
                  {(u.firstName?.[0] ?? u.email[0]).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-neutral-500 truncate">{u.email}</p>
                </div>
                <span className="rounded-full bg-brand/10 border border-brand/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                  {String(u.role).replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RolesPanel() {
  return (
    <div className="space-y-4">
      {ROLES_MATRIX.map((r) => (
        <Card key={r.role}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{r.role}</CardTitle>
            <CardDescription>{r.desc}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {r.perms.map(([perm, allowed]) => (
              <span
                key={perm}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium',
                  allowed ? 'bg-green-500/10 text-green-400' : 'bg-neutral-800 text-neutral-500 line-through'
                )}
              >
                {perm}
              </span>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AuditPanel() {
  const { data: pages, isLoading } = usePages();
  const events = (pages ?? [])
    .flatMap((p: any) => [
      { at: p.updatedAt, text: `"${p.title}" content updated`, kind: 'update' },
      { at: p.createdAt, text: `"${p.title}" created`, kind: 'create' },
    ])
    .sort((a: any, b: any) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 20);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>Recent activity in this workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-neutral-900" />)}</div>
        ) : (
          <div className="space-y-1">
            {events.map((e: any, i: number) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-neutral-900/50">
                <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', e.kind === 'create' ? 'bg-green-500' : 'bg-brand')} />
                <span className="text-sm text-neutral-300 flex-1 truncate">{e.text}</span>
                <span className="text-xs text-neutral-600 shrink-0">
                  {formatDistanceToNow(new Date(e.at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProfilePanel() {
  const { data: session } = useSession();
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const parts = (session?.user?.name ?? '').split(' ');
    setFirst(parts[0] ?? '');
    setLast(parts.slice(1).join(' '));
  }, [session?.user?.name]);

  const save = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    try {
      const pulse = createPulseClient(session.accessToken);
      await pulse.updateUser(session.user.id, { firstName: first, lastName: last });
      toast.success('Profile updated', { description: 'Name changes appear after your next login.' });
    } catch {
      toast.error('Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your personal account details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/20 text-brand text-xl font-bold">
            {first.charAt(0) || 'U'}
          </div>
          <div>
            <p className="font-medium">{session?.user?.email}</p>
            <p className="text-[10px] uppercase tracking-wider text-brand/80 font-semibold mt-0.5">
              {(session?.user?.role ?? '').replace('_', ' ')}
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-neutral-400">First name</Label>
            <Input value={first} onChange={(e) => setFirst(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-neutral-400">Last name</Label>
            <Input value={last} onChange={(e) => setLast(e.target.value)} />
          </div>
        </div>
        <Button onClick={save} isLoading={saving}>Save changes</Button>
      </CardContent>
    </Card>
  );
}

function LanguagePanel({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Language</CardTitle>
        <CardDescription>Panel display language. Your website manages its own languages separately.</CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-3">
        {LANGUAGES.map(([code, name]) => (
          <button
            key={code}
            type="button"
            onClick={() => {
              onChange(code);
              toast.success(`Language set to ${name}`, { description: 'Full panel translations are rolling out soon.' });
            }}
            className={cn(
              'flex items-center justify-between rounded-xl border px-4 py-3.5 text-sm font-medium transition-colors',
              value === code
                ? 'border-brand/50 bg-brand/10 text-brand'
                : 'border-border bg-neutral-900/50 text-neutral-300 hover:border-neutral-600'
            )}
          >
            {name}
            {value === code && <Check className="h-4 w-4" />}
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Custom API Panel (persists into DB) ──────────────────────

function ApiPanel() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: async () => {
      const pulse = createPulseClient(session?.accessToken);
      return pulse.getTenant(session?.user?.tenantId as string);
    },
    enabled: !!session?.accessToken && !!session?.user?.tenantId,
  });

  const [formData, setFormData] = useState({
    name: '',
    siteUrl: '',
    whatsappNumber: '',
    revalidateSecret: '',
    resendApiKey: '',
    geminiApiKey: '',
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || '',
        siteUrl: tenant.siteUrl || '',
        whatsappNumber: tenant.whatsappNumber || '',
        revalidateSecret: tenant.revalidateSecret || '',
        resendApiKey: tenant.resendApiKey || '',
        geminiApiKey: tenant.geminiApiKey || '',
      });
    }
  }, [tenant]);

  const updateSettings = useMutation({
    mutationFn: async (data: Partial<typeof formData>) => {
      const pulse = createPulseClient(session?.accessToken);
      return pulse.updateTenant(session?.user?.tenantId as string, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
      toast.success('API Settings saved successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save settings');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(formData);
  };

  if (isLoading) {
    return <div className="animate-pulse bg-neutral-900 rounded-xl h-96" />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-neutral-400" /> General Info
          </CardTitle>
          <CardDescription>Basic information about your storefront.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Workspace Name</Label>
            <Input 
              id="name" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="bg-neutral-950 border-neutral-800"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="siteUrl">Live Site URL</Label>
            <Input 
              id="siteUrl" 
              placeholder="https://my-store.com"
              value={formData.siteUrl}
              onChange={e => setFormData({...formData, siteUrl: e.target.value})}
              className="bg-neutral-950 border-neutral-800 font-mono text-sm"
            />
            <p className="text-xs text-neutral-500">Used for CORS policies and webhook targets.</p>
          </div>
        </CardContent>
      </Card>

      {/* Integration Credentials */}
      <Card>
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-neutral-400" /> Integration Keys
          </CardTitle>
          <CardDescription>Securely store API keys for external services.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="geminiApiKey" className="flex items-center gap-2">
              Gemini API Key (AI Features)
            </Label>
            <Input 
              id="geminiApiKey" 
              type="password"
              placeholder="AIzaSy..."
              value={formData.geminiApiKey}
              onChange={e => setFormData({...formData, geminiApiKey: e.target.value})}
              className="bg-neutral-950 border-neutral-800 font-mono text-sm"
            />
            <p className="text-xs text-neutral-500">Required for the Content AI assistant.</p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="resendApiKey" className="flex items-center gap-2">
              Resend API Key (Email)
            </Label>
            <Input 
              id="resendApiKey" 
              type="password"
              placeholder="re_..."
              value={formData.resendApiKey}
              onChange={e => setFormData({...formData, resendApiKey: e.target.value})}
              className="bg-neutral-950 border-neutral-800 font-mono text-sm"
            />
            <p className="text-xs text-neutral-500">Required to send transactional emails to your users.</p>
          </div>
        </CardContent>
      </Card>

      {/* Advanced / Webhooks */}
      <Card>
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-neutral-400" /> Webhooks & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="revalidateSecret">Next.js Revalidation Secret</Label>
            <Input 
              id="revalidateSecret" 
              type="password"
              placeholder="Super secret string"
              value={formData.revalidateSecret}
              onChange={e => setFormData({...formData, revalidateSecret: e.target.value})}
              className="bg-neutral-950 border-neutral-800 font-mono text-sm"
            />
            <p className="text-xs text-neutral-500">Used to trigger ISR revalidations on your live frontend.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="whatsappNumber" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-green-500" /> WhatsApp Number
            </Label>
            <Input 
              id="whatsappNumber" 
              placeholder="+1234567890"
              value={formData.whatsappNumber}
              onChange={e => setFormData({...formData, whatsappNumber: e.target.value})}
              className="bg-neutral-950 border-neutral-800 font-mono text-sm"
            />
            <p className="text-xs text-neutral-500">Authorized number for WhatsApp CMS bot.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          size="lg" 
          className="gap-2 bg-brand hover:bg-brand/90"
          isLoading={updateSettings.isPending}
        >
          Save All Settings
        </Button>
      </div>
    </form>
  );
}
