"use client";

import { useMemo, type CSSProperties } from "react";
import { Star } from "lucide-react";

import type { DailyVisitCount } from "@/types/domain";
import { cn } from "@/lib/utils";

type VisitCalendarProps = {
  /** Number of months to render, ending at `endDate`. 5 for dashboard tile, 12 for peak-hours page. */
  months: number;
  /** Last day to include (inclusive). Defaults to today (2026-05-27). ISO date YYYY-MM-DD. */
  endDate?: string;
  /** Enrollment cutoff — days before this render as dashed empty cells. */
  enrolledFrom: string;
  /** All daily counts, including null for pre-enrollment / future days. */
  dailyCounts: DailyVisitCount[];
  /**
   * When true, months span equal widths and cells flex-size via CSS grid (1fr).
   * Used on the dashboard tile to fill the card. Each month is forced to a 6×7
   * grid with `aspect-ratio: 6/7`. `cellSize`/`cellGap` are ignored.
   */
  fillWidth?: boolean;
  /** Cell size in px — only when fillWidth is false. 12 for compact tile, 19 for full-page view. */
  cellSize?: number;
  /** Gap between cells — only when fillWidth is false. */
  cellGap?: number;
  /** Highlight a single peak day with a star icon. */
  peakDate?: string;
  /** Show the day-of-week labels column on the left. */
  showDowLabels?: boolean;
  /** Show the legend footer below the calendar. */
  showFooter?: boolean;
};

const DOW_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Forced grid size when fillWidth is on. 6 columns covers every real month
 *  (March 2026 needs 6; most need 5). Trailing column is spacers when unused. */
const FILL_COLS = 6;
const FILL_ROWS = 7;
const FILL_CELLS_PER_MONTH = FILL_COLS * FILL_ROWS; // 42

type BuiltCell =
  | { kind: "spacer" }
  | { kind: "empty"; date: string }
  | { kind: "day"; date: string; count: number; bucket: 1 | 2 | 3 | 4 | 5 };

type BuiltMonth = {
  key: string;
  label: string;
  year: number;
  cells: BuiltCell[];
  isCurrent: boolean;
};

function monDow(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildMonths(
  endDateIso: string,
  monthsCount: number,
  enrolledIso: string,
  dailyCounts: DailyVisitCount[],
  padCellsTo?: number
): BuiltMonth[] {
  const countByDate = new Map<string, number | null>();
  for (const d of dailyCounts) countByDate.set(d.date, d.count);

  const active = dailyCounts
    .map((d) => d.count)
    .filter((v): v is number => typeof v === "number" && v > 0)
    .sort((a, b) => a - b);
  const bucketFor = (count: number): 1 | 2 | 3 | 4 | 5 => {
    if (active.length === 0) return 1;
    const idx = active.indexOf(count);
    const pct = idx / active.length;
    if (pct < 0.2) return 1;
    if (pct < 0.4) return 2;
    if (pct < 0.6) return 3;
    if (pct < 0.85) return 4;
    return 5;
  };

  const enrolled = new Date(`${enrolledIso}T00:00:00Z`);
  const end = new Date(`${endDateIso}T00:00:00Z`);
  const start = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (monthsCount - 1), 1)
  );

  const months: BuiltMonth[] = [];
  for (let m = 0; m < monthsCount; m++) {
    const cursor = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + m, 1)
    );
    const year = cursor.getUTCFullYear();
    const monthIdx = cursor.getUTCMonth();
    const firstDow = monDow(cursor);
    const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();

    const cells: BuiltCell[] = [];
    for (let i = 0; i < firstDow; i++) cells.push({ kind: "spacer" });

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(year, monthIdx, day));
      const iso = dateKey(date);
      const isPreEnroll = date < enrolled;
      const isFuture = date > end;
      const count = countByDate.get(iso);

      if (isPreEnroll || isFuture || count == null) {
        cells.push({ kind: "empty", date: iso });
      } else {
        cells.push({ kind: "day", date: iso, count, bucket: bucketFor(count) });
      }
    }

    const lastDow = monDow(new Date(Date.UTC(year, monthIdx, daysInMonth)));
    const trailing = 6 - lastDow;
    for (let i = 0; i < trailing; i++) cells.push({ kind: "spacer" });

    if (padCellsTo != null) {
      while (cells.length < padCellsTo) cells.push({ kind: "spacer" });
      cells.length = padCellsTo; // safety truncate
    }

    months.push({
      key: `${year}-${String(monthIdx + 1).padStart(2, "0")}`,
      label: MONTH_LABELS[monthIdx],
      year,
      cells,
      isCurrent:
        end.getUTCFullYear() === year && end.getUTCMonth() === monthIdx,
    });
  }

  return months;
}

