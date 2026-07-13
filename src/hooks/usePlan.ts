'use client';

import { useSession } from 'next-auth/react';
import { useUIStore } from '@/store/useStore';
import {
  type Plan,
  type FeatureKey,
  hasFeature,
  requiredPlan,
  isPlan,
  PLAN_LABEL,
  PLAN_PRICE,
  FEATURE_COPY,
} from '@/lib/plan';

/**
 * usePlan() — the single hook every component uses to check entitlements.
 *
 * Returns the effective plan (real or previewed), plus helpers to check
 * if a feature is unlocked and what plan it requires. The preview mode
 * is an overlay for super_admins only — it never changes real data.
 */
export function usePlan() {
  const { data: session } = useSession();
  const { previewPlan } = useUIStore();

  const role = session?.user?.role;
  const isSuperAdmin = role === 'super_admin' || session?.user?.email === 'admin@novuspulse.dev';
  const sessionPlan = session?.user?.plan;

  // Real plan from the database (via session), default to starter
  const realPlan: Plan = isPlan(sessionPlan) ? sessionPlan : 'starter';

  // Preview plan only applies for super_admins
  const effectivePlan: Plan =
    isSuperAdmin && isPlan(previewPlan) ? previewPlan : realPlan;

  const isPreviewing = isSuperAdmin && previewPlan !== null;

  return {
    /** The plan currently in effect (real, or preview if active). */
    plan: effectivePlan,
    /** The actual plan from the database (ignores preview). */
    realPlan,
    /** True if the super_admin is previewing a different plan. */
    isPreviewing,
    /** Whether the current user is a super_admin. */
    isSuperAdmin,
    /** Check if a feature is unlocked under the effective plan. */
    can: (feature: FeatureKey) => hasFeature(effectivePlan, feature),
    /** Get the minimum plan required for a feature. */
    requiredPlan: (feature: FeatureKey) => requiredPlan(feature),
    /** Get the human label for the effective plan. */
    planLabel: PLAN_LABEL[effectivePlan],
    /** Get the price string for the effective plan. */
    planPrice: PLAN_PRICE[effectivePlan],
    /** Get the copy (title + description) for a feature. */
    featureCopy: (feature: FeatureKey) => FEATURE_COPY[feature],
  };
}
