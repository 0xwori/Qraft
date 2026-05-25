import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tabsListVariants = cva("inline-flex items-center", {
  variants: {
    variant: {
      default:
        "h-9 rounded-md border border-ui-hairline bg-ui-canvas-soft p-0.5",
      ghost: "gap-2 bg-transparent",
    },
  },
  defaultVariants: { variant: "default" },
});

const tabsTriggerVariants = cva(
  "inline-flex items-center font-medium transition-colors outline-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "h-7 rounded px-3 text-[13px] text-ui-body data-[state=active]:bg-ui-canvas data-[state=active]:text-ui-ink data-[state=active]:shadow-card-1",
        ghost:
          "h-9 rounded-pill-sm px-4 text-sm text-ui-body border border-ui-hairline bg-ui-canvas hover:bg-ui-canvas-soft data-[state=active]:bg-ui-ink data-[state=active]:text-ui-on-primary data-[state=active]:border-ui-ink",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export const Tabs = TabsPrimitive.Root;

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

export const TabsList = ({ className, variant, ...props }: TabsListProps) => (
  <TabsPrimitive.List className={cn(tabsListVariants({ variant, className }))} {...props} />
);

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {}

export const TabsTrigger = ({ className, variant, ...props }: TabsTriggerProps) => (
  <TabsPrimitive.Trigger className={cn(tabsTriggerVariants({ variant, className }))} {...props} />
);

export const TabsContent = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content className={cn("mt-4 outline-none", className)} {...props} />
);
