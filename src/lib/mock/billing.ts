// Billing statements for Thai Geng Mookata.
// Current month (May) is a draft; Mar / Apr are settled.
// Feb statement is partial (enrolled Feb 12) — settled.
// amountOwed = verifiedVisits × perVisitFee (RM 3.00).

import type { BillingStatement } from "@/types/domain";
import { MOCK_STORE } from "./store";

export const MOCK_CURRENT_STATEMENT: BillingStatement = {
  id: "stmt-2026-05",
  month: "May 2026",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-31",
  verifiedVisits: 287,
  perVisitFee: MOCK_STORE.perVisitFee,
  amountOwed: 861.0,
  customerSpend: 10906.0,
  status: "draft",
};

export const MOCK_BILLING_HISTORY: BillingStatement[] = [
  {
    id: "stmt-2026-04",
    month: "April 2026",
    periodStart: "2026-04-01",
    periodEnd: "2026-04-30",
    verifiedVisits: 326,
    perVisitFee: MOCK_STORE.perVisitFee,
    amountOwed: 978.0,
    customerSpend: 12388.0,
    status: "paid",
    issuedAt: "2026-05-01",
    paidAt: "2026-05-08",
  },
  {
    id: "stmt-2026-03",
    month: "March 2026",
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
    verifiedVisits: 295,
    perVisitFee: MOCK_STORE.perVisitFee,
    amountOwed: 885.0,
    customerSpend: 11210.0,
    status: "paid",
    issuedAt: "2026-04-01",
    paidAt: "2026-04-07",
  },
  {
    id: "stmt-2026-02",
    month: "February 2026 (partial)",
    periodStart: "2026-02-12",
    periodEnd: "2026-02-28",
    verifiedVisits: 188,
    perVisitFee: MOCK_STORE.perVisitFee,
    amountOwed: 564.0,
    customerSpend: 7144.0,
    status: "paid",
    issuedAt: "2026-03-01",
    paidAt: "2026-03-09",
  },
];
