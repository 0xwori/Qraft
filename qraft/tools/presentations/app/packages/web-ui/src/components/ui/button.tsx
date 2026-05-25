import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ui-link focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-ui-ink text-ui-on-primary border border-ui-ink hover:bg-ui-ink/90",
        secondary:
          "bg-ui-canvas text-ui-ink border border-ui-hairline hover:bg-ui-canvas-soft",
        ghost:
          "bg-transparent text-ui-ink border border-transparent hover:bg-ui-canvas-soft-2",
        "nav-primary":
          "bg-ui-ink text-ui-on-primary border border-ui-ink hover:bg-ui-ink/90",
        "nav-secondary":
          "bg-ui-canvas text-ui-ink border border-ui-hairline hover:bg-ui-canvas-soft",
        link:
          "bg-transparent text-ui-link border-none px-0 hover:underline underline-offset-4",
        destructive:
          "bg-ui-error text-white border border-ui-error hover:bg-ui-error-deep",
      },
      size: {
        nav: "h-7 px-3 text-[13px] rounded-nav",
        sm: "h-8 px-3.5 text-sm rounded-pill",
        md: "h-9 px-4 text-sm rounded-pill",
        lg: "h-11 px-5 text-[15px] rounded-pill",
        icon: "h-8 w-8 rounded-nav",
        "icon-sm": "h-7 w-7 rounded-nav",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
