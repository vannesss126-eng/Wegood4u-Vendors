"use client";

import type { ReactNode } from "react";

type AgeBracketRow = {
  bracket: string;
  count: number;
  percent: number;
};

type AgeDistributionProps = {
  data: AgeBracketRow[];
  /** Optional callout text rendered as a dashed-top footer below the chart. */
  insight?: ReactNode;
};

export function AgeDistribution({ data, insight }: AgeDistributionProps) {
  const maxPercent = Math.max(1, ...data.map((d) => d.percent));
  const colCount = data.length;

  return (
    <div>
      {/* Bar grid — pt-8 reserves space for the % label sitting above each bar */}
      <div
        className="relative grid items-end px-1 pb-0 pt-8"
        style={{
          gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
          gap: 16,
          height: 220,
        }}
      >
        {/* Grid lines — render as absolutely-positioned hairlines */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-px bg-border"
          style={{ top: "42%" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-px bg-border"
          style={{ top: "72%" }}
        />

        {data.map((row) => {
          const heightPct = (row.percent / maxPercent) * 100;
          return (
            <div
              key={row.bracket}
              className="relative flex h-full flex-col items-center"
            >
              <div
                className="relative mt-auto w-full rounded-t-md bg-gradient-to-b from-primary to-primary-deep transition-[filter] duration-150 hover:brightness-110"
                style={{ height: `${heightPct}%` }}
              >
                <span className="absolute -top-[22px] left-1/2 -translate-x-1/2 text-xs font-bold tracking-tight text-foreground">
                  {row.percent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Labels row sits outside the bar grid so it doesn't compete for height */}
      <div
        className="mt-2 grid px-1"
        style={{
          gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
          gap: 16,
        }}
      >
        {data.map((row) => (
          <div key={row.bracket} className="text-center">
            <div className="text-[11.5px] font-semibold text-muted-foreground">
              {row.bracket}
            </div>
            <div className="mt-px text-[10.5px] font-medium text-text-dim">
              {row.count.toLocaleString("en-MY")} people
            </div>
          </div>
        ))}
      </div>

      {insight ? (
        <div className="mt-4 border-t border-dashed border-border pt-3.5 text-[11.5px] font-medium leading-relaxed text-muted-foreground">
          {insight}
        </div>
      ) : null}
    </div>
  );
}
