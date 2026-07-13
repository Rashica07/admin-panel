/**
 * Plan entitlements — the single client-side map of which features each
 * billing plan unlocks. The plan itself comes from the tenant record in
 * the database (via login → session), NOT from anything the user can
 * toggle. Locked features stay visible with an upgrade path — that's the
 * conversion mechanic — they never silently disappear.
 */

export type Plan = 'starter' | 'studio' | 'agency';

export const PLAN_ORDER: Record<Plan, number> = {
  starter: 0,
  studio: 1,
  agency: 2,
};

export const PLAN_LABEL: Record<Plan, string> = {
  starter: 'Starter',
  studio: 'Studio',
  agency: 'Agency',
};

export const PLAN_PRICE: Record<Plan, string> = {
  starter: 'Free 3-month trial',
  studio: '€100/year',
  agency: '€230/month',
};

export type FeatureKey =
  | 'whatsapp'
  | 'calendar'
  | 'staff'
  | 'roles'
  | 'audit'
  | 'payments'
  | 'finances'
  | 'themes'
  | 'menus'
  | 'forms'
  | 'seo'
  | 'analytics'
  | 'multisite';

export const FEATURE_PLAN: Record<FeatureKey, Plan> = {
  whatsapp: 'studio',
  calendar: 'studio',
  staff: 'studio',
  roles: 'studio',
  audit: 'studio',
  themes: 'studio',
  menus: 'studio',
  forms: 'studio',
  seo: 'studio',
  payments: 'agency',
  finances: 'agency',
  analytics: 'agency',
  multisite: 'agency',
};

export const FEATURE_COPY: Record<FeatureKey, { title: string; desc: string }> = {
  whatsapp: { title: 'WhatsApp Widget', desc: 'Put a WhatsApp button on your site so customers can reach you in one tap.' },
  calendar: { title: 'Calendar & Bookings', desc: 'Let customers book appointments straight from your website.' },
  staff: { title: 'Staff Accounts', desc: 'Give your team their own logins with the right level of access.' },
  roles: { title: 'Roles & Rules', desc: 'Control exactly what each team member can see and change.' },
  audit: { title: 'Audit Logs', desc: 'A full trail of who changed what, and when.' },
  payments: { title: 'Payments', desc: 'Take card payments through your website with automatic invoicing.' },
  finances: { title: 'Finances', desc: 'Bookkeeping settings, VAT handling, and financial reports.' },
  themes: { title: 'Themes & Design', desc: 'Unlock premium templates and full visual customization of your site.' },
  menus: { title: 'Navigation Menus', desc: 'Build advanced drop-down menus and custom navigation structures.' },
  forms: { title: 'Forms & Submissions', desc: 'Create custom forms and collect lead data directly in your dashboard.' },
  seo: { title: 'Advanced SEO', desc: 'Control meta tags, sitemaps, and search engine optimization settings.' },
  analytics: { title: 'Analytics & Reports', desc: 'Detailed visitor insights and traffic reports for your website.' },
  multisite: { title: 'Multiple Websites', desc: 'Run more than one website from a single workspace.' },
};

export function hasFeature(plan: Plan, feature: FeatureKey): boolean {
  return PLAN_ORDER[plan] >= PLAN_ORDER[FEATURE_PLAN[feature]];
}

export function requiredPlan(feature: FeatureKey): Plan {
  return FEATURE_PLAN[feature];
}

export function isPlan(value: unknown): value is Plan {
  return value === 'starter' || value === 'studio' || value === 'agency';
}
