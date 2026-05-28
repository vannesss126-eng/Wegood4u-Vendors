"use client";

import { useMemo, useState } from "react";
import { CheckSquare, DollarSign, Eye, FileText } from "lucide-react";

import {
  MOCK_BILLING_HISTORY,
  MOCK_CALENDAR,
  MOCK_CURRENT_STATEMENT,
  MOCK_DEMOGRAPHICS,
  MOCK_KPIS,
  MOCK_RECENT_VISITS,
} from "@/lib/mock";

import {
  PageHeader,
  PeriodPicker,
  type PeriodOption,
} from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { FeedList } from "@/components/dashboard/feed-list";
import { VisitTrendChart } from "@/components/charts/visit-trend-chart";
import { DonutChart, type DonutSegment } from "@/components/charts/donut-chart";
import { VisitCalendar } from "@/components/charts/visit-calendar";

const RM = (n: number) => `RM ${n.toLocaleString("en-MY")}`;

// 3-month picker — May (current), April, March. Older months are out of
// MVP scope per the spec ("up to 3 months back of history").
const MONTH_OPTIONS: PeriodOption[] = [
  { value: "2026-05", label: "May 2026" },
  { value: "2026-04", label: "April 2026" },
  { value: "2026-03", label: "March 2026" },
];

/** All settled statements keyed by ISO YYYY-MM. */
const STATEMENT_BY_MONTH: Record<string, typeof MOCK_CURRENT_STATEMENT> = {
  "2026-05": MOCK_CURRENT_STATEMENT,
  "2026-04": MOCK_BILLING_HISTORY.find((s) => s.id === "stmt-2026-04")!,
  "2026-03": MOCK_BILLING_HISTORY.find((s) => s.id === "stmt-2026-03")!,
  "2026-02": MOCK_BILLING_HISTORY.find((s) => s.id === "stmt-2026-02")!,
};

