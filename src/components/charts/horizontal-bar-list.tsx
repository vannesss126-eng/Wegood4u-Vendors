"use client";

import type { CSSProperties, ReactNode } from "react";

export type HBarRow = {
  key: string;
  /** Can be a plain string OR a JSX node (e.g. flag chip + country name). */
  label: ReactNode;
  count: number;
  percent: number;
  /** CSS background value (solid color, gradient, or var). */
  fill?: string;
  /** Optional border for pale fills so they remain visible on the track. */
  fillBorder?: string;
};

type HorizontalBarListProps = {
  rows: HBarRow[];
  /**
   * If true, fill widths normalize so the largest row hits 100%.
   * If false (default), widths use the raw `percent` value (absolute scale).
   * Country / Loyalty pages use false. WeekdayBreakdown uses true.
   */
  normalizeToMax?: boolean;
  /** Suffix shown after the count (default: "people"). */
  countSuffix?: string;
};

export function HorizontalBarList({
  rows,
  normalizeToMax = false,
  countSuffix = "people",
}: HorizontalBarListProps) {
  const max = normalizeToMax
    ? Math.max(1, ...rows.map((r) => r.percent))
    : 100;

  return (
    <div className="flex flex-col gap-3.5">
      {rows.map((row) => {
        const widthPct = (row.percent / max) * 100;
        const fillStyle: CSSProperties = {
          width: `${widthPct}%`,
          background: row.fill ?? "var(--primary)",
        };
        if (row.fillBorder) fillStyle.border = row.fillBorder;
        return (
          <div key={row.key} className="relative">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-[13px] font-semibold text-foreground">
                {row.label}
              </span>
              <span className="flex items-baseline gap-2 tabular-nums">
                <span className="text-xs font-medium text-text-dim">
                  {row.count.toLocaleString("en-MY")} {countSuffix}
                </span>
                <span className="text-[13px] font-bold text-foreground">
                  {row.percent}%
                </span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-bg-soft">
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={fillStyle}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Small ISO-code chip used as a leading element on country rows.
 *  Pass 1 shows text; Phase J can swap to SVG flags via a deps add. */
export function FlagChip({ code }: { code: string }) {
  const display = code && code.trim() ? code : "··";
  return (
    <span className="grid h-3.5 w-[18px] place-items-center rounded-[2px] border border-border bg-bg-soft text-[9px] font-bold text-muted-foreground">
      {display}
    </span>
  );
}
