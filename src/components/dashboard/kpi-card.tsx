import type { ReactNode } from "react";
import { ChevronDown, ChevronUp, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Delta = {
  value: string;
  direction: "up" | "down";
};

type KpiCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  iconTone?: "primary" | "deep" | "muted";
  accent?: boolean;
  deltas?: Delta[];
  meta?: string;
  foot?: { left: ReactNode; right?: ReactNode };
  comingSoon?: boolean;
};

const ICON_TONE: Record<NonNullable<KpiCardProps["iconTone"]>, string> = {
  primary: "bg-primary-soft text-primary-deep",
  deep: "bg-primary-tint text-primary-deep",
  muted: "bg-bg-soft text-text-dim",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  iconTone = "primary",
  accent = false,
  deltas,
  meta,
  foot,
  comingSoon = false,
}: KpiCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-[22px] py-5 shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-border-hi hover:shadow-md">
      {accent ? (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary to-transparent" />
      ) : null}

      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "grid h-8 w-8 place-items-center rounded-[9px]",
            ICON_TONE[iconTone]
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <div
        className={cn(
          "text-[28px] font-bold leading-[1.1] tracking-tight",
          comingSoon ? "text-text-dim" : "text-foreground"
        )}
      >
        {value}
      </div>

      {(deltas?.length || meta || comingSoon) ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {comingSoon ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-highlight/20 bg-highlight-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-highlight">
              Coming soon
            </span>
          ) : null}
          {deltas?.map((d, i) => (
            <span
              key={i}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[11.5px] font-bold",
                d.direction === "up"
                  ? "bg-primary-tint text-primary-deep"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {d.direction === "up" ? (
                <ChevronUp className="h-2.5 w-2.5" strokeWidth={2.5} />
              ) : (
                <ChevronDown className="h-2.5 w-2.5" strokeWidth={2.5} />
              )}
              {d.value}
            </span>
          ))}
          {meta ? (
            <span className="text-[11.5px] font-medium text-text-dim">
              {meta}
            </span>
          ) : null}
        </div>
      ) : null}

      {foot ? (
        <div className="mt-[14px] flex items-center justify-between border-t border-dashed border-border pt-3 text-[11px] text-muted-foreground">
          <span>{foot.left}</span>
          {foot.right ? <span>{foot.right}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
