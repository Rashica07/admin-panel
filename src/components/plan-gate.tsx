'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePlan } from '@/hooks/usePlan';
import { type FeatureKey, PLAN_LABEL, PLAN_PRICE } from '@/lib/plan';
import { Lock, ArrowRight, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * PlanGate — route-level entitlement guard.
 *
 * If the tenant's plan (or previewed plan) includes the feature, children
 * render normally. If not, a polished paywall panel replaces the content
 * with the feature description, required plan, price, and a button to
 * Settings → Subscriptions. Locked features stay *visible* in the nav —
 * this component only gates the page body.
 *
 * Replaces the old DevGate, which just checked a localStorage toggle.
 */
export function PlanGate({
  feature,
  children,
}: {
  feature: FeatureKey;
  children: React.ReactNode;
}) {
  const { data: session, status, update } = useSession();
  const { can, requiredPlan, featureCopy, isPreviewing } = usePlan();

  const tenantStatus = session?.user?.status || 'active';

  // While waiting on payment or admin approval, there's no push channel
  // telling this tab the moment status changes (e.g. an admin approving
  // via the email link) — poll quietly so it clears on its own instead
  // of requiring a manual re-login.
  useEffect(() => {
    if (tenantStatus !== 'pending_payment' && tenantStatus !== 'pending_approval') return;
    const id = setInterval(() => update(), 20_000);
    return () => clearInterval(id);
  }, [tenantStatus, update]);

  if (status === 'loading') return null;

  // 1. Check if the tenant is blocked by the onboarding lifecycle
  if (tenantStatus === 'pending_payment') {
    return (
      <div className="flex h-[65vh] flex-col items-center justify-center text-center gap-5 max-w-md mx-auto">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 border border-brand">
          <Lock className="h-7 w-7 text-brand" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Payment Required</h1>
          <p className="text-sm text-neutral-400">Please complete your startup's payment to unlock the platform.</p>
        </div>
        <Button asChild className="gap-2 mt-2">
          <Link href="/dashboard/billing/mock-stripe">
            Go to Checkout <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  if (tenantStatus === 'pending_approval') {
    return (
      <div className="flex h-[65vh] flex-col items-center justify-center text-center gap-5 max-w-md mx-auto">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 border border-amber-500/50">
          <Eye className="h-7 w-7 text-amber-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Pending Admin Approval</h1>
          <p className="text-sm text-neutral-400">Your workspace is being reviewed. We will email you once it's active.</p>
        </div>
      </div>
    );
  }

  // 2. Otherwise, check feature gating based on plan
  if (can(feature)) {
    return <>{children}</>;
  }

  const required = requiredPlan(feature);
  const copy = featureCopy(feature);

  return (
    <div className="flex h-[65vh] flex-col items-center justify-center text-center gap-5 max-w-md mx-auto">
      {/* Lock icon with glow */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-brand/20 blur-xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 border border-border">
          <Lock className="h-7 w-7 text-brand" />
        </div>
      </div>

      {/* Feature title + description */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
        <p className="text-sm text-neutral-400 leading-relaxed">{copy.desc}</p>
      </div>

      {/* Plan badge */}
      <div className="flex items-center gap-2 rounded-full bg-brand/10 border border-brand/20 px-4 py-2">
        <span className="text-xs text-neutral-400">Included in</span>
        <span className="text-sm font-semibold text-brand">
          {PLAN_LABEL[required]}
        </span>
        <span className="text-xs text-neutral-500">
          {PLAN_PRICE[required]}
        </span>
      </div>

      <Button asChild className="gap-2 mt-2">
        <Link href="/dashboard/settings">
          View Plans <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>

      {/* Preview mode indicator */}
      {isPreviewing && (
        <div className="flex items-center gap-1.5 text-[10px] text-amber-400/80 uppercase tracking-wider mt-2">
          <Eye className="h-3 w-3" />
          Preview mode — your real plan unlocks this
        </div>
      )}
    </div>
  );
}
