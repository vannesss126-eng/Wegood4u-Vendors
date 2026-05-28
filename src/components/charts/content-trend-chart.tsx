"use client";

import { format, parseISO } from "date-fns";
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

type ContentTrendChartProps = {
  data: { date: string; total: number }[];
};

function formatTickK(n: number): string {
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return n.toLocaleString("en-MY");
}

function formatDateShort(iso: string): string {
  return format(parseISO(`${iso}T00:00:00+08:00`), "MMM d");
}

export function ContentTrendChart({ data }: ContentTrendChartProps) {
  const last = data[data.length - 1];
  // Tick selection: evenly-spaced ~5 labels across the range. Always include
  // the first and last day so the axis reads from-to correctly.
  const ticks =
    data.length <= 5
      ? data.map((d) => d.date)
      : [
          data[0].date,
          data[Math.floor(data.length * 0.25)].date,
          data[Math.floor(data.length * 0.5)].date,
          data[Math.floor(data.length * 0.75)].date,
          last.date,
        ];

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 16, right: 20, bottom: 4, left: 4 }}
        >
          <defs>
            <linearGradient id="content-trend-fill" x1="0" y1="0" x2="0" y2="1">
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
            dataKey="date"
            ticks={ticks}
            tickFormatter={formatDateShort}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10.5, fill: "var(--muted-foreground)" }}
            dy={6}
          />
          <YAxis
            tickFormatter={formatTickK}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "var(--text-dim)" }}
            width={40}
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
            labelFormatter={(label) => formatDateShort(String(label))}
            formatter={(value) => [
              `${Number(value).toLocaleString("en-MY")} views`,
              "Cumulative",
            ]}
          />

          <Area
            type="monotone"
            dataKey="total"
            stroke="var(--primary)"
            strokeWidth={2.5}
            fill="url(#content-trend-fill)"
            dot={false}
            activeDot={{ r: 5, fill: "var(--primary)", strokeWidth: 0 }}
          />

          <ReferenceDot
            x={last.date}
            y={last.total}
            r={5}
            fill="#FFFFFF"
            stroke="var(--primary)"
            strokeWidth={2.5}
            ifOverflow="visible"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