const BUCKET_CLASS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "bg-[rgba(32,110,86,0.18)] border-[rgba(32,110,86,0.22)]",
  2: "bg-[rgba(32,110,86,0.36)] border-[rgba(32,110,86,0.40)]",
  3: "bg-[rgba(32,110,86,0.55)] border-[rgba(32,110,86,0.58)]",
  4: "bg-[rgba(32,110,86,0.78)] border-[rgba(32,110,86,0.82)]",
  5: "bg-primary border-primary-deep shadow-[0_0_6px_rgba(32,110,86,0.25)]",
};

export function VisitCalendar({
  months,
  endDate = "2026-05-27",
  enrolledFrom,
  dailyCounts,
  fillWidth = false,
  cellSize = 12,
  cellGap = 2.5,
  peakDate,
  showDowLabels = false,
  showFooter = true,
}: VisitCalendarProps) {
  const built = useMemo(
    () =>
      buildMonths(
        endDate,
        months,
        enrolledFrom,
        dailyCounts,
        fillWidth ? FILL_CELLS_PER_MONTH : undefined
      ),
    [endDate, months, enrolledFrom, dailyCounts, fillWidth]
  );

  /* ============================================================
     FILL-WIDTH mode — equal-width months filling the card.
     Each month: 6×7 grid, aspect-ratio 6/7, cells flex-sized.
     ============================================================ */
  if (fillWidth) {
    return (
      <div className="w-full">
        <div
          className="grid w-full"
          style={{
            gridTemplateColumns: `repeat(${months}, minmax(0, 1fr))`,
            gap: "14px",
          }}
        >
          {built.map((month) => (
            <div key={month.key} className="flex min-w-0 flex-col">
              <div
                className="grid w-full"
                style={{
                  gridTemplateColumns: `repeat(${FILL_COLS}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${FILL_ROWS}, minmax(0, 1fr))`,
                  gridAutoFlow: "column",
                  gap: "3px",
                  aspectRatio: `${FILL_COLS} / ${FILL_ROWS}`,
                }}
              >
                {month.cells.map((cell, idx) => (
                  <CalCell
                    key={idx}
                    cell={cell}
                    peakDate={peakDate}
                    flexSize
                  />
                ))}
              </div>
              <div
                className={cn(
                  "mt-3 text-center text-[12px] font-bold tracking-[0.01em]",
                  month.isCurrent ? "text-primary-deep" : "text-foreground"
                )}
              >
                {month.label}
                {month.isCurrent ? (
                  <span className="mx-auto mt-1 block h-0.5 w-3 rounded-sm bg-primary" />
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {showFooter ? (
          <CalFooter peakDate={peakDate} />
        ) : null}
      </div>
    );
  }

  /* ============================================================
     NATURAL mode — variable-width months sized by real weeks count.
     Used on the Peak Hours full-page view for precise calendar.
     ============================================================ */
  const gridStyle: CSSProperties = {
    gridTemplateRows: `repeat(7, ${cellSize}px)`,
    gridAutoFlow: "column",
    gridAutoColumns: `${cellSize}px`,
    gap: `${cellGap}px`,
  };

  return (
    <div className="w-full">
      <div className="flex items-start gap-3.5 overflow-x-auto pb-1">
        {showDowLabels ? (
          <div
            className="grid flex-shrink-0"
            style={{
              gridTemplateRows: `repeat(7, ${cellSize}px)`,
              gap: `${cellGap}px`,
              paddingRight: 4,
            }}
          >
            {DOW_LABELS.map((label, i) => (
              <span
                key={`${label}-${i}`}
                className="text-right text-[9px] font-bold tracking-[0.02em] text-text-dim"
                style={{ lineHeight: `${cellSize}px` }}
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}

        {built.map((month) => (
          <div key={month.key} className="flex flex-shrink-0 flex-col">
            <div className="grid" style={gridStyle}>
              {month.cells.map((cell, idx) => (
                <CalCell
                  key={idx}
                  cell={cell}
                  peakDate={peakDate}
                  cellSize={cellSize}
                />
              ))}
            </div>
            <div
              className={cn(
                "mt-2 text-[11px] font-bold tracking-[0.01em]",
                month.isCurrent ? "text-primary-deep" : "text-foreground"
              )}
            >
              {month.label}
              {month.isCurrent ? (
                <span className="mt-1 block h-0.5 w-3 rounded-sm bg-primary" />
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {showFooter ? <CalFooter peakDate={peakDate} /> : null}
    </div>
  );
}

/* ------------------------------------------------------------ Cell + Footer */

function CalCell({
  cell,
  peakDate,
  cellSize,
  flexSize = false,
}: {
  cell: BuiltCell;
  peakDate?: string;
  cellSize?: number;
  flexSize?: boolean;
}) {
  const sizeStyle: CSSProperties = flexSize
    ? { aspectRatio: "1 / 1" }
    : { width: cellSize, height: cellSize };

  if (cell.kind === "spacer") {
    return (
      <span
        className="pointer-events-none border border-transparent bg-transparent"
        style={sizeStyle}
      />
    );
  }
  if (cell.kind === "empty") {
    return (
      <span
        title={cell.date}
        className="rounded-[3px] border border-dashed border-border-hi/55 bg-transparent opacity-55"
        style={sizeStyle}
      />
    );
  }

  const isPeak = peakDate !== undefined && cell.date === peakDate;
  return (
    <span
      title={`${cell.date} — ${cell.count} visits`}
      className={cn(
        "relative rounded-[3px] border transition-transform hover:z-[5] hover:scale-[1.45]",
        isPeak
          ? "border-primary-deep bg-primary-deep shadow-[0_0_10px_rgba(32,110,86,0.45)]"
          : BUCKET_CLASS[cell.bucket]
      )}
      style={sizeStyle}
    >
      {isPeak ? (
        <Star
          className="absolute inset-0 m-auto text-highlight"
          style={{
            width: flexSize ? "55%" : Math.max(8, (cellSize ?? 12) * 0.55),
            height: flexSize ? "55%" : Math.max(8, (cellSize ?? 12) * 0.55),
          }}
          fill="currentColor"
          strokeWidth={0}
        />
      ) : null}
    </span>
  );
}

function CalFooter({ peakDate }: { peakDate?: string }) {
  return (
    <div className="mt-4 flex items-center justify-between border-t border-dashed border-border pt-3.5">
      <span className="text-[11.5px] font-semibold text-muted-foreground">
        {peakDate ? (
          <>
            <b className="font-bold text-foreground">
              {new Date(`${peakDate}T00:00:00Z`).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </b>{" "}
            was your busiest day
          </>
        ) : (
          "Brighter cells = busier days."
        )}
      </span>
      <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
        <span>Low</span>
        <span className="h-2.5 w-3 rounded-sm border border-border bg-bg-soft" />
        <span className="h-2.5 w-3 rounded-sm bg-[rgba(32,110,86,0.18)]" />
        <span className="h-2.5 w-3 rounded-sm bg-[rgba(32,110,86,0.36)]" />
        <span className="h-2.5 w-3 rounded-sm bg-[rgba(32,110,86,0.55)]" />
        <span className="h-2.5 w-3 rounded-sm bg-[rgba(32,110,86,0.78)]" />
        <span className="h-2.5 w-3 rounded-sm bg-primary" />
        <span>High</span>
      </div>
    </div>
  );
}
