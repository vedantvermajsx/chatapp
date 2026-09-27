import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  // Asymmetric timing: hover settles in ~200ms (ease-out), press feedback is
  // near-instant (~100ms). transform/opacity/filter only, so it's GPU-composited.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[14px] font-semibold font-sans outline-none disabled:pointer-events-none disabled:opacity-50 transition-[transform,filter,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:duration-100 active:ease-[cubic-bezier(0.4,0,1,1)] active:scale-[0.96] focus-visible:ring-4 focus-visible:ring-primary/15",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:brightness-110 hover:-translate-y-px active:translate-y-0',
        outline: 'border border-border bg-card text-foreground hover:bg-secondary hover:-translate-y-px active:translate-y-0',
        ghost: 'text-foreground hover:bg-secondary',
        link: 'text-primary underline-offset-4 hover:underline',
        destructive: 'bg-destructive text-destructive-foreground hover:brightness-110 hover:-translate-y-px active:translate-y-0',
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

const Button = forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };
