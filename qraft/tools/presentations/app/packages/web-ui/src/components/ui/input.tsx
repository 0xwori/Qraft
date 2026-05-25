import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "w-full rounded-nav border border-ui-hairline bg-ui-canvas px-3 text-sm text-ui-ink placeholder:text-ui-mute outline-none transition focus:border-ui-link focus:ring-2 focus:ring-ui-link/20 disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-8 text-[13px]",
        md: "h-10 text-sm",
        lg: "h-12 text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(inputVariants({ size, className }))}
      {...props}
    />
  ),
);
Input.displayName = "Input";
