import * as React from "react";
import { cn } from "@/lib/utils";
import { MeshGradient } from "./mesh-gradient";

export interface HeroBandProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  meshIntensity?: "soft" | "default" | "strong";
}

export const HeroBand = React.forwardRef<HTMLElement, HeroBandProps>(
  (
    { className, eyebrow, title, description, actions, meshIntensity = "default", ...props },
    ref,
  ) => (
    <section
      ref={ref}
      className={cn(
        "relative overflow-hidden bg-ui-canvas",
        "px-6 pt-16 pb-20 md:pt-24 md:pb-28",
        className,
      )}
      {...props}
    >
      <MeshGradient intensity={meshIntensity} />
      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-5 text-center">
        {eyebrow ? <div>{eyebrow}</div> : null}
        <h1 className="ui-display-xl text-ui-ink max-w-3xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-[18px] leading-7 text-ui-body">{description}</p>
        ) : null}
        {actions ? <div className="mt-2 flex flex-wrap items-center justify-center gap-3">{actions}</div> : null}
      </div>
    </section>
  ),
);
HeroBand.displayName = "HeroBand";
