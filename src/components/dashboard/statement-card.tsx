"use client";

import { format, parseISO } from "date-fns";
import { Download, FileText, Zap } from "lucide-react";

import type { BillingStatement } from "@/types/domain";
import { cn } from "@/lib/utils";

type IssuedBy = {
  name: string;
  programme: string;
  email: string;
  registrationNo: string;
};

type IssuedTo = {
  name: string;
  address: string;
  /** Pre-formatted "12 Feb 2026" by the parent. */
  enrolledAt: string;
};

type StatementCardProps = {
  statement: BillingStatement;
  /** Format: WV-2026-05-#0042 */
  statementNo: string;
  issuedTo: IssuedTo;
  issuedBy?: IssuedBy;
  onExportCsv?: () => void;
  onDownloadPdf?: () => void;
};

const DEFAULT_ISSUER: IssuedBy = {
  name: "Say Sheji Group Sdn Bhd",
  programme: "Wegood4u Partnership Programme",
  email: "wegood4u@gmail.com",
  registrationNo: "SSM: 202301xxxxxx",
};

const RM = (n: number) =>
  `RM ${n.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function bannerCopy(statement: BillingStatement): string {
  if (statement.status === "draft") {
    // Auto-finalises on the first of the next month after periodEnd.
    const end = parseISO(`${statement.periodEnd}T00:00:00+08:00`);
    const finaliseDate = new Date(end);
    finaliseDate.setDate(finaliseDate.getDate() + 1);
    return `Statement-in-progress · finalises on ${format(finaliseDate, "MMM d, yyyy")}`;
  }
  if (statement.status === "paid" && statement.paidAt) {
    return `Statement settled · paid ${format(parseISO(statement.paidAt), "MMM d, yyyy")}`;
  }
  if (statement.status === "issued" && statement.issuedAt) {
    return `Statement issued ${format(parseISO(statement.issuedAt), "MMM d, yyyy")}`;
  }
  return "Statement";
}

export function StatementCard({
  statement,
  statementNo,
  issuedTo,
  issuedBy = DEFAULT_ISSUER,
  onExportCsv,
  onDownloadPdf,
}: StatementCardProps) {
  const periodStart = parseISO(`${statement.periodStart}T00:00:00+08:00`);
  const periodEnd = parseISO(`${statement.periodEnd}T00:00:00+08:00`);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Banner */}
      <div className="flex items-center justify-between gap-3 border-b border-primary-soft bg-primary-tint px-7 py-3.5">
        <div className="flex items-center gap-2.5">
          <Zap className="h-4 w-4 text-primary-deep" strokeWidth={2.5} />
          <span className="text-[12.5px] font-semibold text-primary-deep">
            {bannerCopy(statement)}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary-soft bg-card px-3 py-1.5 text-[11.5px] font-bold text-primary-deep transition-colors hover:bg-primary-soft"
          >
            <Download className="h-3 w-3" strokeWidth={2} />
            CSV
          </button>
          <button
            type="button"
            onClick={onDownloadPdf}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary-deep bg-primary px-3 py-1.5 text-[11.5px] font-bold text-primary-foreground transition-colors hover:bg-primary-deep"
          >
            <FileText className="h-3 w-3" strokeWidth={2} />
            Download PDF
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-9 py-8">
        {/* Header row */}
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <h2 className="m-0 text-[22px] font-bold tracking-tight text-foreground">
              {statement.month} statement
            </h2>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Period: {format(periodStart, "d MMM yyyy")} –{" "}
              {format(periodEnd, "d MMM yyyy")}
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-dim">
              Statement no.
            </div>
            <div className="mt-1 font-mono text-[13px] font-semibold text-foreground">
              {statementNo}
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="mb-7 grid grid-cols-1 gap-8 md:grid-cols-2">
          <PartyBlock label="Issued by">
            <div className="text-sm font-bold text-foreground">{issuedBy.name}</div>
            <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {issuedBy.programme}
              <br />
              {issuedBy.email}
              <br />
              {issuedBy.registrationNo}
            </div>
          </PartyBlock>

          <PartyBlock label="Issued to">
            <div className="text-sm font-bold text-foreground">{issuedTo.name}</div>
            <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {issuedTo.address}
              <br />
              Partner since {issuedTo.enrolledAt}
            </div>
          </PartyBlock>
        </div>

        {/* Line items table */}
        <table className="mb-4 w-full border-collapse text-[13.5px]">
          <thead>
            <tr>
              <th className="border-b border-border py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-text-dim">
                Item
              </th>
              <th className="border-b border-border py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-text-dim">
                Quantity
              </th>
              <th className="border-b border-border py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-text-dim">
                Rate
              </th>
              <th className="border-b border-border py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-text-dim">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-b border-border py-4 align-top">
                <div className="font-semibold text-foreground">
                  Verified customer visits
                </div>
                <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  AI-verified visits (selfie + receipt) attributed to this store,{" "}
                  {statement.month}.
                </div>
              </td>
              <td className="border-b border-border py-4 text-right align-top font-semibold tabular-nums text-foreground">
                {statement.verifiedVisits.toLocaleString("en-MY")}
              </td>
              <td className="border-b border-border py-4 text-right align-top font-semibold tabular-nums text-foreground">
                {RM(statement.perVisitFee)}
              </td>
              <td className="border-b border-border py-4 text-right align-top font-semibold tabular-nums text-foreground">
                {RM(statement.amountOwed)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-5 grid grid-cols-1 items-end gap-6 lg:grid-cols-[1fr_220px]">
          <div className="rounded-xl border border-border bg-bg-soft px-4 py-3.5 text-xs leading-relaxed text-muted-foreground">
            <b className="font-bold text-foreground">Reference only.</b> Billing is
            handled out-of-band via email or WhatsApp invoice. This statement is
            your reference for verification — it auto-finalises on the first of
            next month.
          </div>
          <div>
            <div className="flex flex-col gap-1.5">
              <TotalRow label="Subtotal" value={RM(statement.amountOwed)} />
              <TotalRow
                label="SST (6%) · reverse-charged"
                value={RM(0)}
              />
            </div>
            <div className="mt-1.5 flex items-baseline justify-between border-t-2 border-primary-deep pt-3.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary-deep">
                Total due
              </span>
              <span className="text-[24px] font-extrabold tracking-tight tabular-nums text-primary-deep">
                {RM(statement.amountOwed)}
              </span>
            </div>
            <div className="mt-3.5 flex items-baseline justify-between border-t border-dashed border-border pt-3 text-[11.5px] text-muted-foreground">
              <span>Customer total spend this period</span>
              <span className="font-semibold tabular-nums text-foreground">
                {RM(statement.customerSpend)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PartyBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-text-dim">
        {label}
      </div>
      {children}
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-[12.5px] font-medium text-muted-foreground tabular-nums">
      <span>{label}</span>
      <span className={cn("font-semibold text-foreground")}>{value}</span>
    </div>
  );
}
