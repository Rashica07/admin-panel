import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-8 w-full rounded-md border border-border-strong bg-input px-2.5 text-[13px] text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 hover:border-neutral-600 focus-visible:border-brand-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-red-500',
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
