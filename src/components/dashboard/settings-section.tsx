import type { ReactNode } from "react";
import { Clock } from "lucide-react";

import { cn } from "@/lib/utils";

type SettingsSectionProps = {
  title: string;
  subtitle?: string;
  /** Optional amber phase badge — "Phase 5", "Phase K", etc. */
  phaseBadge?: string;
  /** When true the card adds `overflow-hidden` so child rounded corners clip cleanly. */
  flush?: boolean;
  children: ReactNode;
};

export function SettingsSection({
  title,
  subtitle,
  phaseBadge,
  flush,
  children,
}: SettingsSectionProps) {
  return (
    <section className="mb-7">
      <div className="mb-3 flex items-start justify-between gap-3.5">
        <div>
          <h2 className="m-0 text-[15px] font-bold tracking-[-0.01em] text-foreground">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
        {phaseBadge ? <PhaseBadge label={phaseBadge} /> : null}
      </div>

      <div
        className={cn(
          "rounded-xl border border-border bg-card shadow-sm",
          flush && "overflow-hidden"
        )}
      >
        {children}
      </div>
    </section>
  );
}

function PhaseBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/20 bg-amber-soft px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em] text-amber">
      <Clock className="h-3 w-3" strokeWidth={2.5} />
      {label}
    </span>
  );
}
