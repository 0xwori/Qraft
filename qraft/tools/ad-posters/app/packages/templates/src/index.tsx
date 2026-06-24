import * as React from "react";

export function TapwiseShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const classes = ["tw-ad-shell", className].filter(Boolean).join(" ");
  return <div className={classes}>{children}</div>;
}

export function TapwiseBadge({ children }: { children: React.ReactNode }) {
  return <div className="tw-ad-badge">{children}</div>;
}

export function TapwiseCta({ children }: { children: React.ReactNode }) {
  return <div className="tw-ad-cta">{children}</div>;
}
