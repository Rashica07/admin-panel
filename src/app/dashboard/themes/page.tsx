'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { createPulseClient } from '@/lib/novus-pulse-client';
import { PlanGate } from '@/components/plan-gate';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Paintbrush, Check, RefreshCcw, MonitorPlay, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const FONT_OPTIONS = ['Inter', 'Outfit', 'Roboto', 'Playfair Display', 'Space Grotesk'];
const RADIUS_OPTIONS = ['0px', '4px', '8px', '12px', '24px', '9999px'];

export default function ThemesPage() {
  const { data: session } = useSession();
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [saving, setSaving] = useState(false);

  // Load the tenant's actually-saved theme so edits start from the real
  // current state, not the defaults (merge so any missing keys fall back).
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
      } catch {
        // Keep defaults if the tenant theme can't be loaded.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.accessToken]);

  const saveTheme = async () => {
    setSaving(true);
    try {
      const pulse = createPulseClient(session?.accessToken);
      // Self-scoped route — works for tenant owners, not just super_admin.
      // (The old updateTenantTheme hit a super_admin-only endpoint, so a
      // normal tenant got a 403 and the save silently failed.)
      await pulse.updateMyTheme(theme);
      toast.success('Theme published to live site');
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Paintbrush className="h-7 w-7 text-brand" /> Visual Theme
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Customize colors, typography, and styling for your storefront.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setTheme(DEFAULT_THEME)} className="border-border-strong text-neutral-300 hover:text-white">
              Reset to Default
            </Button>
            <Button onClick={saveTheme} disabled={saving} className="gap-2">
              {saving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Publish Theme
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Editor Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Colors</CardTitle>
                <CardDescription>Brand and interface colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(theme.colors).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <Label className="capitalize text-sm text-neutral-300">{key}</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-neutral-500 uppercase">{val}</span>
                      <div className="relative h-8 w-14 rounded-md border border-neutral-700 overflow-hidden shrink-0">
                        <input
                          type="color"
                          value={val}
                          onChange={(e) => updateColor(key as any, e.target.value)}
                          className="absolute -top-2 -left-2 h-12 w-20 cursor-pointer border-0 p-0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Typography & Style</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs text-neutral-400 uppercase tracking-wider">Heading Font</Label>
                  <select 
                    className="w-full h-10 rounded-md border border-neutral-800 bg-neutral-900 px-3 text-sm focus:ring-1 focus:ring-brand"
                    value={theme.fonts.heading}
                    onChange={e => setTheme({ ...theme, fonts: { ...theme.fonts, heading: e.target.value } })}
                  >
                    {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-neutral-400 uppercase tracking-wider">Body Font</Label>
                  <select 
                    className="w-full h-10 rounded-md border border-neutral-800 bg-neutral-900 px-3 text-sm focus:ring-1 focus:ring-brand"
                    value={theme.fonts.body}
                    onChange={e => setTheme({ ...theme, fonts: { ...theme.fonts, body: e.target.value } })}
                  >
                    {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div className="space-y-2 pt-2">
                  <Label className="text-xs text-neutral-400 uppercase tracking-wider">Border Radius</Label>
                  <div className="flex flex-wrap gap-2">
                    {RADIUS_OPTIONS.map(r => (
                      <button
                        key={r}
                        onClick={() => setTheme({ ...theme, borderRadius: r })}
                        className={cn(
                          "px-3 py-1.5 text-xs rounded-md border transition-colors",
                          theme.borderRadius === r 
                            ? "bg-brand/10 border-brand text-brand" 
                            : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                        )}
                      >
                        {r === '9999px' ? 'Full' : r}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Live Preview Window */}
          <div className="lg:col-span-8">
            <Card className="h-full bg-neutral-900 border-neutral-800 overflow-hidden flex flex-col">
              <div className="h-12 border-b border-neutral-800 bg-neutral-950/50 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="mx-auto flex items-center gap-2 text-xs text-neutral-500 font-mono bg-neutral-900 px-3 py-1 rounded-md border border-neutral-800">
                  <MonitorPlay className="h-3 w-3" /> Live Preview
                </div>
              </div>
              
              <div 
                className="flex-1 p-8 overflow-y-auto"
                style={{ 
                  backgroundColor: theme.colors.background,
                  fontFamily: theme.fonts.body,
                }}
              >
                <div 
                  className="max-w-2xl mx-auto p-8 shadow-2xl border"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: 'rgba(255,255,255,0.05)',
                    borderRadius: theme.borderRadius,
                  }}
                >
                  <h2 
                    className="text-4xl font-bold mb-4"
                    style={{ color: '#ffffff', fontFamily: theme.fonts.heading }}
                  >
                    Hero Headline
                  </h2>
                  <p className="text-lg mb-8 opacity-80" style={{ color: '#ffffff' }}>
                    This is how your typography and colors will look on the live site. 
                    Adjust the settings on the left to see changes instantly.
                  </p>
                  
                  <div className="flex gap-4">
                    <button 
                      className="px-6 py-3 font-semibold transition-opacity hover:opacity-90"
                      style={{ 
                        backgroundColor: theme.colors.primary, 
                        color: '#fff',
                        borderRadius: theme.borderRadius === '9999px' ? '9999px' : `calc(${theme.borderRadius} - 2px)`
                      }}
                    >
                      Primary Action
                    </button>
                    <button 
                      className="px-6 py-3 font-semibold border transition-colors hover:bg-white/5"
                      style={{ 
                        borderColor: theme.colors.primary,
                        color: theme.colors.primary,
                        borderRadius: theme.borderRadius === '9999px' ? '9999px' : `calc(${theme.borderRadius} - 2px)`
                      }}
                    >
                      Secondary Action
                    </button>
                  </div>

                  <div className="mt-12 grid grid-cols-2 gap-4">
                    {[1, 2].map(i => (
                      <div 
                        key={i}
                        className="p-5 border"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.02)',
                          borderColor: 'rgba(255,255,255,0.05)',
                          borderRadius: theme.borderRadius === '9999px' ? '16px' : `calc(${theme.borderRadius} - 4px)`
                        }}
                      >
                        <div 
                          className="w-10 h-10 mb-4 flex items-center justify-center"
                          style={{ 
                            backgroundColor: `${theme.colors.accent}20`,
                            color: theme.colors.accent,
                            borderRadius: theme.borderRadius === '9999px' ? '9999px' : '8px'
                          }}
                        >
                          <Check className="h-5 w-5" />
                        </div>
                        <h4 className="font-semibold mb-2" style={{ color: '#fff', fontFamily: theme.fonts.heading }}>Feature Card</h4>
                        <p className="text-sm opacity-60" style={{ color: '#fff' }}>Small descriptive text using the body font configuration.</p>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </PlanGate>
  );
}
