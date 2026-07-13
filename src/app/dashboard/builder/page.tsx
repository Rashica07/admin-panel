'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { createPulseClient } from '@/lib/novus-pulse-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { defaultPortfolioContent } from '@/lib/default-content';
import { useUIStore } from '@/store/useStore';
import {
  ChevronRight,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

type Path = (string | number)[];

/** Immutable deep-set at a path. */
function setAtPath(obj: any, path: Path, value: any): any {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (Array.isArray(obj)) {
    const copy = [...obj];
    copy[head as number] = setAtPath(copy[head as number], rest, value);
    return copy;
  }
  return { ...obj, [head]: setAtPath(obj?.[head], rest, value) };
}

/** Get value at a path. */
function getAtPath(obj: any, path: Path): any {
  return path.reduce((acc, key) => acc?.[key], obj);
}

/** Deep-merge `saved` over `defaults` so new default sections always appear. */
function mergeWithDefaults(defaults: any, saved: any): any {
  if (saved === undefined || saved === null) return defaults;
  if (Array.isArray(saved)) return saved;
  if (typeof saved === 'object' && typeof defaults === 'object' && !Array.isArray(defaults)) {
    const out: any = { ...defaults };
    for (const key of Object.keys(saved)) {
      out[key] = mergeWithDefaults(defaults?.[key], saved[key]);
    }
    return out;
  }
  return saved;
}

/** "h1Line1" → "H1 Line 1", "ctaTitle" → "Cta Title" */
function labelize(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

/** Empty clone of an item so "Add" produces the right shape. */
function emptyClone(sample: any): any {
  if (typeof sample === 'string') return '';
  if (typeof sample === 'number') return 0;
  if (Array.isArray(sample)) return [];
  if (sample && typeof sample === 'object') {
    const out: any = {};
    for (const k of Object.keys(sample)) out[k] = emptyClone(sample[k]);
    return out;
  }
  return '';
}

function isLongText(key: string, value: string): boolean {
  return (
    value.length > 70 ||
    value.includes('\n') ||
    ['sub', 'desc', 'bio', 'quote', 'excerpt', 'greeting', 'tagline', 'description'].some(
      (k) => key.toLowerCase().includes(k),
    )
  );
}

/** Human title for an array item card. */
function itemTitle(item: any, index: number): string {
  if (typeof item === 'string') return item || `Item ${index + 1}`;
  const t = item?.name || item?.title || item?.role || item?.year || item?.n || item?.value;
  return typeof t === 'string' && t.length > 0 ? t : `Item ${index + 1}`;
}

// Friendly section names + display order. Unknown keys are appended automatically.
const SECTION_META: [string, string][] = [
  ['hero', 'Hero'],
  ['nav', 'Navigation'],
  ['services', 'Services & Pricing'],
  ['work', 'Portfolio / Work'],
  ['stats', 'Stats'],
  ['process', 'Process'],
  ['testimonials', 'Testimonials'],
  ['funnel', 'Project Funnel'],
  ['about', 'About'],
  ['blog', 'Blog / Writing'],
  ['contact', 'Contact'],
  ['footer', 'Footer'],
  ['whatsapp', 'WhatsApp Widget'],
  ['page', 'Page Labels'],
  ['portfolio', 'Portfolio Page'],
  ['notFound', '404 Page'],
];

// ─────────────────────────────────────────────────────────────
// Recursive field renderer
// ─────────────────────────────────────────────────────────────

function FieldEditor({
  value,
  path,
  fieldKey,
  onChange,
  depth = 0,
}: {
  value: any;
  path: Path;
  fieldKey: string;
  onChange: (path: Path, value: any) => void;
  depth?: number;
}) {
  // ── Strings ──
  if (typeof value === 'string') {
    if (isLongText(fieldKey, value)) {
      return (
        <div className="space-y-1.5">
          <Label className="text-[11px] text-neutral-400">{labelize(fieldKey)}</Label>
          <textarea
            value={value}
            onChange={(e) => onChange(path, e.target.value)}
            rows={Math.min(6, Math.max(2, Math.ceil(value.length / 60)))}
            className="flex w-full rounded-md border border-border bg-neutral-950/50 px-3 py-2 text-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand resize-y"
          />
        </div>
      );
    }
    return (
      <div className="space-y-1.5">
        <Label className="text-[11px] text-neutral-400">{labelize(fieldKey)}</Label>
        <Input
          value={value}
          onChange={(e) => onChange(path, e.target.value)}
          className="bg-neutral-950/50"
        />
      </div>
    );
  }

  // ── Numbers ──
  if (typeof value === 'number') {
    return (
      <div className="space-y-1.5">
        <Label className="text-[11px] text-neutral-400">{labelize(fieldKey)}</Label>
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(path, Number(e.target.value) || 0)}
          className="bg-neutral-950/50"
        />
      </div>
    );
  }

  // ── Booleans ──
  if (typeof value === 'boolean') {
    return (
      <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(path, e.target.checked)}
          className="accent-[var(--brand,#ff8c00)]"
        />
        {labelize(fieldKey)}
      </label>
    );
  }

  // ── Arrays ──
  if (Array.isArray(value)) {
    const isStringArray = value.every((v) => typeof v === 'string');
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] uppercase tracking-wider text-neutral-500">
            {labelize(fieldKey)}{' '}
            <span className="text-neutral-600">({value.length})</span>
          </Label>
          <button
            type="button"
            onClick={() =>
              onChange(path, [...value, value.length > 0 ? emptyClone(value[value.length - 1]) : ''])
            }
            className="flex items-center gap-1 text-[11px] text-brand hover:text-brand/80 transition-colors"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>

        {isStringArray ? (
          <div className="space-y-1.5">
            {value.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Input
                  value={item}
                  onChange={(e) => onChange([...path, i], e.target.value)}
                  className="bg-neutral-950/50 text-sm"
                />
                <button
                  type="button"
                  onClick={() => onChange(path, value.filter((_, j) => j !== i))}
                  className="p-1.5 text-neutral-600 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {value.map((item, i) => (
              <ArrayItemCard
                key={i}
                title={itemTitle(item, i)}
                onRemove={() => onChange(path, value.filter((_, j) => j !== i))}
              >
                <FieldEditor
                  value={item}
                  path={[...path, i]}
                  fieldKey={itemTitle(item, i)}
                  onChange={onChange}
                  depth={depth + 1}
                />
              </ArrayItemCard>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Objects ──
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    return (
      <div className={depth > 0 ? 'space-y-3' : 'space-y-4'}>
        {depth > 0 && depth < 2 && fieldKey && (
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 border-b border-border/40 pb-1">
            {labelize(fieldKey)}
          </p>
        )}
        {entries.map(([k, v]) => {
          // Nested plain objects get their own labelled group
          const isGroup = v && typeof v === 'object' && !Array.isArray(v);
          return (
            <div key={k} className={isGroup ? 'rounded-lg border border-border/40 bg-neutral-950/30 p-3' : ''}>
              <FieldEditor
                value={v}
                path={[...path, k]}
                fieldKey={k}
                onChange={onChange}
                depth={depth + 1}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}

/** Collapsible card for one item in an array of objects. */
function ArrayItemCard({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border/50 bg-neutral-950/40 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-left text-sm text-neutral-200 hover:text-white transition-colors flex-1 min-w-0"
        >
          <ChevronRight
            className={`h-3.5 w-3.5 text-neutral-500 transition-transform flex-shrink-0 ${open ? 'rotate-90' : ''}`}
          />
          <span className="truncate">{title}</span>
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-neutral-600 hover:text-red-400 transition-colors flex-shrink-0"
          title="Remove item"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {open && <div className="px-3 pb-3 pt-1 border-t border-border/40">{children}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function VisualBuilderPage() {
  const { data: session } = useSession();
  const { activeTenantId } = useUIStore();
  const [pageId, setPageId] = useState<string | null>(null);
  const pulseRef = useRef<any>(null);

  const { data: tenant } = useQuery({
    queryKey: ['tenant-details', session?.user?.tenantId],
    queryFn: async () => {
      if (!session?.accessToken || !session?.user?.tenantId) return null;
      const pulse = createPulseClient(session.accessToken);
      return pulse.getTenant(session.user.tenantId);
    },
    enabled: !!session?.accessToken && !!session?.user?.tenantId,
  });

  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openSection, setOpenSection] = useState<string>('hero');
  const [saveState, setSaveState] = useState<SaveState>('idle');

  // Initialize SDK and load the home page
  useEffect(() => {
    if (!session?.accessToken) return;

    setIsLoading(true);
    const pulse = createPulseClient(session.accessToken);
    pulseRef.current = pulse;

    const initPage = async () => {
      try {
        const pages = await pulse.getPages();
        let homePage = pages.find((p: any) => p.slug === 'home');

        if (!homePage) {
          homePage = await pulse.createPage({
            title: 'Portfolio Home',
            slug: 'home',
            content: defaultPortfolioContent,
            published: true,
          });
          setContent(defaultPortfolioContent);
        } else {
          // Merge saved content over defaults so newly added sections show up
          setContent(mergeWithDefaults(defaultPortfolioContent, homePage.content ?? {}));
        }
        setPageId(homePage.id);
      } catch (err) {
        console.error('Failed to init builder page', err);
        // A 401 here means the session is stale — createPulseClient's
        // onAuthError already triggers a re-login, so don't show a
        // misleading "backend down" toast on top of that redirect.
        const isAuthError =
          err instanceof Error && 'statusCode' in err && (err as { statusCode: number }).statusCode === 401;
        if (!isAuthError) {
          toast.error('Could not load page content', {
            description: err instanceof Error ? err.message : 'Is the Novus Pulse backend running on port 3000?',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    initPage();
  }, [session?.accessToken, activeTenantId]);

  // Debounced save of the full content object
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const pendingContentRef = useRef<any>(null);

  const persist = useCallback((newContent: any) => {
    pendingContentRef.current = newContent;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setSaveState('saving');
    
    debounceTimer.current = setTimeout(async () => {
      if (!pageId || !pulseRef.current) return;
      
      if (isSavingRef.current) {
        // Wait until the current request finishes before firing again
        persist(pendingContentRef.current);
        return;
      }

      isSavingRef.current = true;
      try {
        await pulseRef.current.updatePage(pageId, { content: pendingContentRef.current });
        setSaveState('saved');
      } catch (err: unknown) {
        console.error(err);
        setSaveState('error');
        toast.error('Failed to save changes');
      } finally {
        isSavingRef.current = false;
      }
    }, 750);
  }, [pageId]);

  const handleChange = useCallback(
    (path: Path, value: any) => {
      setContent((prev: any) => {
        const next = setAtPath(prev, path, value);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const resetSection = (key: string) => {
    const defaults = (defaultPortfolioContent as any)[key];
    if (defaults === undefined) return;
    handleChange([key], JSON.parse(JSON.stringify(defaults)));
    toast.success(`"${labelize(key)}" restored to defaults`);
  };

  if (isLoading || !content) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center text-neutral-400 gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading Visual Editor…
      </div>
    );
  }

  // Known sections first (in order), then anything else found in content
  const knownKeys = SECTION_META.map(([k]) => k);
  const sections: [string, string][] = [
    ...SECTION_META.filter(([k]) => content[k] !== undefined),
    ...Object.keys(content)
      .filter((k) => !knownKeys.includes(k))
      .map((k): [string, string] => [k, labelize(k)]),
  ];

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col lg:flex-row gap-0 overflow-hidden rounded-xl border border-border/50 shadow-2xl bg-neutral-950">
      {/* LEFT PANEL: All sections, fully editable */}
      <div className="w-full lg:w-[460px] flex-shrink-0 flex flex-col h-full overflow-y-auto border-r border-border/50 bg-neutral-900/50 relative custom-scrollbar">
        <div className="sticky top-0 z-10 bg-neutral-950/90 backdrop-blur-md border-b border-border/50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand" /> Visual Editor
              </h1>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Every section of your site — synced live.
              </p>
            </div>
            <SaveIndicator state={saveState} />
          </div>
        </div>

        <div className="p-4 space-y-2">
          {sections.map(([key, name]) => {
            const isOpen = openSection === key;
            return (
              <div
                key={key}
                className={`rounded-xl border transition-colors ${
                  isOpen ? 'border-brand/40 bg-neutral-900/80' : 'border-border/40 bg-neutral-900/30 hover:border-border'
                }`}
              >
                <div className="flex items-center justify-between pr-2">
                  <button
                    type="button"
                    onClick={() => setOpenSection(isOpen ? '' : key)}
                    className="flex items-center gap-2 flex-1 px-4 py-3 text-left"
                  >
                    <ChevronRight
                      className={`h-4 w-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-90 text-brand' : ''}`}
                    />
                    <span className={`text-sm font-medium ${isOpen ? 'text-white' : 'text-neutral-300'}`}>
                      {name}
                    </span>
                  </button>
                  {isOpen && (
                    <button
                      type="button"
                      onClick={() => resetSection(key)}
                      className="p-1.5 text-neutral-600 hover:text-neutral-300 transition-colors"
                      title="Restore this section to defaults"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-border/30">
                    <FieldEditor
                      value={content[key]}
                      path={[key]}
                      fieldKey=""
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL: Live preview */}
      <div className="flex-1 bg-black relative hidden lg:block">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 bg-neutral-900/80 backdrop-blur-md rounded-full border border-neutral-800 text-[10px] font-mono text-neutral-400 flex items-center gap-2 shadow-2xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          LIVE PORTFOLIO PREVIEW
        </div>

        <iframe
          src={tenant?.slug ? `http://localhost:21113?tenant=${tenant.slug}` : 'http://localhost:21113'}
          className="w-full h-full border-0"
          title="Portfolio Live Preview"
        />
      </div>
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (state === 'saved') {
    return (
      <span className="flex items-center gap-1.5 text-[11px] text-green-400">
        <CheckCircle2 className="h-3 w-3" /> Saved
      </span>
    );
  }
  if (state === 'error') {
    return (
      <span className="flex items-center gap-1.5 text-[11px] text-red-400">
        <AlertCircle className="h-3 w-3" /> Error
      </span>
    );
  }
  return null;
}
