"use client";

import { Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CalendarEventCard } from "@/components/calendar/CalendarEventCard";
import type { CalendarEvent } from "@/types/calendar";

export function CalendarDayPanel({
  date,
  events,
  open,
  onOpenChange,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
}: {
  date: Date | null;
  events: CalendarEvent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddEvent?: () => void;
  onEditEvent?: (event: CalendarEvent) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 sm:w-96">
        <SheetHeader className="flex-row items-center justify-between border-b border-zinc-800 px-4 py-4">
          <SheetTitle className="text-zinc-100">
            {date?.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </SheetTitle>
          {onAddEvent && (
            <Button size="sm" onClick={onAddEvent}>
              <Plus className="h-4 w-4" /> Add Event
            </Button>
          )}
        </SheetHeader>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {events.length === 0 ? (
            <p className="text-sm text-zinc-500">No activity on this day.</p>
          ) : (
            events.map((event) => (
              <CalendarEventCard key={event.id} event={event} onEdit={onEditEvent} onDelete={onDeleteEvent} />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
