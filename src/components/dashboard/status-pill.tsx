import type { SubmissionStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
};

const STATUS_CLASS: Record<SubmissionStatus, string> = {
  approved: "bg-primary-tint text-primary-deep",
  pending: "bg-amber-soft text-amber",
  rejected: "bg-red-soft text-red",
};

export function StatusPill({ status }: { status: SubmissionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.04em]",
        STATUS_CLASS[status]
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}
