// Visit calendar / peak-hours data for Thai Geng Mookata.
// Covers Jun 2025 → May 2026 (12 months).
// Pre-enrollment days (before 2026-02-12) and future days (after 2026-05-27)
// are nulled — the calendar tile renders them as dashed empty cells.

import type { CalendarStats, DailyVisitCount } from "@/types/domain";

const ENROLLED_FROM = "2026-02-12";
const TODAY = "2026-05-27";

// Mon=0..Sun=6 weekday base (visits per day).
// Mookata is evening-only; Fri/Sat are the strongest nights.
const WEEKDAY_BASE = [7, 8, 8, 11, 17, 15, 10];

// Per-month scaling: ramp from enrollment upward.
const MONTH_SCALE: Record<number, number> = {
  1: 0.62,  // Feb (partial — enrolled Feb 12)
  2: 0.80,  // Mar
  3: 0.95,  // Apr
  4: 1.00,  // May (current)
};

// Special days carved out for narrative anchors in the dashboard copy.
const SPECIAL_COUNTS: Record<string, number> = {
  "2026-04-25": 23, // Apr 25 (Sat) — best single day
  "2026-05-22": 19, // May 22 (Fri) — peak May
  "2026-05-15": 17, // May 15 (Fri)
  "2026-05-23": 15, // May 23 (Sat)
  "2026-04-11": 16, // Apr 11 (Sat)
};

