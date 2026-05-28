"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Eye, User } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { queryVisits } from "@/lib/mock/visits";
import type { DateRangePreset, Gender, Visit } from "@/types/domain";

import { PageHeader } from "@/components/dashboard/page-header";
import {
  FilterBar,
  FilterSummary,
  type ChipOption,
  type StatusFilterValue,
} from "@/components/dashboard/filter-bar";
import { DataTable } from "@/components/dashboard/data-table";
import { Pagination } from "@/components/dashboard/pagination";
import { StatusPill } from "@/components/dashboard/status-pill";

const RANGE_OPTIONS: ChipOption<DateRangePreset>[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "3m", label: "3 months" },
  { value: "custom", label: "Custom" },
];

const RANGE_LABEL: Record<DateRangePreset, string> = {
  today: "Today",
  "7d": "7 days",
  "30d": "30 days",
  "3m": "3 months",
  custom: "Custom (all-time)",
};

const STATUS_LABEL: Record<StatusFilterValue, string> = {
  all: "All",
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
};

const GENDER_LABEL: Record<Gender, string> = {
  female: "Female",
  male: "Male",
  other: "Other",
};

const DEFAULT_RANGE: DateRangePreset = "30d";
const DEFAULT_STATUS: StatusFilterValue = "approved";

export default function VisitsPage() {
  const [range, setRange] = useState<DateRangePreset>(DEFAULT_RANGE);
  const [status, setStatus] = useState<StatusFilterValue>(DEFAULT_STATUS);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // queryVisits mirrors the future Supabase call shape — Pass 2 swaps its
  // implementation; this component code stays unchanged.
  const filtered = useMemo<Visit[]>(
    () => queryVisits({ range, status, search }),
    [range, status, search]
  );

  const totals = useMemo(() => {
    const totalRevenue = filtered.reduce((a, v) => a + v.totalAmount, 0);
    const avgPerVisit = filtered.length ? totalRevenue / filtered.length : 0;
    return { totalRevenue, avgPerVisit };
  }, [filtered]);

  const columns = useMemo<ColumnDef<Visit, unknown>[]>(
    () => [
      {
        id: "visitId",
        header: "Visit ID",
        size: 90,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-muted-foreground">
            #{row.original.id}
          </span>
        ),
      },
      {
        accessorKey: "verifiedAt",
        header: "When",
        size: 170,
        sortingFn: "datetime",
        cell: ({ row }) => {
          const dt = new Date(row.original.verifiedAt);
          return (
            <div>
              <div className="font-semibold text-foreground">
                {format(dt, "MMM d, yyyy")}
              </div>
              <div className="mt-0.5 text-[11.5px] font-medium text-text-dim">
                {format(dt, "HH:mm")}
              </div>
            </div>
          );
        },
      },
      {
        id: "customer",
        header: "Customer",
        enableSorting: false,
        cell: ({ row }) => {
          const v = row.original;
          return (
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-primary-tint text-primary-deep">
                <User className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="font-semibold text-foreground">
                  {GENDER_LABEL[v.gender]} · {v.age} · {v.city}
                </div>
                <div className="mt-0.5 text-[10.5px] font-medium tracking-[0.02em] text-text-dim">
                  Visit #{v.id}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "totalAmount",
        size: 130,
        header: () => <span className="block w-full text-right">Amount</span>,
        cell: ({ row }) => (
          <div className="text-right font-bold tabular-nums text-foreground">
            <span className="mr-1 text-[11px] font-semibold text-text-dim">
              RM
            </span>
            {row.original.totalAmount.toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 130,
        cell: ({ row }) => <StatusPill status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        size: 56,
        enableSorting: false,
        cell: () => (
          <div className="flex justify-end">
            <button
              type="button"
              title="View receipt"
              onClick={(e) => {
                e.stopPropagation();
                toast.info("Receipt drawer coming in Pass 2.");
              }}
              className="grid h-[30px] w-[30px] place-items-center rounded-[7px] text-muted-foreground transition-colors hover:bg-primary-tint hover:text-primary-deep"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const handleClear = () => {
    setRange(DEFAULT_RANGE);
    setStatus(DEFAULT_STATUS);
    setSearch("");
    setPageIndex(0);
  };

  const handleExport = () => {
    toast.info("CSV export coming in Pass 2.");
  };

  return (
    <div>
      <PageHeader
        title="Visits"
        subtitle="Every verified customer visit at your store — selfie + receipt confirmed."
      />

      <FilterBar
        rangeValue={range}
        rangeOptions={RANGE_OPTIONS}
        onRangeChange={(next) => {
          setRange(next);
          setPageIndex(0);
        }}
        status={status}
        onStatusChange={(next) => {
          setStatus(next);
          setPageIndex(0);
        }}
        search={search}
        onSearchChange={(next) => {
          setSearch(next);
          setPageIndex(0);
        }}
        searchPlaceholder="Search by ID, amount, or visitor attribute…"
        onExport={handleExport}
      />

      <FilterSummary
        count={filtered.length}
        rangeLabel={RANGE_LABEL[range]}
        statusLabel={STATUS_LABEL[status]}
        totalRevenue={totals.totalRevenue}
        avgPerVisit={totals.avgPerVisit}
        onClear={handleClear}
      />

      <DataTable
        columns={columns}
        data={filtered}
        initialSort={[{ id: "verifiedAt", desc: true }]}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        renderPagination={({ pageCount }) => (
          <Pagination
            currentPage={pageIndex}
            totalPages={pageCount}
            totalRows={filtered.length}
            pageSize={pageSize}
            onPageChange={setPageIndex}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPageIndex(0);
            }}
          />
        )}
      />
    </div>
  );
}
