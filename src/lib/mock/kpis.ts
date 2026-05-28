// Dashboard Home KPI snapshot + 30-day visit trend.
// Numbers self-consistent: amountOwed = verifiedVisits × perVisitFee (RM 3.00).

import type { KpiSnapshot, VisitTrendPoint } from "@/types/domain";

export const MOCK_KPIS: KpiSnapshot = {
  verifiedVisits: {
    thisMonth: 287,
    lastMonth: 245,
    lifetime: 1108,
  },
  customerSpend: {
    thisMonth: 10906,
    lastMonth: 9338,
  },
  amountOwed: {
    thisMonth: 861,
    lastMonth: 735,
  },
  contentReach: {
    status: "live",
    totalViews: 118680,
  },
};

// Last 30 days of daily visit counts (Apr 28 → May 27, 2026).
// Fri/Sat heavier, evening-only restaurant. Peak May 22 (Fri) at 21.
export const MOCK_VISIT_TREND: VisitTrendPoint[] = [
  { date: "2026-04-28", count: 7 },
  { date: "2026-04-29", count: 8 },
  { date: "2026-04-30", count: 9 },
  { date: "2026-05-01", count: 13 },
  { date: "2026-05-02", count: 16 },
  { date: "2026-05-03", count: 9 },
  { date: "2026-05-04", count: 6 },
  { date: "2026-05-05", count: 7 },
  { date: "2026-05-06", count: 8 },
  { date: "2026-05-07", count: 11 },
  { date: "2026-05-08", count: 15 },
  { date: "2026-05-09", count: 17 },
  { date: "2026-05-10", count: 10 },
  { date: "2026-05-11", count: 7 },
  { date: "2026-05-12", count: 8 },
  { date: "2026-05-13", count: 10 },
  { date: "2026-05-14", count: 12 },
  { date: "2026-05-15", count: 19 },
  { date: "2026-05-16", count: 16 },
  { date: "2026-05-17", count: 19 },
  { date: "2026-05-18", count: 8 },
  { date: "2026-05-19", count: 9 },
  { date: "2026-05-20", count: 11 },
  { date: "2026-05-21", count: 13 },
  { date: "2026-05-22", count: 21 },
  { date: "2026-05-23", count: 18 },
  { date: "2026-05-24", count: 11 },
  { date: "2026-05-25", count: 8 },
  { date: "2026-05-26", count: 10 },
  { date: "2026-05-27", count: 9 },
];
