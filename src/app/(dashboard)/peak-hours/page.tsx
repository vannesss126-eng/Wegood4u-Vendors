"use client";

import { Award, CalendarDays, Clock, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";

import { queryCalendarStats } from "@/lib/mock/calendar";

import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { VisitCalendar } from "@/components/charts/visit-calendar";
import { WeekdayBreakdown } from "@/components/charts/weekday-breakdown";
import { TopBusiestDays } from "@/components/charts/top-busiest-days";

// Page is always last 12 months — no range switcher. The full window IS the
// meaningful view here (shows seasonality + post-enrollment ramp in one frame).
// queryCalendarStats stays in lib/mock/calendar.ts for Pass 2 / future ranges.
export default function PeakHoursPage() {
  const c = queryCalendarStats({ months: 12 });
  const bestDayDate = parseISO(`${c.bestSingleDay.date}T00:00:00+08:00`);
  const bestDayLabel = format(bestDayDate, "MMM d");
  const bestDayWeekday = format(bestDayDate, "EEEE");

  return (
    <div>
      <PageHeader
        title="Visit calendar"
        subtitle="Daily verified visits over the last 12 months — brighter cells = busier days."
      />

      {/* 4 KPIs */}
      <div className="mb-[18px] grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Best single day"
          value={bestDayLabel}
          icon={Award}
          iconTone="primary"
          deltas={[
            {
              value: `${c.bestSingleDay.count} visits · ${bestDayWeekday}`,
              direction: "up",
            },
          ]}
        />
        <KpiCard
          label="Busiest day-of-week"
          value={c.busiestWeekday.weekday}
          icon={CalendarDays}
          iconTone="primary"
          meta={`Avg ${c.busiestWeekday.avgPerWeek} visits/wk · ${c.busiestWeekday.percentOfTotal}% of total`}
        />
        <KpiCard
          label="Top month"
          value={c.topMonth.label}
          icon={TrendingUp}
          iconTone="primary"
          deltas={[
            { value: `${c.topMonth.count} visits`, direction: "up" },
          ]}
        />
        <KpiCard
          label="Lifetime visits"
          value={c.lifetimeVisits.toLocaleString("en-MY")}
          icon={Clock}
          iconTone="primary"
          meta="Since partnership"
        />
      </div>

      {/* 12-month calendar */}
      <ChartCard
        title="Daily visit calendar"
        subtitle="Jun 2025 → May 2026 · each cell is one real day · darker = more verified visits · Mon-first weeks"
        className="mb-[18px]"
      >
        <VisitCalendar
          months={12}
          endDate="2026-05-27"
          enrolledFrom="2026-02-12"
          dailyCounts={c.dailyCounts}
          cellSize={16}
          cellGap={3}
          peakDate={c.bestSingleDay.date}
          showDowLabels
          showFooter
        />
      </ChartCard>

      {/* Bottom 2-col grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WeekdayBreakdown
          data={c.weekdayBreakdown}
          peakWeekdays={[c.busiestWeekday.weekday]}
          subtitle={`Visits per day across the last 12 months · ${c.busiestWeekday.weekday} leads`}
        />
        <TopBusiestDays
          days={c.topBusiestDays}
          subtitle="Single-day records since enrollment · 5 highest"
        />
      </div>
    </div>
  );
}
