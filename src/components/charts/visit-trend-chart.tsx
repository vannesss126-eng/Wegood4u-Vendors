"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MonthlyVisitPoint } from "@/types/domain";

// Monthly aggregate, last 6 months, for the active store. Pass 2 swaps this for
// a Postgres date_trunc('month', created_at) rollup. Pre-enrollment months
// render as zero so the line starts flat then ramps up.
type VisitTrendChartProps = { data: MonthlyVisitPoint[] };

/** Round a max value up to a clean axis ceiling (10 / 20 / 50 / 100 …). */
function niceCeil(max: number): number {
  if (max <= 10) return 10;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const steps = [1, 2, 2.5, 5, 10];
  for (const s of steps) {
    if (max <= s * pow) return s * pow;
  }
  return 10 * pow;
}

export function VisitTrendChart({ data }: VisitTrendChartProps) {
  const TREND = data.map((d) => ({ month: d.label, visits: d.visits }));
  const LAST = TREND[TREND.length - 1] ?? { month: "", visits: 0 };
  const yMax = niceCeil(Math.max(10, ...TREND.map((d) => d.visits)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={[...TREND]}
          margin={{ top: 24, right: 24, bottom: 4, left: 4 }}
        >
          <defs>
            <linearGradient id="visit-trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.32} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="2 4"
            stroke="var(--border)"
            vertical={false}
          />

          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            dy={6}
          />
          <YAxis
            domain={[0, yMax]}
            ticks={ticks}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "var(--text-dim)" }}
            width={32}
          />

          <Tooltip
            cursor={{ stroke: "var(--primary)", strokeOpacity: 0.3 }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              boxShadow: "0 4px 14px -4px rgba(14,20,16,0.08)",
              fontSize: 12,
              padding: "8px 12px",
            }}
            labelStyle={{ fontWeight: 700, color: "var(--foreground)" }}
            formatter={(value) => [
              `${Number(value).toLocaleString("en-MY")} visits`,
              "Verified",
            ]}
          />

          <Area
            type="monotone"
            dataKey="visits"
            stroke="var(--primary)"
            strokeWidth={2.5}
            fill="url(#visit-trend-fill)"
            dot={{ r: 4, fill: "var(--primary)", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "var(--primary)", strokeWidth: 0 }}
          />

          {/* Highlight the most recent month with a white-fill outlined dot. */}
          <ReferenceDot
            x={LAST.month}
            y={LAST.visits}
            r={5}
            fill="#FFFFFF"
            stroke="var(--primary)"
            strokeWidth={2}
            ifOverflow="visible"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
