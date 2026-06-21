import { cn } from "@/lib/utils";
import { STATUS_BADGE_STYLES } from "@/lib/constants";
import { READING_STATUS_LABELS, type ReadingStatus } from "@/types/book";

export function BookStatusBadge({ status, className }: { status: ReadingStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_BADGE_STYLES[status],
        className
      )}
    >
      {READING_STATUS_LABELS[status]}
    </span>
  );
}
