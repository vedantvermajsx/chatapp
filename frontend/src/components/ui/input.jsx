import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Input = forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-xl border border-input bg-secondary/60 px-3.5 py-2.5 text-[14px] font-sans text-foreground placeholder:text-muted-foreground transition-all outline-none',
        'focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
