import { cn } from '@/lib/utils';

/**
 * Section panel with a header row (icon · title · one-line description · action),
 * the core layout unit of OMNI screens.
 */
export function Panel({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('rounded-lg border border-border bg-surface', className)}>
      {(title || action) && (
        <header className="flex items-center gap-3 border-b border-border px-4 py-2.5">
          {Icon && <Icon className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />}
          <div className="min-w-0 flex-1">
            {title && <h2 className="truncate text-[13px] font-semibold text-foreground">{title}</h2>}
            {description && <p className="truncate text-xs text-neutral-500">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={cn(bodyClassName)}>{children}</div>
    </section>
  );
}
