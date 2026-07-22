import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
  cn(
    'mc-button inline-flex items-center justify-center whitespace-nowrap text-lg font-minecraft transition-colors',
    'border-2 border-black overflow-hidden cursor-pointer',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none'
  ),
  {
    variants: {
      variant: {
        default: 'bg-btn border-2 border-black',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-[30pt] w-[calc(30pt*10)] [&_.mc-button-title]:px-4',
        sm: 'h-[25pt] w-[calc(25pt*8)] [&_.mc-button-title]:px-4',
        lg: 'h-[35pt] w-[calc(35pt*12)] [&_.mc-button-title]:px-4',
        icon: 'h-[30px] w-[30px] text-sm',
        'icon-sm': 'h-[25px] w-[25px] text-sm',
        'icon-lg': 'h-[36px] w-[36px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        <span className="mc-button-title w-full h-full flex items-center justify-center">
          {props.children}
        </span>
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
