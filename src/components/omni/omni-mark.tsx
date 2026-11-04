import { cn } from '@/lib/utils';

/** OMNI mark: an ivory ring on crimson, with a gold point — the "O" of OMNI. */
export function OmniMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn('h-5 w-5 shrink-0', className)}>
      <rect width="24" height="24" rx="5" fill="#C83246" />
      <circle cx="12" cy="12" r="5.6" fill="none" stroke="#E8DCC8" strokeWidth="2.4" />
      <circle cx="16.4" cy="7.6" r="1.7" fill="#E8B44F" />
    </svg>
  );
}

/** Wordmark + product name, e.g. OMNI · CMS. */
export function OmniWordmark({ product, className }: { product: string; className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <OmniMark />
      <span className="text-[14px] font-semibold tracking-[0.04em] text-foreground">OMNI</span>
      <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-neutral-500">{product}</span>
    </span>
  );
}
