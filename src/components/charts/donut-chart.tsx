"use client";

import type { ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { cn } from "@/lib/utils";

export type DonutSegment = {
  key: string;
  label: string;
  count: number;
  percent: number;
  /** CSS color value for the segment fill (e.g. "var(--primary)"). */
  color: string;
  /** Optional swatch border (e.g. for the soft pastel "New" segment so it's
   *  visible against a white legend background). */
  swatchBorder?: string;
};

type DonutChartProps = {
  segments: DonutSegment[];
  /** Number rendered inside the donut hole. Pre-formatted (e.g. "1,108"). */
  centerValue: string | number;
  /** Caption below the centerValue (e.g. "Total" or "Customers"). */
  centerLabel: string;
  /** Donut diameter in px. 140 default (dashboard tile), 180 for the larger demographics one. */
  size?: number;
  /** Reveal an extra "{count} people" sub-line under each legend label. */
  showCounts?: boolean;
  /** Optional header above the legend rows (e.g. "Customer mix"). */
  legendHeader?: string;
  /** Optional insight text rendered as a dashed-top footer. */
  insight?: ReactNode;
  className?: string;
};

export function DonutChart({
  segments,
  centerValue,
  centerLabel,
  size = 140,
  showCounts = false,
  legendHeader,
  insight,
  className,
}: DonutChartProps) {
  // Scale inner/outer radius proportionally with size so the ring thickness
  // stays visually consistent at any donut diameter.
  const outerRadius = Math.round(size * 0.47);
  const innerRadius = Math.round(size * 0.34);
  // Map centerValue font-size linearly: 22px at 140 → 28px at 180.
  const centerFontSize = Math.max(18, Math.round(size * 0.157));

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-5">
        <div
          className="relative flex-shrink-0"
          style={{ width: size, height: size }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segments}
                dataKey="percent"
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={90}
                endAngle={-270}
                stroke="none"
                isAnimationActive={false}
              >
                {segments.map((seg) => (
                  <Cell key={seg.key} fill={seg.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div
                className="font-bold leading-none tracking-tight text-foreground"
                style={{ fontSize: centerFontSize }}
              >
                {centerValue}
              </div>
              <div className="mt-[3px] text-[10px] font-semibold uppercase tracking-[0.04em] text-text-dim">
                {centerLabel}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          {legendHeader ? (
            <div className="mb-1.5 text-[12.5px] font-bold text-foreground">
              {legendHeader}
            </div>
          ) : null}
          {segments.map((seg) => (
            <div
              key={seg.key}
              className={cn(
                "flex items-center gap-2.5",
                showCounts ? "py-1.5" : "py-1.5"
              )}
            >
              <span
                className="h-[11px] w-[11px] flex-shrink-0 rounded-[3px]"
                style={{
                  backgroundColor: seg.color,
                  border: seg.swatchBorder ?? "none",
                }}
              />
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-foreground">
                  {seg.label}
                </div>
                {showCounts ? (
                  <div className="mt-px text-[10.5px] font-medium text-text-dim">
                    {seg.count.toLocaleString("en-MY")} people
                  </div>
                ) : null}
              </div>
              <span className="text-[13px] font-bold tabular-nums text-foreground">
                {seg.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {insight ? (
        <div className="mt-4 border-t border-dashed border-border pt-3.5 text-[11.5px] font-medium leading-relaxed text-muted-foreground">
          {insight}
        </div>
      ) : null}
    </div>
  );
}
