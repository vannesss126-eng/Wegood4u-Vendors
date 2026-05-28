"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, ChevronDown, Download, Search } from "lucide-react";

import type { SubmissionStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

/* ============================================================
   ChipRow — segmented control
   ============================================================ */

export type ChipOption<T extends string> = {
  value: T;
  label: string;
};

export type ChipRowProps<T extends string> = {
  value: T;
  options: ChipOption<T>[];
  onChange: (next: T) => void;
};

export function ChipRow<T extends string>({
  value,
  options,
  onChange,
}: ChipRowProps<T>) {
  return (
    <div className="inline-flex gap-1 rounded-[8px] border border-border bg-bg-soft p-[3px]">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "bg-primary-soft text-primary-deep"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   StatusFilter — dropdown with colored dot indicator
   ============================================================ */

export type StatusFilterValue = SubmissionStatus | "all";

type StatusFilterProps = {
  value: StatusFilterValue;
  onChange: (next: StatusFilterValue) => void;
};

const STATUS_OPTIONS: {
  value: StatusFilterValue;
  label: string;
  dotClass: string;
}[] = [
  { value: "all", label: "All", dotClass: "bg-muted-foreground" },
  { value: "approved", label: "Approved", dotClass: "bg-primary" },
  { value: "pending", label: "Pending", dotClass: "bg-amber" },
  { value: "rejected", label: "Rejected", dotClass: "bg-red" },
];

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = STATUS_OPTIONS.find((o) => o.value === value);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-2 rounded-[8px] border bg-card px-3 py-1.5 text-[12.5px] font-semibold text-foreground transition-colors",
          open ? "border-primary" : "border-border hover:border-border-hi"
        )}
      >
        <span className={cn("h-[7px] w-[7px] rounded-full", selected?.dotClass)} />
        {selected?.label ?? "Status"}
        <ChevronDown
          className={cn(
            "h-3 w-3 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2 w-[180px] overflow-hidden rounded-[8px] border border-border bg-card shadow-md"
        >
          {STATUS_OPTIONS.map((option) => {
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-3 py-2 text-[12.5px] transition-colors",
                  isSelected
                    ? "bg-primary-soft/60 text-primary-deep"
                    : "text-foreground hover:bg-bg-soft"
                )}
              >
                <Check
                  className={cn(
                    "h-3 w-3 flex-shrink-0",
                    isSelected ? "text-primary-deep" : "text-transparent"
                  )}
                />
                <span className={cn("h-[7px] w-[7px] rounded-full", option.dotClass)} />
                <span className="font-semibold">{option.label}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/* ============================================================
   SearchField — left-icon input, 36px tall
   ============================================================ */

type SearchFieldProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
};

export function SearchField({ value, onChange, placeholder }: SearchFieldProps) {
  return (
    <div className="relative min-w-[200px] flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-dim" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-[8px] border border-border bg-background pl-9 pr-3.5 text-[12.5px] font-medium text-foreground placeholder:text-text-dim transition-[border-color,box-shadow] duration-150 focus:border-primary focus:outline-none focus:[box-shadow:0_0_0_3px_rgba(32,110,86,0.12)]"
      />
    </div>
  );
}

/* ============================================================
   FilterBar — composed
   ============================================================ */

type FilterBarProps<T extends string> = {
  rangeLabel?: string;
  rangeValue: T;
  rangeOptions: ChipOption<T>[];
  onRangeChange: (next: T) => void;
  status: StatusFilterValue;
  onStatusChange: (next: StatusFilterValue) => void;
  search: string;
  onSearchChange: (next: string) => void;
  searchPlaceholder?: string;
  onExport?: () => void;
  exportLabel?: string;
};

export function FilterBar<T extends string>({
  rangeLabel = "Range",
  rangeValue,
  rangeOptions,
  onRangeChange,
  status,
  onStatusChange,
  search,
  onSearchChange,
  searchPlaceholder,
  onExport,
  exportLabel = "Export CSV",
}: FilterBarProps<T>) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-dim">
          {rangeLabel}
        </span>
        <ChipRow value={rangeValue} options={rangeOptions} onChange={onRangeChange} />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-dim">
          Status
        </span>
        <StatusFilter value={status} onChange={onStatusChange} />
      </div>

      <SearchField
        value={search}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
      />

      {onExport ? (
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-border bg-card px-3.5 py-1.5 text-[12.5px] font-semibold text-foreground transition-colors hover:border-border-hi hover:bg-bg-soft"
        >
          <Download className="h-3.5 w-3.5 text-muted-foreground" />
          {exportLabel}
        </button>
      ) : null}
    </div>
  );
}

/* ============================================================
   FilterSummary — count + active filters + totals + clear link
   ============================================================ */

type FilterSummaryProps = {
  count: number;
  rangeLabel: string;
  statusLabel: string;
  totalRevenue: number;
  avgPerVisit: number;
  onClear: () => void;
  extraRight?: ReactNode;
};

const RM = (n: number) =>
  `RM ${n.toLocaleString("en-MY", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;

export function FilterSummary({
  count,
  rangeLabel,
  statusLabel,
  totalRevenue,
  avgPerVisit,
  onClear,
}: FilterSummaryProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-[12.5px] text-muted-foreground">
      <span>
        Showing <b className="text-foreground">{count.toLocaleString("en-MY")}</b>{" "}
        verified visits · <b className="text-foreground">{rangeLabel}</b> ·{" "}
        <b className="text-foreground">{statusLabel}</b>
      </span>
      <div className="flex items-center gap-4">
        <span>
          Total revenue <b className="text-foreground">{RM(totalRevenue)}</b> ·{" "}
          Avg/visit <b className="text-foreground">{RM(avgPerVisit)}</b>
        </span>
        <button
          type="button"
          onClick={onClear}
          className="cursor-pointer text-xs font-bold text-primary transition-colors hover:text-primary-deep hover:underline underline-offset-2"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}
