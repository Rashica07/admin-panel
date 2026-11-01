'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { createPulseClient } from '@/lib/novus-pulse-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Globe, Paintbrush, Building2, ExternalLink, Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePlan } from '@/hooks/usePlan';
import { PLAN_LABEL } from '@/lib/plan';
import { useUIStore } from '@/store/useStore';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NEXT_PUBLIC_DEMO_MODE !== 'false' ? '/demo-site' : 'http://localhost:21113');
const NEW_INSTALL_WINDOW_MS = 24 * 60 * 60 * 1000;

interface TenantSite {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
  status?: string;
  paymentMethod?: string;
  siteUrl?: string | null;
  devUrl?: string | null;
}

function isRecentInstall(createdAt?: string): boolean {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < NEW_INSTALL_WINDOW_MS;
}

export default function TenantWebsitesPage() {
  const { data: session } = useSession();
  const { plan, can, requiredPlan, isSuperAdmin } = usePlan();
  const { setActiveTenant } = useUIStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [planSelection, setPlanSelection] = useState<'starter' | 'studio' | 'agency'>('starter');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTenantId, setTransferTenantId] = useState<string | null>(null);
  const [transferEmail, setTransferEmail] = useState('');

  const queryClient = useQueryClient();

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async (): Promise<TenantSite[]> => {
      const pulse = createPulseClient(session?.accessToken);
      if (isSuperAdmin) {
        // Super admin sees every tenant on the platform — including any
        // just auto-registered by `npx create-novus-pulse`.
        return pulse.getTenants();
      }
      // Tenant owners see their own workspace card
      return [
        {
          id: session?.user?.tenantId ?? 'own',
          name: session?.user?.name ? `${session.user.name}'s Workspace` : 'Your Workspace',
          slug: 'admin-workspace',
          status: 'active',
        },
      ];
    },
    enabled: !!session?.accessToken,
    // Poll for newly-registered installations — "the second it installs,
    // the dashboard shows it" without requiring a manual page refresh.
    refetchInterval: isSuperAdmin ? 15_000 : false,
  });

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;
    setIsSubmitting(true);
    try {
      const pulse = createPulseClient(session?.accessToken);
      await pulse.createTenant({ name, slug, plan: planSelection });
      toast.success('Website connected successfully!');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setIsModalOpen(false);
      setName('');
      setSlug('');
      setPlanSelection('starter');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to connect website');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferTenantId || !transferEmail) return;
    setIsSubmitting(true);
    try {
      const pulse = createPulseClient(session?.accessToken);
      await pulse.request('PUT', `/tenants/${transferTenantId}/transfer-ownership`, { email: transferEmail });
      toast.success('Ownership transferred successfully');
      setIsTransferModalOpen(false);
      setTransferEmail('');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to transfer ownership');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImpersonate = async (tenantId: string) => {
    try {
      const pulse = createPulseClient(session?.accessToken);
      const res = await pulse.request<{ accessToken: string }>('POST', `/tenants/${tenantId}/impersonate`, {});
      const cmsUrl = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3002';
      window.open(`${cmsUrl}/impersonate?token=${res.accessToken}`, '_blank');
    } catch (err: any) {
      toast.error('Failed to generate impersonation token');
    }
  };

  const handleApproveCash = async (tenantId: string) => {
    try {
      const pulse = createPulseClient(session?.accessToken);
      await pulse.request('POST', `/tenants/${tenantId}/approve-cash`, {});
      toast.success('Cash payment approved');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    } catch (err: any) {
      toast.error('Failed to approve payment');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[19px] font-semibold tracking-[-0.01em] flex items-center gap-2">
          <Building2 className="h-7 w-7 text-brand-fg" /> Tenant Websites
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Every website connected to this workspace — open it live or jump straight into editing.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl bg-neutral-900" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(tenants ?? []).map((t) => (
            <Card key={t.id} className="group hover:border-brand/40 transition-colors">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand-fg">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {isRecentInstall(t.createdAt) && (
                      <span className="flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-fg">
                        <Sparkles className="h-2.5 w-2.5" /> New
                      </span>
                    )}
                    {t.status === 'active' ? (
                      <span className="rounded-full bg-green-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-400">
                        Live
                      </span>
                    ) : (
                      <span className="rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-400">
                        {t.status === 'pending_payment' ? 'Pending Payment' : 'Pending Approval'}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg leading-tight">{t.name}</h3>
                  <p className="text-xs font-mono text-neutral-500 mt-1">/{t.slug}</p>
                </div>

                {isSuperAdmin && (t.status === 'pending_payment' || t.status === 'pending_approval') && (
                  <Button 
                    size="sm" 
                    className="w-full bg-green-600 text-white hover:bg-green-700"
                    onClick={() => handleApproveCash(t.id)}
                  >
                    Approve Cash Payment
                  </Button>
                )}

                <div className="flex gap-2 pt-1">
                  <a href={t.devUrl || t.siteUrl || `${SITE_URL}/public/${t.slug}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1.5 border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800">
                      <ExternalLink className="h-3.5 w-3.5" /> Site
                    </Button>
                  </a>
                  {isSuperAdmin ? (
                    <Button 
                      size="sm" 
                      className="flex-1 bg-brand text-brand-foreground hover:bg-brand/90 font-medium shadow-sm"
                      onClick={() => handleImpersonate(t.id)}
                    >
                      Open CMS
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      className="flex-1 bg-brand text-brand-foreground hover:bg-brand/90 font-medium shadow-sm"
                      onClick={() => {
                        setActiveTenant({ id: t.id, slug: t.slug, name: t.name });
                        toast.success(`Switched workspace context to ${t.name}`);
                      }}
                    >
                      Manage
                    </Button>
                  )}
                </div>
                {isSuperAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 border-dashed border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500"
                    onClick={() => {
                      setTransferTenantId(t.id);
                      setIsTransferModalOpen(true);
                    }}
                  >
                    Transfer Ownership
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Add site teaser */}
          {isSuperAdmin ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex h-full min-h-44 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-neutral-500 hover:border-brand/40 hover:text-brand-fg transition-colors"
            >
              <Globe className="h-6 w-6" />
              <span className="text-sm font-medium">Connect another website</span>
              <span className="text-[10px] text-brand-fg uppercase tracking-wider font-semibold">Admin Tool</span>
            </button>
          ) : (
            <button
              type="button"
              className="flex h-full min-h-44 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-neutral-500 hover:border-brand/40 hover:text-brand-fg transition-colors cursor-not-allowed"
              title={can('multisite') ? "Multi-site support is on the roadmap" : `Requires ${PLAN_LABEL[requiredPlan('multisite')]} plan`}
            >
              {can('multisite') ? (
                <>
                  <Globe className="h-6 w-6" />
                  <span className="text-sm font-medium">Connect another website</span>
                  <span className="text-[10px] uppercase tracking-wider">Coming soon</span>
                </>
              ) : (
                <>
                  <Lock className="h-6 w-6 text-neutral-600 mb-1" />
                  <span className="text-sm font-medium text-neutral-400">Connect another website</span>
                  <span className="rounded-full bg-neutral-800/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    {PLAN_LABEL[requiredPlan('multisite')]}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Connection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white">Connect a New Website</h3>
              <p className="text-sm text-neutral-400 mt-1">
                Register a new tenant website on this CMS network.
              </p>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenant-name" className="text-xs font-semibold text-neutral-300">
                  Website Name
                </Label>
                <Input
                  id="tenant-name"
                  type="text"
                  placeholder="e.g. Travel Me"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug || slug === e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }
                  }}
                  required
                  className="bg-neutral-950 border-neutral-800 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant-slug" className="text-xs font-semibold text-neutral-300">
                  Website URL Slug
                </Label>
                <Input
                  id="tenant-slug"
                  type="text"
                  placeholder="e.g. travel-me"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  title="Lowercase letters, numbers, and hyphens only (e.g., travel-me)"
                  className="bg-neutral-950 border-neutral-800 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-neutral-300">
                  Select Plan Tier
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['starter', 'studio', 'agency'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setPlanSelection(tier)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border capitalize transition-colors ${
                        planSelection === tier
                          ? 'bg-brand/20 border-brand text-brand-fg'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="bg-transparent border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand text-brand-foreground hover:bg-brand/90 font-semibold"
                >
                  {isSubmitting ? 'Creating...' : 'Connect Website'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Transfer Ownership Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <Card className="w-full max-w-md border-neutral-800 bg-neutral-900 shadow-2xl">
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold">Transfer Ownership</h2>
                <p className="text-sm text-neutral-400 mt-1">
                  Assign this tenant to a new owner email address.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>New Owner Email</Label>
                  <Input 
                    placeholder="client@example.com" 
                    value={transferEmail}
                    onChange={(e) => setTransferEmail(e.target.value)}
                    className="bg-neutral-950 border-neutral-800"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1 border-neutral-800 hover:bg-neutral-800"
                  onClick={() => setIsTransferModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-brand text-brand-foreground hover:bg-brand/90"
                  onClick={handleTransferOwnership}
                  disabled={!transferEmail || isSubmitting}
                >
                  {isSubmitting ? 'Transferring...' : 'Transfer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
