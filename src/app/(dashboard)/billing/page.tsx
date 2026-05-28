"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

import {
  MOCK_BILLING_HISTORY,
  MOCK_CURRENT_STATEMENT,
  MOCK_STORE,
} from "@/lib/mock";
import { MOCK_TODAY } from "@/lib/mock/visits";
import type { BillingStatement } from "@/types/domain";

import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { StatementCard } from "@/components/dashboard/statement-card";
import { StatementHistoryList } from "@/components/dashboard/statement-history-list";
import { cn } from "@/lib/utils";

const ALL_STATEMENTS = [MOCK_CURRENT_STATEMENT, ...MOCK_BILLING_HISTORY];

const RM_INT = (n: number) => `RM ${Math.round(n).toLocaleString("en-MY")}`;

function formatMonthRange(statements: BillingStatement[]): string {
  if (statements.length === 0) return "";
  const last = statements[statements.length - 1];
  const first = statements[0];
  const shortMonth = (s: string) => s.split(" ")[0].slice(0, 3);
  return `${shortMonth(last.month)}–${shortMonth(first.month)}`;
}

function daysUntilNextStatement(currentPeriodEnd: string): number {
  const today = parseISO(`${MOCK_TODAY}T00:00:00+08:00`);
  const end = parseISO(`${currentPeriodEnd}T00:00:00+08:00`);
  const issue = new Date(end);
  issue.setDate(issue.getDate() + 1);
  const ms = issue.getTime() - today.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export default function BillingPage() {
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly");
  const [selectedId, setSelectedId] = useState<string>(
    MOCK_CURRENT_STATEMENT.id
  );

  const selected = useMemo(
    () =>
      ALL_STATEMENTS.find((s) => s.id === selectedId) ?? MOCK_CURRENT_STATEMENT,
    [selectedId]
  );

  // Last 3 months = current draft + 2 most recent settled.
  const last3 = ALL_STATEMENTS.slice(0, 3);
  const last3Total = last3.reduce((a, s) => a + s.amountOwed, 0);

  const statementNo = `WV-${selected.id.replace("stmt-", "")}-#0042`;

  // Next statement issue date — first of the month after current period end.
  const currentEnd = parseISO(
    `${MOCK_CURRENT_STATEMENT.periodEnd}T00:00:00+08:00`
  );
  const nextIssueDate = new Date(currentEnd);
  nextIssueDate.setDate(nextIssueDate.getDate() + 1);
  const nextIssueLabel = format(nextIssueDate, "MMM d");
  const daysAway = daysUntilNextStatement(MOCK_CURRENT_STATEMENT.periodEnd);

  return (
    <div>
      <PageHeader
        title="Billing"
        subtitle="Auto-generated statements — verified visits × per-visit fee. Billing handled out-of-band; this is your reference."
        action={
          <div className="inline-flex gap-0 rounded-[10px] border border-border bg-bg-soft p-[3px]">
            {(["weekly", "monthly"] as const).map((opt) => {
              const isActive = period === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    if (opt === "weekly") {
                      toast.info(
                        "Weekly view ships in Pass 2 alongside billing-statement weekly aggregation."
                      );
                      return;
                    }
                    setPeriod(opt);
                  }}
                  className={cn(
                    "rounded-[7px] px-4 py-1.5 text-[12.5px] font-semibold capitalize transition-colors",
                    isActive
                      ? "bg-card text-primary-deep shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        }
      />

      {/* 4 KPIs */}
      <div className="mb-[18px] grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          accent
          label="Current month owed"
          value={RM_INT(MOCK_CURRENT_STATEMENT.amountOwed)}
          icon={DollarSign}
          iconTone="primary"
          meta={`${MOCK_CURRENT_STATEMENT.verifiedVisits} visits × RM ${MOCK_CURRENT_STATEMENT.perVisitFee.toFixed(2)} · ${MOCK_CURRENT_STATEMENT.month}`}
        />
        <KpiCard
          label="Customer total spend"
          value={RM_INT(MOCK_CURRENT_STATEMENT.customerSpend)}
          icon={CheckCircle2}
          iconTone="primary"
          meta="Their receipts · sum of submission.total_amount"
        />
        <KpiCard
          label="Last 3 months owed"
          value={RM_INT(last3Total)}
          icon={Receipt}
          iconTone="primary"
          deltas={[
            {
              value: `${formatMonthRange(last3)} · 2 settled + draft`,
              direction: "up",
            },
          ]}
        />
        <KpiCard
          label="Next statement issued"
          value={nextIssueLabel}
          icon={Calendar}
          iconTone="primary"
          meta={`Auto-generated · ${daysAway} days away`}
        />
      </div>

      {/* Statement + history */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.8fr_1fr]">
        <StatementCard
          statement={selected}
          statementNo={statementNo}
          issuedTo={{
            name: MOCK_STORE.name,
            address: MOCK_STORE.address,
            enrolledAt: format(
              parseISO(`${MOCK_STORE.enrolledAt}T00:00:00+08:00`),
              "d MMM yyyy"
            ),
          }}
          onExportCsv={() => toast.info("CSV export ships in Pass 2.")}
          onDownloadPdf={() =>
            toast.info("PDF download ships in Pass 2 via @react-pdf/renderer.")
          }
        />
        <StatementHistoryList
          statements={ALL_STATEMENTS}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>
    </div>
  );
}
