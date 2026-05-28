"use client";

import { differenceInCalendarDays, format, parseISO } from "date-fns";

import { ChartCard } from "@/components/dashboard/chart-card";
import { MOCK_TODAY } from "@/lib/mock/visits";
import { cn } from "@/lib/utils";

type TopDay = {
  date: string;       // ISO YYYY-MM-DD
  weekday: string;    // "Sat" or "Saturday"
  count: number;
  note?: string;
};

type TopBusiestDaysProps = {
  days: TopDay[];
  title?: string;
  subtitle?: string;
};

const TODAY = parseISO(`${MOCK_TODAY}T00:00:00+08:00`);

function rankClass(rank: number): string {
  if (rank === 1) return "bg-primary text-white";
  if (rank === 2) return "bg-primary-soft text-primary-deep";
  if (rank === 3) return "bg-primary-tint text-primary-deep";
  return "bg-bg-soft text-muted-foreground";
}

function relativeDayLabel(iso: string): string {
  const date = parseISO(`${iso}T00:00:00+08:00`);
  const diff = differenceInCalendarDays(TODAY, date);
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${diff} days ago`;
  return `${diff} days ago`;
}

function longWeekday(weekday: string, iso: string): string {
  // If the data already has full weekday names, keep them.
  if (weekday.length > 3) return weekday;
  // Otherwise derive from the date.
  return format(parseISO(`${iso}T00:00:00+08:00`), "EEEE");
}

export function TopBusiestDays({
  days,
  title = "Top busiest days",
  subtitle = "Single-day records since enrollment · 5 highest",
}: TopBusiestDaysProps) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div className="flex flex-col">
        {days.map((day, i) => {
          const rank = i + 1;
          const fullDate = format(
            parseISO(`${day.date}T00:00:00+08:00`),
            "EEE, MMM d, yyyy"
          );
          const wd = longWeekday(day.weekday, day.date);
          const meta = day.note
            ? `${wd} · ${day.note}`
            : `${wd} · ${relativeDayLabel(day.date)}`;
          return (
            <div
              key={day.date}
              className="flex items-center gap-3 border-b border-border py-[11px] last:border-b-0"
            >
              <div
                className={cn(
                  "grid h-6 w-6 flex-shrink-0 place-items-center rounded-md text-[11px] font-extrabold",
                  rankClass(rank)
                )}
              >
                {rank}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-foreground">
                  {fullDate}
                </div>
                <div className="mt-px text-[11px] font-medium text-text-dim">
                  {meta}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[14px] font-bold tabular-nums text-foreground">
                  {day.count.toLocaleString("en-MY")}
                </div>
                <div className="text-[10.5px] font-medium text-text-dim">
                  verified visits
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
