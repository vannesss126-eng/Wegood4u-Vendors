import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ChartCardProps = {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function ChartCard({
  title,
  subtitle,
  right,
  className,
  children,
}: ChartCardProps) {
  const hasHead = Boolean(title || subtitle || right);

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card px-6 py-5 shadow-sm",
        className
      )}
    >
      {hasHead ? (
        <div className="mb-[18px] flex items-start justify-between gap-3">
          <div>
            {title ? (
              <div className="text-sm font-bold text-foreground">{title}</div>
            ) : null}
            {subtitle ? (
              <div className="mt-[3px] text-[11.5px] font-medium text-muted-foreground">
                {subtitle}
              </div>
            ) : null}
          </div>
          {right ?? null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
