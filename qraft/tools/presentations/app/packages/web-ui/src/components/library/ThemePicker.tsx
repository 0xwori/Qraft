import type { ThemeDefinition } from "@micro-keynote/core";
import { Palette } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function ThemePicker({
  themes,
  themeId,
  onSetTheme,
  className,
  compact = false,
}: {
  themes: ThemeDefinition[];
  themeId?: string;
  onSetTheme: (themeId: string) => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {!compact && <Palette className="h-3.5 w-3.5 text-ui-mute" />}
      <Select value={themeId} onValueChange={onSetTheme}>
        <SelectTrigger className={cn(compact ? "h-8 w-40" : "h-9 w-48")}>
          <SelectValue placeholder="Choose theme" />
        </SelectTrigger>
        <SelectContent>
          {themes.map((theme) => (
            <SelectItem key={theme.id} value={theme.id}>
              {theme.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
