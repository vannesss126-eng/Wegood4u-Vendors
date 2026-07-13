"use client";

import { useMemo, useState } from "react";
import { CheckSquare, DollarSign, Eye, FileText, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import type { BillingStatement } from "@/types/domain";
import { fetchStoreFavoriteCount } from "@/lib/supabase";
import { monthOptions } from "@/lib/mock";
import { usePartnerStore } from "@/lib/store-context";
import { useActiveStore } from "@/lib/active-store";

import {
  PageHeader,
  PeriodPicker,
} from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { FeedList } from "@/components/dashboard/feed-list";
import { VisitTrendChart } from "@/components/charts/visit-trend-chart";
import { DonutChart, type DonutSegment } from "@/components/charts/donut-chart";
import { VisitCalendar } from "@/components/charts/visit-calendar";

const RM = (n: number) => `RM ${n.toLocaleString("en-MY")}`;

function priorKey(monthKey: string): string | undefined {
  // Crude but enough for our locked range — string subtract one month.
  const [y, m] = monthKey.split("-").map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, "0")}`;
}

export default function DashboardHome() {
  const { dataset, today } = useActiveStore();

  // Last 3 months, newest first — tracks the real current month.
  const monthPickerOptions = useMemo(
    () => monthOptions(dataset.currentMonth, 3),
    [dataset.currentMonth]
  );
  // null = "follow the current month" until the user picks one explicitly.
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const effectiveMonth = selectedMonth ?? dataset.currentMonth;

  // Statements keyed by ISO YYYY-MM for the active store.
  const statementByMonth = useMemo(() => {
    const map: Record<string, BillingStatement> = {};
    for (const s of [dataset.currentStatement, ...dataset.billingHistory]) {
      map[s.id.replace("stmt-", "")] = s;
    }
    return map;
  }, [dataset]);

  const current = statementByMonth[effectiveMonth] ?? dataset.currentStatement;
  const prior = statementByMonth[priorKey(effectiveMonth) ?? ""];

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
    const avgPerVisit = current.verifiedVisits
      ? current.customerSpend / current.verifiedVisits
      : 0;
    const weeklyAvg = current.customerSpend / 4;
    return {
      visits: current.verifiedVisits,
      visitsDelta,
      customerSpend: current.customerSpend,
      spendDelta,
      amountOwed: current.amountOwed,
      avgPerVisit,
      weeklyAvg,
      isCurrent: effectiveMonth === dataset.currentMonth,
      priorMonthLabel: prior
        ? new Date(`${priorKey(effectiveMonth)}-01T00:00:00Z`).toLocaleString("en-US", {
            month: "long",
          })
        : null,
      priorAmountOwed: prior?.amountOwed ?? 0,
    };
  }, [current, prior, effectiveMonth, dataset.currentMonth]);

  const contentReach = dataset.kpis.contentReach;
  const selectedOption = monthPickerOptions.find((o) => o.value === effectiveMonth);

  // Favorites — the first real (non-mock) metric. Lifetime count, not month-scoped.
  const { storeId } = usePartnerStore();
  const favoritesQuery = useQuery({
    queryKey: ["store-favorite-count", storeId],
    queryFn: () => fetchStoreFavoriteCount(storeId!),
    enabled: !!storeId,
    staleTime: 60 * 1000,
  });
  // In mock auth mode there's no real store id — fall back to the active store's
  // mock count so the card matches the rest of the (still-mock) dashboard.
  const favoritesValue = !storeId
    ? dataset.kpis.favorites.toLocaleString("en-MY")
    : favoritesQuery.isLoading
      ? "…"
      : favoritesQuery.isError
        ? "—"
        : (favoritesQuery.data ?? 0).toLocaleString("en-MY");

  // Map loyalty tiers → DonutSegment[] for the customer-mix donut. Order matches
  // the mockup: Returning anchors the primary segment, New is the soft tint,
  // Loyal is the deep accent.
  const tierOrder: Record<string, number> = { returning: 0, new: 1, loyal: 2 };
  const tierColor: Record<string, string> = {
    returning: "var(--primary)",
    new: "var(--primary-soft)",
    loyal: "var(--primary-deep)",
  };
  const loyaltySegments: DonutSegment[] = [...dataset.demographicsLifetime.loyaltyTiers]
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
            value={effectiveMonth}
            options={monthPickerOptions}
            onChange={setSelectedMonth}
          />
        }
      />

      {/* 4 KPI cards */}
      <div className="mb-[22px] grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
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
                      Today{" "}
                      <b className="text-foreground">
                        {dataset.kpis.verifiedVisits.today}
                      </b>
                    </>
                  ),
                  right: (
                    <>
                      This week{" "}
                      <b className="text-foreground">
                        {dataset.kpis.verifiedVisits.thisWeek}
                      </b>
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

        <KpiCard
          label="Favorites"
          value={favoritesValue}
          icon={Heart}
          iconTone="highlight"
          foot={{ left: <>Members who saved your store</> }}
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
          <VisitTrendChart data={dataset.visitTrend} />
        </ChartCard>

        <FeedList
          visits={dataset.recentVisits}
          nowIso={`${today}T23:59:00+08:00`}
        />
      </div>

      {/* Demographics donut + 5-month visit calendar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard>
          <DonutChart
            segments={loyaltySegments}
            centerValue={dataset.demographicsLifetime.uniqueVisitors.toLocaleString("en-MY")}
            centerLabel="Total"
            size={140}
            legendHeader="Customer mix"
            insight={`Repeat-customer rate is healthy at ${100 - (dataset.demographicsLifetime.loyaltyTiers.find((t) => t.tier === "new")?.percent ?? 0)}%.`}
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
            endDate={today}
            enrolledFrom={dataset.store.enrolledAt}
            dailyCounts={dataset.calendarFull.dailyCounts}
            fillWidth
            peakDate={dataset.calendarFull.bestSingleDay.date}
            showFooter
          />
        </ChartCard>
      </div>
    </div>
  );
}
