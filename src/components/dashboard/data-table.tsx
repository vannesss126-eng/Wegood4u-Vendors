"use client";

import { type ReactNode, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

export type DataTableProps<T> = {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  initialSort?: SortingState;
  pageIndex: number;
  pageSize: number;
  onPageChange: (index: number) => void;
  /** Slot for pagination controls — rendered inside the card, below the scrollable body. */
  renderPagination?: (info: { pageCount: number }) => ReactNode;
  /** Body scroll cap. Defaults to mockup's `calc(100vh - 443px)`. */
  scrollMaxHeight?: string;
  className?: string;
  emptyState?: ReactNode;
};

const DEFAULT_MAX_HEIGHT = "calc(100vh - 443px)";

export function DataTable<T>({
  columns,
  data,
  initialSort,
  pageIndex,
  pageSize,
  onPageChange,
  renderPagination,
  scrollMaxHeight = DEFAULT_MAX_HEIGHT,
  className,
  emptyState,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(initialSort ?? []);

  const pagination = useMemo(
    () => ({ pageIndex, pageSize }),
    [pageIndex, pageSize]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(pagination) : updater;
      if (next.pageIndex !== pageIndex) onPageChange(next.pageIndex);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  const rows = table.getRowModel().rows;
  const isEmpty = rows.length === 0;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className
      )}
    >
      <div
        className="overflow-y-auto"
        style={{ maxHeight: scrollMaxHeight, minHeight: 320 }}
      >
        <table className="w-full border-collapse text-[13px]">
          <thead className="sticky top-0 z-[5] bg-bg-soft">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDir = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      style={{
                        width:
                          header.getSize() !== 150 ? header.getSize() : undefined,
                      }}
                      className={cn(
                        "px-[18px] py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.08em] transition-colors",
                        "[box-shadow:inset_0_-1px_0_var(--border)]",
                        canSort && "cursor-pointer hover:text-foreground select-none",
                        sortDir ? "text-primary-deep" : "text-muted-foreground"
                      )}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <span className="inline-flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {canSort ? (
                          <SortIcon direction={sortDir} />
                        ) : null}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  {emptyState ?? "No visits match your current filters."}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-bg-soft"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-[18px] py-3.5 align-middle font-medium"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {renderPagination
        ? renderPagination({ pageCount: table.getPageCount() })
        : null}
    </div>
  );
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ChevronUp className="h-3 w-3 text-primary" />;
  if (direction === "desc") return <ChevronDown className="h-3 w-3 text-primary" />;
  return <ChevronsUpDown className="h-3 w-3 text-text-dim" />;
}
