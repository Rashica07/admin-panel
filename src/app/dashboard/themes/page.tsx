'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { createPulseClient } from '@/lib/novus-pulse-client';
import { PlanGate } from '@/components/plan-gate';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Paintbrush, Check, RefreshCcw, MonitorPlay, Save, Palette, Eye, LayoutTemplate, MoreHorizontal, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Dialog from '@radix-ui/react-dialog';
import { usePlan } from '@/hooks/usePlan';

const DEFAULT_THEME = {
  colors: {
    primary: '#ff8c00',
    background: '#0a0a0a',
    surface: '#121212',
    accent: '#ff6b00',
  },
  fonts: {
    body: 'Inter',
    heading: 'Outfit',
  },
  borderRadius: '12px',
};

const THEME_LIBRARY = [
  {
    id: 'dawn',
    name: 'Dawn',
    author: 'OMNI',
    description: 'A chic and minimalist theme that lets product images take center stage.',
    gradient: 'from-orange-100 to-amber-50',
    colors: { primary: '#000000', background: '#ffffff', surface: '#f4f4f4', accent: '#ff8c00' },
  },
  {
    id: 'refresh',
    name: 'Refresh',
    author: 'OMNI',
    description: 'Bold theme that elevates product quality and brand storytelling.',
    gradient: 'from-blue-900 to-slate-900',
    colors: { primary: '#ffffff', background: '#0f172a', surface: '#1e293b', accent: '#3b82f6' },
  },
  {
    id: 'craft',
    name: 'Craft',
    author: 'OMNI',
    description: 'A refined theme that celebrates craftsmanship and elegant design.',
    gradient: 'from-stone-200 to-stone-100',
    colors: { primary: '#44403c', background: '#fafaf9', surface: '#f5f5f4', accent: '#78716c' },
  },
  {
    id: 'sense',
    name: 'Sense',
    author: 'OMNI',
    description: 'An energizing theme featuring extensive product detail layouts.',
    gradient: 'from-emerald-50 to-teal-100',
    colors: { primary: '#064e3b', background: '#ecfdf5', surface: '#d1fae5', accent: '#10b981' },
  },
  {
    id: 'ride',
    name: 'Ride',
    author: 'OMNI',
    description: 'A distinct, dynamic theme that champions sporting goods.',
    gradient: 'from-zinc-900 to-black',
    colors: { primary: '#ffffff', background: '#000000', surface: '#18181b', accent: '#eab308' },
  },
];

const FONT_OPTIONS = ['Inter', 'Outfit', 'Roboto', 'Playfair Display', 'Space Grotesk'];
const RADIUS_OPTIONS = ['0px', '4px', '8px', '12px', '24px', '9999px'];

