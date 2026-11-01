import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

const TONE: Record<StatusTone, string> = {
  success: 'text-green-400 [--dot:var(--color-green-400)]',
  warning: 'text-amber-400 [--dot:var(--color-amber-400)]',
  danger: 'text-red-400 [--dot:var(--color-red-400)]',
  info: 'text-blue-400 [--dot:var(--color-blue-400)]',
  neutral: 'text-neutral-400 [--dot:var(--color-neutral-500)]',
  brand: 'text-brand-fg [--dot:var(--brand-fg)]',
};

/** Content/record states mapped onto semantic tones. */
export const STATUS_TONE: Record<string, StatusTone> = {
  published: 'success',
  active: 'success',
  confirmed: 'success',
  sent: 'success',
  completed: 'success',
  customer: 'success',
  draft: 'warning',
  pending: 'warning',
  scheduled: 'info',
  in_review: 'info',
  sending: 'info',
  prospect: 'info',
  lead: 'warning',
  archived: 'neutral',
  cancelled: 'neutral',
  churned: 'neutral',
  failed: 'danger',
  error: 'danger',
  no_show: 'danger',
};

/** Dot + label status — quieter than filled pills, still unambiguous. */
export function Status({ status, label, tone, className }: { status?: string; label?: React.ReactNode; tone?: StatusTone; className?: string }) {
  const t = tone ?? (status ? STATUS_TONE[status] : undefined) ?? 'neutral';
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium capitalize', TONE[t], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--dot)]" aria-hidden />
      {label ?? status?.replace(/_/g, ' ')}
    </span>
  );
}
