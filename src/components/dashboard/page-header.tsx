"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CalendarDays, Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-[26px] flex items-end justify-between gap-4">
      <div>
        <h1 className="m-0 text-[26px] font-bold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-[13px] font-medium text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ?? null}
    </div>
  );
}

/* ============================================================
   PeriodPill — static label variant (no dropdown).
   Used as a placeholder when no period switching is wired.
   ============================================================ */
type PeriodPillProps = {
  children: ReactNode;
};

export function PeriodPill({ children }: PeriodPillProps) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-[12.5px] font-semibold text-foreground transition-colors hover:border-border-hi"
    >
      <CalendarDays className="h-3.5 w-3.5 text-primary" />
      {children}
      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );
}

/* ============================================================
   PeriodPicker — clickable dropdown variant.
   Custom popover (no shadcn dropdown dep) with click-outside
   + Escape-to-close.
   ============================================================ */
export type PeriodOption = {
  value: string;
  label: string;
  disabled?: boolean;
  note?: string;       // small sub-text inside the dropdown row
};

type PeriodPickerProps = {
  value: string;
  options: PeriodOption[];
  onChange: (value: string) => void;
};

export function PeriodPicker({ value, options, onChange }: PeriodPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Close on click-outside + Escape.
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

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-2 rounded-[10px] border bg-card px-3.5 py-2.5 text-[12.5px] font-semibold text-foreground transition-colors",
          open ? "border-primary" : "border-border hover:border-border-hi"
        )}
      >
        <CalendarDays className="h-3.5 w-3.5 text-primary" />
        {selected?.label ?? value}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-50 mt-2 w-[200px] overflow-hidden rounded-[10px] border border-border bg-card shadow-md"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled || undefined}
                onClick={() => {
                  if (option.disabled) return;
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex cursor-pointer items-start gap-2 px-3 py-2.5 text-[12.5px] transition-colors",
                  isSelected
                    ? "bg-primary-soft/60 text-primary-deep"
                    : "text-foreground hover:bg-bg-soft",
                  option.disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <Check
                  className={cn(
                    "mt-0.5 h-3.5 w-3.5 flex-shrink-0",
                    isSelected ? "text-primary-deep" : "text-transparent"
                  )}
                />
                <div className="flex-1">
                  <div className={cn("font-semibold", isSelected && "text-primary-deep")}>
                    {option.label}
                  </div>
                  {option.note ? (
                    <div className="mt-0.5 text-[10.5px] font-medium text-text-dim">
                      {option.note}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
