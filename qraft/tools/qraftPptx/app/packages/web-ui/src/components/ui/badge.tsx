import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center font-medium rounded-pill",
  {
    variants: {
      variant: {
        default:
          "bg-ui-canvas-soft-2 text-ui-body border border-ui-hairline px-2 py-0.5 text-[11px]",
        mono:
          "bg-ui-canvas-soft-2 text-ui-body border border-ui-hairline px-2 py-0.5 text-[11px] font-mono uppercase tracking-wider",
        info:
          "bg-ui-link-bg-soft text-ui-link-deep border border-ui-link-bg-soft px-2 py-0.5 text-[11px]",
        outline:
          "bg-transparent text-ui-body border border-ui-hairline px-2 py-0.5 text-[11px]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