function dayOfWeekMondayFirst(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

function buildDailyCounts(): DailyVisitCount[] {
  const out: DailyVisitCount[] = [];
  const start = new Date("2025-06-01T00:00:00Z");
  const end = new Date("2026-05-31T00:00:00Z");
  const enrolled = new Date(`${ENROLLED_FROM}T00:00:00Z`);
  const today = new Date(`${TODAY}T00:00:00Z`);

  for (
    let d = new Date(start);
    d <= end;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const dateStr = d.toISOString().slice(0, 10);

    if (d < enrolled || d > today) {
      out.push({ date: dateStr, count: null });
      continue;
    }

    if (SPECIAL_COUNTS[dateStr] !== undefined) {
      out.push({ date: dateStr, count: SPECIAL_COUNTS[dateStr] });
      continue;
    }

    const dow = dayOfWeekMondayFirst(d);
    const month = d.getUTCMonth();
    const day = d.getUTCDate();
    const scale = MONTH_SCALE[month] ?? 1.0;
    const noise = (((day * 17 + month * 23) % 5) - 2);
    const count = Math.max(2, Math.round(WEEKDAY_BASE[dow] * scale + noise));

    out.push({ date: dateStr, count });
  }
  return out;
}

const DAILY_COUNTS = buildDailyCounts();

// Aggregate active days by weekday.
function buildWeekdayBreakdown() {
  const totals = [0, 0, 0, 0, 0, 0, 0];
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  for (const row of DAILY_COUNTS) {
    if (row.count == null) continue;
    const d = new Date(`${row.date}T00:00:00Z`);
    totals[dayOfWeekMondayFirst(d)] += row.count;
  }
  const sum = totals.reduce((a, b) => a + b, 0);
  return labels.map((weekday, i) => ({
    weekday,
    count: totals[i],
    percent: sum > 0 ? Math.round((totals[i] / sum) * 100) : 0,
  }));
}

// Top 5 busiest single days (across the active window).
function buildTopBusiestDays() {
  const active = DAILY_COUNTS.filter((d) => d.count != null) as { date: string; count: number }[];
  active.sort((a, b) => b.count - a.count);
  const weekdayName = (iso: string) => {
    const d = new Date(`${iso}T00:00:00Z`);
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  };
  const notes: Record<string, string> = {
    "2026-04-25": "Saturday · Mookata weekend rush",
  };
  return active.slice(0, 5).map((d) => ({
    date: d.date,
    weekday: weekdayName(d.date),
    count: d.count,
    note: notes[d.date],
  }));
}

const weekdayBreakdown = buildWeekdayBreakdown();
const lifetimeVisits = weekdayBreakdown.reduce((a, w) => a + w.count, 0);
const busiest = [...weekdayBreakdown].sort((a, b) => b.count - a.count)[0];
// Number of times each weekday has appeared in the active window.
const weeklyOccurrences = (() => {
  const count = [0, 0, 0, 0, 0, 0, 0];
  for (const row of DAILY_COUNTS) {
    if (row.count == null) continue;
    const d = new Date(`${row.date}T00:00:00Z`);
    count[dayOfWeekMondayFirst(d)]++;
  }
  return count;
})();
const busiestIndex = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(busiest.weekday);

export const MOCK_CALENDAR: CalendarStats = {
  bestSingleDay: { date: "2026-04-25", count: 23 },

  busiestWeekday: {
    weekday: busiest.weekday,
    avgPerWeek: Math.round(busiest.count / Math.max(1, weeklyOccurrences[busiestIndex])),
    percentOfTotal: busiest.percent,
  },

  topMonth: { label: "May 2026", count: 287 },

  lifetimeVisits,

  dailyCounts: DAILY_COUNTS,

  weekdayBreakdown,

  topBusiestDays: buildTopBusiestDays(),
};

/* ============================================================
   queryCalendarStats — slice the full window to last N months.
   Recomputes KPIs (best day, busiest weekday, top month, lifetime,
   weekday breakdown, top busiest days) over the sliced range.
   Mirrors what a future Postgres query would do:
     SELECT * FROM partner_daily_visit_counts WHERE day >= cutoff
   ============================================================ */

const MONTH_NAMES_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export type CalendarQuery = {
  /** Number of months to include, anchored to TODAY (default = full 12 months). */
  months?: number;
};

export function queryCalendarStats(query: CalendarQuery = {}): CalendarStats {
  const months = query.months ?? 12;
  // Always recompute — keeps results consistent across ranges and means the
  // static MOCK_CALENDAR.topMonth doesn't drift away from the actual data.
  const today = new Date(`${TODAY}T00:00:00Z`);
  const start = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (months - 1), 1)
  );

  // Slice the daily counts to the window. Pre-window dates drop out entirely.
  const dailyCounts = DAILY_COUNTS.filter(
    (d) => new Date(`${d.date}T00:00:00Z`) >= start
  );

  // Active days (real counts) for recomputation.
  const activeDays = dailyCounts
    .filter((d): d is { date: string; count: number } => d.count != null && d.count > 0);

  // Weekday breakdown
  const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
  const weekdayOccurrences = [0, 0, 0, 0, 0, 0, 0];
  for (const d of activeDays) {
    const date = new Date(`${d.date}T00:00:00Z`);
    const dow = dayOfWeekMondayFirst(date);
    weekdayTotals[dow] += d.count;
    weekdayOccurrences[dow]++;
  }
  const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekdaySum = weekdayTotals.reduce((a, b) => a + b, 0);
  const weekdayBreakdownSliced = weekdayLabels.map((weekday, i) => ({
    weekday,
    count: weekdayTotals[i],
    percent: weekdaySum > 0 ? Math.round((weekdayTotals[i] / weekdaySum) * 100) : 0,
  }));

  // Best single day
  const best = activeDays.reduce(
    (acc, d) => (d.count > acc.count ? d : acc),
    activeDays[0] ?? { date: "", count: 0 }
  );

  // Busiest weekday
  let busyIdx = 0;
  for (let i = 1; i < 7; i++) {
    if (weekdayTotals[i] > weekdayTotals[busyIdx]) busyIdx = i;
  }
  const busiestWeekdayLabel = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
  ][busyIdx];

  // Top month
  const monthTotals = new Map<string, number>();
  for (const d of activeDays) {
    const key = d.date.slice(0, 7);
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + d.count);
  }
  let topMonthKey = "";
  let topMonthCount = 0;
  for (const [key, count] of monthTotals) {
    if (count > topMonthCount) { topMonthKey = key; topMonthCount = count; }
  }
  const topMonthYear = Number(topMonthKey.slice(0, 4));
  const topMonthIdx = Number(topMonthKey.slice(5, 7)) - 1;
  const topMonthLabel = `${MONTH_NAMES_LONG[topMonthIdx]} ${topMonthYear}`;

  // Top busiest days (top 5)
  const sortedDays = [...activeDays].sort((a, b) => b.count - a.count).slice(0, 5);
  const weekdayName = (iso: string) =>
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
      new Date(`${iso}T00:00:00Z`).getUTCDay()
    ];
  const topBusiestDays = sortedDays.map((d) => ({
    date: d.date,
    weekday: weekdayName(d.date),
    count: d.count,
  }));

  const lifetimeVisitsSliced = weekdaySum;

  return {
    bestSingleDay: { date: best.date, count: best.count },
    busiestWeekday: {
      weekday: busiestWeekdayLabel,
      avgPerWeek: Math.round(weekdayTotals[busyIdx] / Math.max(1, weekdayOccurrences[busyIdx])),
      percentOfTotal: weekdayBreakdownSliced[busyIdx].percent,
    },
    topMonth: { label: topMonthLabel, count: topMonthCount },
    lifetimeVisits: lifetimeVisitsSliced,
    dailyCounts,
    weekdayBreakdown: weekdayBreakdownSliced,
    topBusiestDays,
  };
}
