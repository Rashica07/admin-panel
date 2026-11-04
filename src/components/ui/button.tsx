import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'link' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

/**
 * OMNI button. `default` is the crimson primary action — use one per view.
 * `outline`/`secondary` are the quiet charcoal buttons used for everything else.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, isLoading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    const base =
      'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[13px] font-medium transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0';

    const variants = {
      default: 'bg-brand text-brand-foreground hover:bg-brand-hover',
      destructive: 'bg-red-600 text-white hover:bg-red-500',
      outline: 'border border-border-strong bg-surface-2 text-foreground hover:bg-surface-3',
      secondary: 'border border-border-strong bg-surface-2 text-foreground hover:bg-surface-3',
      ghost: 'text-neutral-300 hover:bg-surface-2 hover:text-foreground',
      link: 'h-auto px-0 text-brand-fg underline-offset-4 hover:underline',
    }[variant];

    const sizes = {
      default: 'h-8 px-3',
      sm: 'h-7 px-2.5 text-xs',
      lg: 'h-9 px-4',
      icon: 'h-8 w-8',
    }[size];

    return (
      <Comp className={cn(base, variants, variant !== 'link' && sizes, className)} ref={ref} disabled={disabled || isLoading} {...props}>
        {asChild ? (
          children
        ) : (
          <>
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button };
