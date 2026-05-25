import * as React from "react";
import { cn } from "@/lib/utils";

export interface MonoEyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {}

export const MonoEyebrow = React.forwardRef<HTMLSpanElement, MonoEyebrowProps>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn("ui-mono-eyebrow", className)} {...props} />
  ),
);
MonoEyebrow.displayName = "MonoEyebrow";
