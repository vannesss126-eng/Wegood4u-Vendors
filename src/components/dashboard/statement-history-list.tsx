"use client";

import { ChevronRight } from "lucide-react";

import type { BillingStatement, BillingStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

type StatementHistoryListProps = {
  /** Statements ordered newest-first. */
  statements: BillingStatement[];
  selectedId: string;
  onSelect: (id: string) => void;
  title?: string;
  subtitle?: string;
};

const STATUS_LABEL: Record<BillingStatus, string> = {
  draft: "Draft",
  issued: "Issued",
  paid: "Paid",
};

const STATUS_CLASS: Record<BillingStatus, string> = {
  draft: "bg-amber-soft text-amber",
  issued: "bg-primary-soft text-primary-deep",
  paid: "bg-primary-soft text-primary-deep",
};

const RM = (n: number) =>
  `RM ${n.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function StatusBadge({ status }: { status: BillingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.06em]",
        STATUS_CLASS[status]
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function subText(s: BillingStatement): string {
  if (s.status === "draft") return `${s.verifiedVisits.toLocaleString("en-MY")} visits · in progress`;
  const statementSlug = `WV-${s.id.replace("stmt-", "")}-#0042`;
  return `${s.verifiedVisits.toLocaleString("en-MY")} visits · ${statementSlug}`;
}

function amountSub(
  s: BillingStatement,
  prior: BillingStatement | undefined
): string {
  if (s.status === "draft") return "Issues next month";
  if (!prior) return "Partial month";
  const delta = ((s.amountOwed - prior.amountOwed) / prior.amountOwed) * 100;
  if (Number.isFinite(delta)) {
    const sign = delta >= 0 ? "+" : "";
    return `${sign}${delta.toFixed(1)}% M-o-M`;
  }
  return "";
}

export function StatementHistoryList({
  statements,
  selectedId,
  onSelect,
  title = "Recent statements",
  subtitle = "Last 3 months + current",
}: StatementHistoryListProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <div className="text-sm font-bold text-foreground">{title}</div>
        <div className="mt-0.5 text-[11.5px] font-medium text-muted-foreground">
          {subtitle}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {statements.map((s, idx) => {
          const isSelected = s.id === selectedId;
          // Prior month (older) is at idx + 1 since list is newest-first.
          const prior = statements[idx + 1];
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className={cn(
                "group flex items-center justify-between gap-3 border-b border-border px-5 py-4 text-left transition-colors last:border-b-0",
                isSelected
                  ? "bg-primary-tint hover:bg-primary-soft"
                  : "hover:bg-bg-soft"
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[13.5px] font-bold text-foreground">
                  {s.month}
                  <StatusBadge status={s.status} />
                </div>
                <div className="mt-1 text-[11.5px] font-medium tabular-nums text-muted-foreground">
                  {subText(s)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[14px] font-bold tabular-nums text-foreground">
                  {RM(s.amountOwed)}
                </div>
                <div className="mt-0.5 text-[10.5px] font-medium text-text-dim">
                  {amountSub(s, prior)}
                </div>
              </div>

              <ChevronRight className="h-4 w-4 flex-shrink-0 text-text-dim transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
