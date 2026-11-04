import { cn } from '@/lib/utils';

/**
 * Operational page header: compact title, optional muted qualifier and meta
 * tags on one line, actions on the right. Replaces the oversized hero headers.
 */
export function PageHeader({
  title,
  qualifier,
  description,
  meta,
  actions,
  className,
}: {
  title: React.ReactNode;
  qualifier?: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-3 pb-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h1 className="text-[19px] font-semibold leading-tight tracking-[-0.01em] text-foreground">
            {title}
            {qualifier && <span className="ml-1.5 font-normal text-neutral-500">{qualifier}</span>}
          </h1>
          {meta && <div className="flex items-center gap-1.5">{meta}</div>}
        </div>
        {description && <p className="mt-1 max-w-2xl text-[13px] text-neutral-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Small mono tag used next to titles (e.g. plan, version, count). */
export function MetaTag({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'brand' | 'gold' }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center rounded-sm px-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em]',
        tone === 'brand' && 'bg-brand/12 text-brand-fg',
        tone === 'gold' && 'bg-amber-400/12 text-amber-400',
        tone === 'neutral' && 'bg-surface-2 text-neutral-400',
      )}
    >
      {children}
    </span>
  );
}
