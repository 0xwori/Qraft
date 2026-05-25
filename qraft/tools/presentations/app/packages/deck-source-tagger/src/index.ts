/**
 * Helper component that wraps an editable text slot with a
 * data-attribute the UI editor can detect when the user clicks
 * inside the iframe. Optional — templates can use it to enable
 * click-to-edit in the iframe, but the primary edit path is the
 * inspector-driven prop editor served by the server's source AST.
 */
import * as React from "react";

export interface MkSlotProps {
  /** Slot path relative to the slide instance, e.g. "headline" or "items[0].label". */
  path: string;
  children?: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function MkSlot({ path, children, className, as = "span" }: MkSlotProps) {
  const Tag = as as keyof JSX.IntrinsicElements;
  return React.createElement(
    Tag,
    { className, "data-mk-slot": path },
    children,
  );
}

export type SourceRef = {
  file: string;
  slideIndex: number;
  propName: string;
};
