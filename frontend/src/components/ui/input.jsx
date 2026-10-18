import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Input = forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-xl border border-input bg-secondary/50 px-3.5 py-2.5 text-[14px] font-sans text-foreground placeholder:text-muted-foreground/70 transition-all duration-150 outline-none ring-0',
        'focus:bg-background focus:border-foreground/30 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.07)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