function priorKey(monthKey: string): string | undefined {
  // Crude but enough for our locked range — string subtract one month.
  const [y, m] = monthKey.split("-").map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, "0")}`;
}

export default function DashboardHome() {
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-05");

  const current = STATEMENT_BY_MONTH[selectedMonth] ?? MOCK_CURRENT_STATEMENT;
  const prior = STATEMENT_BY_MONTH[priorKey(selectedMonth) ?? ""];

  const view = useMemo(() => {
    const visitsDelta = prior
      ? Math.round(
          ((current.verifiedVisits - prior.verifiedVisits) /
            prior.verifiedVisits) *
            100
        )
      : null;
    const spendDelta = prior
      ? Math.round(
          ((current.customerSpend - prior.customerSpend) /
            prior.customerSpend) *
            100
        )
      : null;
    const avgPerVisit = current.customerSpend / current.verifiedVisits;
    const weeklyAvg = current.customerSpend / 4;
    return {
      visits: current.verifiedVisits,
      visitsDelta,
      customerSpend: current.customerSpend,
      spendDelta,
      amountOwed: current.amountOwed,
      avgPerVisit,
      weeklyAvg,
      isCurrent: selectedMonth === "2026-05",
      priorMonthLabel: prior
        ? new Date(`${priorKey(selectedMonth)}-01T00:00:00Z`).toLocaleString("en-US", {
            month: "long",
          })
        : null,
      priorAmountOwed: prior?.amountOwed ?? 0,
    };
  }, [current, prior, selectedMonth]);

  const contentReach = MOCK_KPIS.contentReach;
  const selectedOption = MONTH_OPTIONS.find((o) => o.value === selectedMonth);

  // Map loyalty tiers → DonutSegment[] for the customer-mix donut. Order matches
  // the mockup: Returning anchors the primary segment, New is the soft tint,
  // Loyal is the deep accent.
  const tierOrder: Record<string, number> = { returning: 0, new: 1, loyal: 2 };
  const tierColor: Record<string, string> = {
    returning: "var(--primary)",
    new: "var(--primary-soft)",
    loyal: "var(--primary-deep)",
  };
  const loyaltySegments: DonutSegment[] = [...MOCK_DEMOGRAPHICS.loyaltyTiers]
    .sort((a, b) => (tierOrder[a.tier] ?? 99) - (tierOrder[b.tier] ?? 99))
    .map((t) => ({
      key: t.tier,
      label: t.label,
      count: t.count,
      percent: t.percent,
      color: tierColor[t.tier] ?? "var(--primary)",
      swatchBorder: t.tier === "new" ? "1px solid #b8e0c0" : undefined,
    }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={
          view.isCurrent
            ? "Real-time analytics for your Wegood4u partnership"
            : `Historical snapshot · ${selectedOption?.label ?? selectedMonth}`
        }
        action={
          <PeriodPicker
            value={selectedMonth}
            options={MONTH_OPTIONS}
            onChange={setSelectedMonth}
          />
        }
      />

      {/* 4 KPI cards */}
      <div className="mb-[22px] grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          accent
          label="Verified visits"
          value={view.visits.toLocaleString("en-MY")}
          icon={CheckSquare}
          iconTone="primary"
          deltas={
            view.visitsDelta != null
              ? [
                  {
                    value: `${view.visitsDelta >= 0 ? "+" : ""}${view.visitsDelta}% M-o-M`,
                    direction: view.visitsDelta >= 0 ? "up" : "down",
                  },
                ]
              : undefined
          }
          foot={
            view.isCurrent
              ? {
                  left: (
                    <>
                      Today <b className="text-foreground">9</b>
                    </>
                  ),
                  right: (
                    <>
                      This week <b className="text-foreground">76</b>
                    </>
                  ),
                }
              : {
                  left: (
                    <span className="text-text-dim">
                      Settled · {selectedOption?.label}
                    </span>
                  ),
                }
          }
        />

        <KpiCard
          label="Customer spend"
          value={RM(view.customerSpend)}
          icon={DollarSign}
          iconTone="deep"
          deltas={
            view.spendDelta != null
              ? [
                  {
                    value: `${view.spendDelta >= 0 ? "+" : ""}${view.spendDelta}%`,
                    direction: view.spendDelta >= 0 ? "up" : "down",
                  },
                ]
              : undefined
          }
          meta={view.priorMonthLabel ? `vs ${view.priorMonthLabel}` : undefined}
          foot={{
            left: (
              <>
                Avg/visit{" "}
                <b className="text-foreground">RM {view.avgPerVisit.toFixed(2)}</b>
              </>
            ),
            right: (
              <>
                Wkly avg{" "}
                <b className="text-foreground">
                  RM {(view.weeklyAvg / 1000).toFixed(1)}k
                </b>
              </>
            ),
          }}
        />

        <KpiCard
          label="Amount owed"
          value={RM(view.amountOwed)}
          icon={FileText}
          iconTone="primary"
          meta={`${view.visits} visits × RM ${current.perVisitFee.toFixed(2)}`}
          foot={
            prior
              ? {
                  left: (
                    <>
                      {view.priorMonthLabel}{" "}
                      <b className="text-foreground">{RM(view.priorAmountOwed)}</b>
                    </>
                  ),
                  right: (
                    <>
                      Status{" "}
                      <b className="text-foreground">
                        {current.status === "paid" ? "Paid" : current.status === "draft" ? "Draft" : "Issued"}
                      </b>
                    </>
                  ),
                }
              : {
                  left: (
                    <span className="text-text-dim">
                      Status{" "}
                      <b className="text-foreground">
                        {current.status === "paid" ? "Paid" : current.status === "draft" ? "Draft" : "Issued"}
                      </b>
                    </span>
                  ),
                }
          }
        />

        <KpiCard
          label="Content reach"
          value={
            contentReach.status === "live" && contentReach.totalViews
              ? contentReach.totalViews.toLocaleString("en-MY")
              : "—"
          }
          icon={Eye}
          iconTone={contentReach.status === "live" ? "primary" : "muted"}
          comingSoon={contentReach.status === "coming-soon"}
          deltas={
            contentReach.status === "live"
              ? [{ value: "+23% M-o-M", direction: "up" }]
              : undefined
          }
          foot={
            contentReach.status === "live"
              ? {
                  left: <>YouTube + TikTok + Instagram</>,
                }
              : {
                  left: (
                    <span className="text-text-dim">
                      Awaiting IG &amp; TikTok approval
                    </span>
                  ),
                }
          }
        />
      </div>

      {/* Visit trend + recent visits */}
      <div className="mb-[22px] grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <ChartCard
          title="Visit trend"
          subtitle="Verified visits per month, last 6 months"
          right={
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-2 w-2 rounded-sm bg-primary" />
              Verified visits
            </span>
          }
        >
          <VisitTrendChart />
        </ChartCard>

        <FeedList visits={MOCK_RECENT_VISITS} />
      </div>

      {/* Demographics donut + 5-month visit calendar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard>
          <DonutChart
            segments={loyaltySegments}
            centerValue={MOCK_DEMOGRAPHICS.uniqueVisitors.toLocaleString("en-MY")}
            centerLabel="Total"
            size={140}
            legendHeader="Customer mix"
            insight={`Repeat-customer rate is healthy at ${100 - (MOCK_DEMOGRAPHICS.loyaltyTiers.find((t) => t.tier === "new")?.percent ?? 0)}%.`}
          />
        </ChartCard>

        <ChartCard
          title="Visit calendar"
          subtitle="Daily verified visits · last 5 months"
          right={
            <a
              href="/peak-hours"
              className="text-xs font-bold text-primary transition-opacity hover:opacity-80"
            >
              See full →
            </a>
          }
        >
          <VisitCalendar
            months={5}
            endDate="2026-05-27"
            enrolledFrom="2026-02-12"
            dailyCounts={MOCK_CALENDAR.dailyCounts}
            fillWidth
            peakDate={MOCK_CALENDAR.bestSingleDay.date}
            showFooter
          />
        </ChartCard>
      </div>
    </div>
  );
}
