import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 gap-2",
  {
    variants: {
      variant: {
        default: "bg-white text-[#0a0a0a] shadow-sm shadow-black/5 hover:bg-white/92",
        glass:
          "bg-white/10 text-white border border-white/20 backdrop-blur-md hover:bg-white/15",
        ghost:
          "bg-transparent text-white border border-transparent hover:bg-white/10",
        destructive:
          "bg-[#e25555] text-white hover:bg-[#e25555]/90",
        outline:
          "border border-white/20 bg-transparent text-white hover:bg-white/10",
        link: "text-white underline-offset-4 hover:underline",
        demo: "bg-[#fef08a]/95 text-[#713f12] border border-[#fef08a]/60 hover:bg-[#fef08a]",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm rounded-xl",
        sm: "h-8 px-3 py-1.5 text-xs rounded-lg",
        lg: "h-12 px-5 py-3 text-base rounded-xl",
        icon: "h-9 w-9 rounded-lg flex items-center justify-center p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