export default function ThemesPage() {
  const { data: session } = useSession();
  const { realPlan } = usePlan();
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [saving, setSaving] = useState(false);
  const [activeThemeName, setActiveThemeName] = useState('OMNI Default');
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const pulse = createPulseClient(session.accessToken);
        const tenant = await pulse.getMyTenant();
        const saved = (tenant as { theme?: typeof DEFAULT_THEME }).theme;
        if (!cancelled && saved) {
          setTheme({
            colors: { ...DEFAULT_THEME.colors, ...(saved.colors ?? {}) },
            fonts: { ...DEFAULT_THEME.fonts, ...(saved.fonts ?? {}) },
            borderRadius: saved.borderRadius ?? DEFAULT_THEME.borderRadius,
          });
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [session?.accessToken]);

  const saveTheme = async (newTheme = theme, name = activeThemeName) => {
    setSaving(true);
    try {
      const pulse = createPulseClient(session?.accessToken);
      await pulse.updateMyTheme(newTheme);
      setTheme(newTheme);
      setActiveThemeName(name);
      toast.success(`Theme "${name}" published to live site`);
      setIsCustomizeOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  const updateColor = (key: keyof typeof theme.colors, value: string) => {
    setTheme(prev => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  };

  return (
    <PlanGate feature="themes">
      <div className="space-y-8 max-w-[1200px] mx-auto pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[19px] font-semibold tracking-[-0.01em] text-white">Themes</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Manage your store's design and layout.
            </p>
          </div>
          <Button variant="outline" className="border-border-strong text-brand-fg hover:bg-brand/10">
            Visit Theme Store
          </Button>
        </div>

        {/* Live Theme Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Live theme</h2>
          <Card className="bg-surface border-border-strong overflow-hidden flex flex-col md:flex-row shadow-lg">
            {/* Theme Preview Image/Gradient */}
            <div className="w-full md:w-[400px] h-[240px] md:h-auto bg-gradient-to-br from-neutral-800 to-black border-r border-border-strong relative flex items-center justify-center p-8">
               <div 
                 className="w-full h-full rounded-lg shadow-2xl border border-white/10 overflow-hidden flex flex-col transition-all duration-500"
                 style={{ backgroundColor: theme.colors.background, fontFamily: theme.fonts.body, borderRadius: theme.borderRadius }}
               >
                 {/* Mini Mockup */}
                 <div className="h-6 border-b border-black/10 flex items-center px-3 gap-2 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                    <div className="w-2 h-2 rounded-full bg-green-500/50" />
                 </div>
                 <div className="p-4 flex-1 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div className="h-4 w-16 rounded transition-colors duration-500" style={{ backgroundColor: theme.colors.primary }} />
                      <div className="flex gap-2">
                        <div className="h-2 w-8 rounded bg-black/10 dark:bg-white/10" />
                        <div className="h-2 w-8 rounded bg-black/10 dark:bg-white/10" />
                      </div>
                    </div>
                    <div className="h-16 w-3/4 rounded-md mt-4 transition-colors duration-500" style={{ backgroundColor: theme.colors.surface }} />
                    <div className="h-8 w-1/3 rounded-md mt-2 transition-colors duration-500" style={{ backgroundColor: theme.colors.accent }} />
                 </div>
               </div>
            </div>
            
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-center bg-surface">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-white">{activeThemeName}</h3>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">Active</span>
                  </div>
                  <p className="text-neutral-400 mt-2 max-w-md">
                    This is the theme currently visible to your customers. Customize it to match your brand.
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex gap-3 mt-8">
                <Dialog.Root open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
                  <Dialog.Trigger asChild>
                    <Button className="bg-brand hover:bg-brand/90 text-white font-medium px-8 shadow-lg">
                      Customize
                    </Button>
                  </Dialog.Trigger>
                  
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
                    <Dialog.Content className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface border-l border-border-strong z-50 p-6 shadow-2xl flex flex-col animate-in slide-in-from-right">
                      <div className="flex justify-between items-center mb-6 shrink-0">
                        <h2 className="text-xl font-bold text-white">Customize Theme</h2>
                        <Dialog.Close asChild>
                          <Button variant="ghost" size="icon">✕</Button>
                        </Dialog.Close>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto space-y-6 pr-2 -mr-2">
                         <div className="space-y-4">
                            <Label className="text-white font-semibold flex items-center gap-2"><Palette className="h-4 w-4"/> Brand Colors</Label>
                            <div className="grid grid-cols-2 gap-4">
                              {Object.entries(theme.colors).map(([key, value]) => (
                                <div key={key} className="space-y-1.5">
                                  <Label className="text-xs text-neutral-400 capitalize">{key}</Label>
                                  <div className="flex gap-2">
                                    <input type="color" value={value} onChange={e => updateColor(key as any, e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent" />
                                    <Input value={value} onChange={e => updateColor(key as any, e.target.value)} className="flex-1 h-8 font-mono text-xs bg-surface-2 border-border-strong text-white" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label className="text-white font-semibold">Typography</Label>
                            <div className="space-y-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs text-neutral-400">Headings Font</Label>
                                <select 
                                  value={theme.fonts.heading}
                                  onChange={e => setTheme(p => ({ ...p, fonts: { ...p.fonts, heading: e.target.value } }))}
                                  className="w-full h-9 rounded-md bg-surface-2 border-border-strong text-sm px-3 text-white focus:outline-none focus:ring-1 focus:ring-brand"
                                >
                                  {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs text-neutral-400">Body Font</Label>
                                <select 
                                  value={theme.fonts.body}
                                  onChange={e => setTheme(p => ({ ...p, fonts: { ...p.fonts, body: e.target.value } }))}
                                  className="w-full h-9 rounded-md bg-surface-2 border-border-strong text-sm px-3 text-white focus:outline-none focus:ring-1 focus:ring-brand"
                                >
                                  {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label className="text-white font-semibold">Shape</Label>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-neutral-400">Border Radius</Label>
                              <select 
                                value={theme.borderRadius}
                                onChange={e => setTheme(p => ({ ...p, borderRadius: e.target.value }))}
                                className="w-full h-9 rounded-md bg-surface-2 border-border-strong text-sm px-3 text-white focus:outline-none focus:ring-1 focus:ring-brand"
                              >
                                {RADIUS_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </div>
                          </div>
                      </div>

                      <div className="pt-6 mt-6 border-t border-border-strong shrink-0 flex gap-3">
                        <Button variant="outline" className="flex-1 border-border-strong text-white hover:bg-surface-2" onClick={() => setTheme(DEFAULT_THEME)}>Reset</Button>
                        <Button className="flex-1 bg-brand hover:bg-brand/90 text-white" onClick={() => saveTheme()} disabled={saving}>
                          {saving ? <RefreshCcw className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                          Save Theme
                        </Button>
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>

                <Button variant="outline" className="border-border-strong text-white hover:bg-surface-2 font-medium px-6">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Theme Library Grid */}
        <section className="space-y-4 mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Theme library</h2>
            <p className="text-sm text-neutral-400">Add a theme to experiment or change your store's look.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {THEME_LIBRARY.map((t) => (
              <Card key={t.id} className="bg-surface border-border-strong overflow-hidden group">
                <div className={cn("h-48 w-full bg-gradient-to-br transition-transform group-hover:scale-105 duration-500", t.gradient)}></div>
                <div className="p-5 relative bg-surface z-10">
                  <h3 className="font-bold text-white text-lg">{t.name}</h3>
                  <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider font-semibold">by {t.author}</p>
                  <p className="text-sm text-neutral-400 mt-3 line-clamp-2 min-h-[40px]">{t.description}</p>
                  
                  <div className="mt-5 flex gap-3">
                    <Button 
                      variant="outline" 
                      className="w-full border-border-strong text-white hover:bg-surface-2 disabled:opacity-50"
                      onClick={() => saveTheme({ ...DEFAULT_THEME, colors: { ...DEFAULT_THEME.colors, ...t.colors } }, t.name)}
                      disabled={saving || realPlan === 'starter'}
                    >
                      {realPlan === 'starter' ? <><Lock className="h-4 w-4 mr-2" /> Upgrade to Studio</> : 'Add'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </PlanGate>
  );
}
