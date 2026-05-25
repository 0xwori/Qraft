import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-20 w-full resize-y rounded-nav border border-ui-hairline bg-ui-canvas px-3 py-2 text-sm text-ui-ink placeholder:text-ui-mute outline-none transition focus:border-ui-link focus:ring-2 focus:ring-ui-link/20 disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
