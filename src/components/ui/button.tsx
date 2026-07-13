import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      asChild = false,
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    
    // Base classes
    const baseClasses =
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';

    // Variant classes
    const variantClasses = {
      default:
        'bg-brand text-black font-semibold hover:bg-brand-hover shadow-[0_1px_2px_rgba(0,0,0,.4),inset_0_1px_0_rgba(255,255,255,.2)]',
      destructive:
        'bg-red-600 text-white hover:bg-red-500 shadow-[0_1px_2px_rgba(0,0,0,.4),inset_0_1px_0_rgba(255,255,255,.1)]',
      outline:
        'border border-border bg-surface hover:bg-surface-2 hover:border-border-strong text-foreground',
      ghost: 'hover:bg-surface-2 text-foreground',
      link: 'text-brand underline-offset-4 hover:underline active:scale-100',
    }[variant];
    
    // Size classes
    const sizeClasses = {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-10 rounded-md px-8',
      icon: 'h-9 w-9',
    }[size];

    return (
      <Comp
        className={cn(baseClasses, variantClasses, sizeClasses, className)}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button };
