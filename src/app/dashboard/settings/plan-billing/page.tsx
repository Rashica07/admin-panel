'use client';

import { useSession } from 'next-auth/react';
import { Check, Minus } from 'lucide-react';
import { usePlan } from '@/hooks/usePlan';
import { FEATURE_COPY, FEATURE_PLAN, PLAN_LABEL, PLAN_PRICE, PLAN_ORDER, hasFeature, type FeatureKey, type Plan } from '@/lib/plan';
import { Panel } from '@/components/omni/panel';
import { Status } from '@/components/omni/status';
import { MetaTag } from '@/components/omni/page-header';

const PLANS: Plan[] = ['starter', 'studio', 'agency'];

/**
 * Plan & billing — reads the tenant's real plan from the session and the
 * entitlement map in lib/plan.ts. No invented invoices: billing history is
 * not exposed by the API, so it is not shown.
 */
export default function PlanBillingPage() {
  const { data: session } = useSession();
  const { plan, realPlan, isPreviewing } = usePlan();
  const status = session?.user?.status ?? 'active';
  const features = (Object.keys(FEATURE_PLAN) as FeatureKey[]).sort((a, b) => PLAN_ORDER[FEATURE_PLAN[a]] - PLAN_ORDER[FEATURE_PLAN[b]]);

  return (
    <div className="space-y-4">
      <Panel title="Current plan" description="Entitlements are enforced server-side for every request.">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-3 px-4 py-4">
          <div>
            <p className="omni-label">Plan</p>
            <p className="mt-1 flex items-center gap-2 text-[17px] font-semibold text-foreground">
              {PLAN_LABEL[realPlan]}
              {isPreviewing && <MetaTag tone="gold">previewing {PLAN_LABEL[plan]}</MetaTag>}
            </p>
          </div>
          <div>
            <p className="omni-label">Price</p>
            <p className="mt-1 font-mono text-[15px] text-neutral-200">{PLAN_PRICE[realPlan]}</p>
          </div>
          <div>
            <p className="omni-label">Status</p>
            <div className="mt-1.5">
              <Status status={status} tone={status === 'active' ? 'success' : 'warning'} />
            </div>
          </div>
        </div>
        <p className="border-t border-border px-4 py-2.5 text-xs text-neutral-500">
          Plan changes and invoices are handled by your OMNI administrator.
        </p>
      </Panel>

      <Panel title="What each plan includes">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-[13px]">
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="omni-label px-4 py-2 font-normal">Feature</th>
                {PLANS.map((p) => (
                  <th key={p} scope="col" className={`omni-label w-[110px] px-4 py-2 text-center font-normal ${p === realPlan ? 'text-brand-fg' : ''}`}>
                    {PLAN_LABEL[p]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {features.map((f) => (
                <tr key={f}>
                  <td className="px-4 py-2">
                    <p className="text-neutral-200">{FEATURE_COPY[f].title}</p>
                    <p className="text-xs text-neutral-500">{FEATURE_COPY[f].desc}</p>
                  </td>
                  {PLANS.map((p) => (
                    <td key={p} className={`px-4 py-2 text-center ${p === realPlan ? 'bg-surface-2/40' : ''}`}>
                      {hasFeature(p, f) ? (
                        <Check className="mx-auto h-3.5 w-3.5 text-green-400" aria-label="Included" />
                      ) : (
                        <Minus className="mx-auto h-3.5 w-3.5 text-neutral-700" aria-label="Not included" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
