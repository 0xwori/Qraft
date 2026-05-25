import * as React from "react";
import { cn } from "@/lib/utils";

export interface MeshGradientProps extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: "soft" | "default" | "strong";
}

export const MeshGradient = React.forwardRef<HTMLDivElement, MeshGradientProps>(
  ({ className, intensity = "default", style, ...props }, ref) => {
    const opacity = intensity === "soft" ? 0.55 : intensity === "strong" ? 1 : 0.85;
    return (
      <div
        ref={ref}
        aria-hidden
        className={cn("ui-mesh-gradient pointer-events-none absolute inset-0", className)}
        style={{ opacity, ...style }}
        {...props}
      />
    );
  },
);
MeshGradient.displayName = "MeshGradient";
