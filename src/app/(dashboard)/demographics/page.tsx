"use client";

import { useMemo, useState } from "react";
import { CircleDot, RotateCcw, Target, Users } from "lucide-react";

import { queryDemographics } from "@/lib/mock/demographics";

import {
  PageHeader,
  PeriodPicker,
  type PeriodOption,
} from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { AgeDistribution } from "@/components/charts/age-distribution";
import { DonutChart, type DonutSegment } from "@/components/charts/donut-chart";
import {
  FlagChip,
  HorizontalBarList,
  type HBarRow,
} from "@/components/charts/horizontal-bar-list";

const MONTH_OPTIONS: PeriodOption[] = [
  { value: "2026-05", label: "May 2026" },
  { value: "2026-04", label: "April 2026" },
  { value: "2026-03", label: "March 2026" },
];

const MONTH_LABEL: Record<string, string> = {
  "2026-05": "May 2026",
  "2026-04": "April 2026",
  "2026-03": "March 2026",
};

const GENDER_LABEL: Record<string, string> = {
  female: "Female",
  male: "Male",
  other: "Other / undisclosed",
};

const GENDER_COLOR: Record<string, string> = {
  female: "var(--primary)",
  male: "var(--primary-deep)",
  other: "var(--primary-soft)",
};

export default function DemographicsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-05");
  const d = useMemo(
    () => queryDemographics({ month: selectedMonth }),
    [selectedMonth]
  );
  const monthLabel = MONTH_LABEL[selectedMonth] ?? selectedMonth;

  const topAge = useMemo(
    () => [...d.ageDistribution].sort((a, b) => b.percent - a.percent)[0],
    [d]
  );

  const firstTime = d.loyaltyTiers.find((t) => t.tier === "new");
  const returning = d.loyaltyTiers.find((t) => t.tier === "returning");
  const loyal = d.loyaltyTiers.find((t) => t.tier === "loyal");
  const returningTotal = (returning?.count ?? 0) + (loyal?.count ?? 0);
  const retentionPct = Math.round((returningTotal / d.uniqueVisitors) * 100);

  const genderSegments: DonutSegment[] = d.genderBreakdown.map((g) => ({
    key: g.gender,
    label: GENDER_LABEL[g.gender] ?? g.gender,
    count: g.count,
    percent: g.percent,
    color: GENDER_COLOR[g.gender] ?? "var(--primary-soft)",
    swatchBorder: g.gender === "other" ? "1px solid #b8e0c0" : undefined,
  }));

  const countryRows: HBarRow[] = d.topCountries.map((c) => ({
    key: c.countryCode || c.country,
    label: (
      <span className="flex items-center gap-2">
        <FlagChip code={c.countryCode} />
        {c.country}
      </span>
    ),
    count: c.count,
    percent: c.percent,
    fill:
      c.country === "Malaysia"
        ? "var(--primary)"
        : c.country === "Other"
        ? "var(--primary-soft)"
        : "var(--primary-deep)",
  }));

  const loyaltyRows: HBarRow[] = [
    {
      key: "new",
      label: "First-time visitors",
      count: firstTime?.count ?? 0,
      percent: firstTime?.percent ?? 0,
      fill: "linear-gradient(90deg, var(--primary), var(--primary-deep))",
    },
    {
      key: "returning",
      label: "Returning (2 visits)",
      count: returning?.count ?? 0,
      percent: returning?.percent ?? 0,
      fill: "linear-gradient(90deg, var(--primary-soft), var(--primary))",
    },
    {
      key: "loyal",
      label: "Loyal (3+ visits)",
      count: loyal?.count ?? 0,
      percent: loyal?.percent ?? 0,
      fill: "var(--primary-soft)",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Demographics"
        subtitle={`Anonymised breakdown of the ${d.totalVisitors.toLocaleString("en-MY")} verified visits during ${monthLabel}.`}
        action={
          <PeriodPicker
            value={selectedMonth}
            options={MONTH_OPTIONS}
            onChange={setSelectedMonth}
          />
        }
      />

      {/* 4 KPIs */}
      <div className="mb-[18px] grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Verified visits"
          value={d.totalVisitors.toLocaleString("en-MY")}
          icon={Users}
          iconTone="primary"
          meta={`During ${monthLabel}`}
        />
        <KpiCard
          label="First-time visits"
          value={(firstTime?.count ?? 0).toLocaleString("en-MY")}
          icon={CircleDot}
          iconTone="primary"
          deltas={[
            {
              value: `${firstTime?.percent ?? 0}% of visits`,
              direction: "up",
            },
          ]}
        />
        <KpiCard
          label="Returning visits"
          value={returningTotal.toLocaleString("en-MY")}
          icon={RotateCcw}
          iconTone="primary"
          deltas={[
            { value: `${retentionPct}% return rate`, direction: "up" },
          ]}
        />
        <KpiCard
          label="Top age group"
          value={topAge.bracket}
          icon={Target}
          iconTone="primary"
          meta={`${topAge.percent}% of visits (${topAge.count} people)`}
        />
      </div>

      {/* Row 1 — Age + Gender */}
      <div className="mb-[18px] grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <ChartCard
          title="Age distribution"
          subtitle="Verified visits broken down by age bracket"
        >
          <AgeDistribution
            data={d.ageDistribution}
            insight={
              <>
                <b className="font-bold text-foreground">
                  {topAge.bracket} is your sweet spot
                </b>{" "}
                — {topAge.percent}% of customers fall here. Worth aligning content
                and promotions to this group.
              </>
            }
          />
        </ChartCard>

        <ChartCard title="Gender mix" subtitle="Anonymised from app signup data">
          <DonutChart
            segments={genderSegments}
            centerValue={d.totalVisitors.toLocaleString("en-MY")}
            centerLabel="Visits"
            size={180}
            showCounts
            insight={
              <>
                <b className="font-bold text-foreground">
                  Slightly female-leaning
                </b>{" "}
                — visit mix lines up with the F&amp;B industry average for
                casual dining.
              </>
            }
          />
        </ChartCard>
      </div>

      {/* Row 2 — Top customer areas + Loyalty */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <ChartCard
          title="Top customer areas"
          subtitle={`Where ${monthLabel}'s visits came from`}
        >
          <HorizontalBarList rows={countryRows} />
          <div className="mt-4 border-t border-dashed border-border pt-3.5 text-[11.5px] font-medium leading-relaxed text-muted-foreground">
            <b className="font-bold text-foreground">
              {countryRows[0]?.count.toLocaleString("en-MY") ?? 0} visits
            </b>{" "}
            from your top area — concentrated within Klang Valley.
          </div>
        </ChartCard>

        <ChartCard title="Customer loyalty" subtitle="How often customers return">
          <HorizontalBarList rows={loyaltyRows} />
          <div className="mt-4 border-t border-dashed border-border pt-3.5 text-[11.5px] font-medium leading-relaxed text-muted-foreground">
            <b className="font-bold text-foreground">
              {retentionPct}% return rate
            </b>{" "}
            this period — Wegood4u&apos;s unique-store rule pushes first visits.
            The {loyal?.percent ?? 0}% loyal tier are your champions.
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
