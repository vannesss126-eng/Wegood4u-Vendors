import { format } from "date-fns";
import { User } from "lucide-react";

import type { Visit } from "@/types/domain";
import { cn } from "@/lib/utils";

type FeedListProps = {
  visits: Visit[];
  title?: string;
  subtitle?: string;
  className?: string;
};

const GENDER_LABEL: Record<Visit["gender"], string> = {
  female: "Female",
  male: "Male",
  other: "Other",
};

// Compact relative time for the visit feed. Matches mockup's "14:32 today" /
// "22:14 yesterday" style — keeps the actual clock time visible since it's
// more useful to a partner than "2 hours ago".
function formatVisitTime(isoString: string, nowIso = "2026-05-27T23:59:00+08:00"): string {
  const verified = new Date(isoString);
  const now = new Date(nowIso);
  const dayMs = 24 * 60 * 60 * 1000;
  const verifiedDay = new Date(verified.toISOString().slice(0, 10)).getTime();
  const todayDay = new Date(now.toISOString().slice(0, 10)).getTime();
  const diffDays = Math.round((todayDay - verifiedDay) / dayMs);
  const time = format(verified, "HH:mm");
  if (diffDays === 0) return `${time} today`;
  if (diffDays === 1) return `${time} yesterday`;
  return `${format(verified, "d MMM")} · ${time}`;
}

function formatAmount(value: number): string {
  return `RM ${value.toFixed(2)}`;
}

export function FeedList({
  visits,
  title = "Recent visits",
  subtitle = "Last 8 verified",
  className,
}: FeedListProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-5 pb-3.5 pt-[18px]">
        <div>
          <div className="text-sm font-bold text-foreground">{title}</div>
          <div className="mt-[3px] text-[11.5px] font-medium text-muted-foreground">
            {subtitle}
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">
          <span className="relative inline-flex h-[7px] w-[7px]">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-primary shadow-[0_0_8px_var(--primary-glow)]" />
          </span>
          Live
        </span>
      </div>

      <div className="max-h-[280px] flex-1 overflow-y-auto">
        {visits.map((visit) => (
          <div
            key={visit.id}
            className="flex items-center gap-3 border-b border-border px-5 py-3 transition-colors last:border-b-0 hover:bg-bg-soft"
          >
            <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-primary-tint text-primary-deep">
              <User className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-foreground">
                {GENDER_LABEL[visit.gender]} · {visit.age} · {visit.city}
              </div>
              <div className="mt-0.5 text-[10.5px] text-text-dim">
                {formatVisitTime(visit.verifiedAt)}
              </div>
            </div>
            <div className="text-[12.5px] font-bold tabular-nums text-foreground">
              {formatAmount(visit.totalAmount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
