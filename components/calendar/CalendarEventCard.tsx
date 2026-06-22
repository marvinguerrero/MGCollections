import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CALENDAR_EVENT_LABELS, type CalendarEvent } from "@/types/calendar";

const EVENT_BADGE_STYLES: Record<string, string> = {
  added_to_collection: "bg-zinc-700 text-zinc-100",
  started_reading: "bg-blue-600 text-blue-50",
  read: "bg-indigo-600 text-indigo-50",
  finished_reading: "bg-emerald-600 text-emerald-50",
  lent: "bg-rose-600 text-rose-50",
  borrowed: "bg-amber-600 text-amber-50",
  returned: "bg-teal-600 text-teal-50",
  custom: "bg-purple-600 text-purple-50",
};

export function CalendarEventCard({
  event,
  className,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent;
  className?: string;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
}) {
  const isEditable = event.source === "collection_event";

  return (
    <div className={cn("flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3", className)}>
      <div className="relative h-14 w-10 flex-shrink-0 overflow-hidden rounded bg-zinc-800">
        {event.cover_url ? (
          <Image src={event.cover_url} alt={event.title} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-zinc-500">No cover</div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-medium text-zinc-200">{event.title}</p>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            EVENT_BADGE_STYLES[event.event_type] ?? "bg-zinc-700 text-zinc-100"
          )}
        >
          {CALENDAR_EVENT_LABELS[event.event_type]}
        </span>
        {event.description && <p className="truncate text-xs text-zinc-500">{event.description}</p>}
      </div>

      {isEditable && (onEdit || onDelete) && (
        <div className="flex flex-shrink-0 gap-1">
          {onEdit && (
            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(event)} aria-label="Edit event">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon-sm" onClick={() => onDelete(event)} aria-label="Delete event">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
