"use client";

import { ChartCard } from "@/components/dashboard/chart-card";
import { cn } from "@/lib/utils";

type WeekdayRow = {
  weekday: string;
  count: number;
  percent: number;
};

type WeekdayBreakdownProps = {
  data: WeekdayRow[];
  /** Weekdays rendered with the deep-primary fill (Fri/Sat by default). */
  peakWeekdays?: string[];
  title?: string;
  subtitle?: string;
};

// Short labels (mockup uses "Monday" full names — keep full per design).
const WEEKDAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHORT_TO_LONG: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

function longWeekday(input: string): string {
  return SHORT_TO_LONG[input] ?? input;
}

export function WeekdayBreakdown({
  data,
  peakWeekdays = ["Friday", "Saturday"],
  title = "Day-of-week total",
  subtitle = "Visits per day across the last 4 months · Friday leads",
}: WeekdayBreakdownProps) {
  // Normalize labels (data may come in as "Mon" / "Monday") and re-sort Mon→Sun.
  const normalized = data.map((d) => ({ ...d, weekday: longWeekday(d.weekday) }));
  const ordered = WEEKDAY_ORDER.map((wd) =>
    normalized.find((d) => d.weekday === wd) ?? { weekday: wd, count: 0, percent: 0 }
  );

  const maxCount = Math.max(1, ...ordered.map((d) => d.count));
  const peakSet = new Set(peakWeekdays);

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div className="flex flex-col gap-2.5">
        {ordered.map((row) => {
          const isPeak = peakSet.has(row.weekday);
          const widthPct = (row.count / maxCount) * 100;
          return (
            <div key={row.weekday} className="relative">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-foreground">
                  {row.weekday}
                </span>
                <span className="flex items-baseline gap-2 tabular-nums">
                  <span className="text-[11.5px] font-medium text-text-dim">
                    {row.count.toLocaleString("en-MY")} visits
                  </span>
                  <span className="text-[13px] font-bold text-foreground">
                    {row.percent}%
                  </span>
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-bg-soft">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500 ease-out",
                    isPeak ? "bg-primary-deep" : "bg-primary"
                  )}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
