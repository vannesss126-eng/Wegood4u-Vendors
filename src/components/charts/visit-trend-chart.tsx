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

// Monthly aggregate, last 6 months. Hardcoded for Pass 1 — in Pass 2 this
// becomes a Postgres date_trunc('month', created_at) rollup. Pre-enrollment
// months (Dec/Jan) render as zero so the line starts flat then ramps up.
const TREND = [
  { month: "Dec", visits: 0 },
  { month: "Jan", visits: 0 },
  { month: "Feb", visits: 188 },
  { month: "Mar", visits: 295 },
  { month: "Apr", visits: 326 },
  { month: "May", visits: 287 },
] as const;

const LAST = TREND[TREND.length - 1];

export function VisitTrendChart() {
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
            domain={[0, 500]}
            ticks={[0, 100, 200, 300, 400, 500]}
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
