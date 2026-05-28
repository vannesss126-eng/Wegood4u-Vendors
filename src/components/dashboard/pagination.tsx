"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type PaginationProps = {
  /** Zero-indexed current page (matches TanStack Table). */
  currentPage: number;
  totalPages: number;
  totalRows: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
};

const DEFAULT_SIZES = [10, 25, 50, 100];

/** Build the page-number / ellipsis sequence shown in the nav. */
function buildPageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i);
  }
  const result: (number | "ellipsis")[] = [];
  const neighbors = new Set<number>([0, total - 1, current - 1, current, current + 1]);
  let last = -2;
  for (let i = 0; i < total; i++) {
    if (!neighbors.has(i)) continue;
    if (i - last > 1) result.push("ellipsis");
    result.push(i);
    last = i;
  }
  return result;
}

export function Pagination({
  currentPage,
  totalPages,
  totalRows,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_SIZES,
}: PaginationProps) {
  const first = totalRows === 0 ? 0 : currentPage * pageSize + 1;
  const last = Math.min(totalRows, (currentPage + 1) * pageSize);
  const pageList = buildPageList(currentPage, Math.max(1, totalPages));
  const canPrev = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-bg-soft px-5 py-3.5">
      <div className="text-xs font-medium text-muted-foreground">
        Showing{" "}
        <b className="text-foreground">
          {first} – {last}
        </b>{" "}
        of <b className="text-foreground">{totalRows.toLocaleString("en-MY")}</b>{" "}
        visits
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <PageButton
            disabled={!canPrev}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3 w-3" />
          </PageButton>

          {pageList.map((entry, idx) =>
            entry === "ellipsis" ? (
              <span
                key={`e-${idx}`}
                className="grid h-[30px] min-w-[30px] place-items-center px-2.5 text-xs text-muted-foreground"
              >
                …
              </span>
            ) : (
              <PageButton
                key={entry}
                active={entry === currentPage}
                onClick={() => onPageChange(entry)}
              >
                {entry + 1}
              </PageButton>
            )
          )}

          <PageButton
            disabled={!canNext}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-3 w-3" />
          </PageButton>
        </div>

        <label className="ml-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
          Show
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="cursor-pointer rounded-[7px] border border-border bg-card px-2 py-1 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          per page
        </label>
      </div>
    </div>
  );
}

type PageButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

function PageButton({ active, className, children, ...rest }: PageButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "grid h-[30px] min-w-[30px] place-items-center rounded-[7px] border px-2.5 text-xs font-semibold transition-colors",
        active
          ? "border-primary/30 bg-primary-soft text-primary-deep"
          : "border-border bg-card text-muted-foreground hover:border-primary/20 hover:bg-primary-tint hover:text-primary-deep",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-card disabled:hover:text-muted-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}
