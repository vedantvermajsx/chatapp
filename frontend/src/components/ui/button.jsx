import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import Loader from '../common/Loader';

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[14px] font-semibold font-sans outline-none disabled:pointer-events-none disabled:opacity-50 aria-[busy=true]:disabled:opacity-100 transition-[transform,filter,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:duration-100 active:ease-[cubic-bezier(0.4,0,1,1)] active:scale-[0.96] focus-visible:ring-4 focus-visible:ring-primary/15",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:brightness-110 ',
        outline: 'border border-border bg-card text-foreground hover:bg-secondary ',
        ghost: 'text-foreground hover:bg-secondary',
        link: 'text-primary underline-offset-4 hover:underline',
        glass: 'glass-lite text-foreground hover:brightness-110',
        destructive: 'bg-destructive text-destructive-foreground hover:brightness-110 ',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 px-3.5 text-[13px]',
        lg: 'h-12 px-7 text-[15px]',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = forwardRef(({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
  if (asChild) {
    return <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>{children}</Slot>;
  }
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }), loading && 'cursor-progress')}
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {/* Label stays in layout (invisible) so the button never changes width */}
      <span className={cn('inline-flex items-center justify-center gap-2 transition-opacity duration-150', loading && 'opacity-0')}>
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader variant="dots" className="h-4 w-8" label="Please wait" />
        </span>
      )}
    </button>
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };
