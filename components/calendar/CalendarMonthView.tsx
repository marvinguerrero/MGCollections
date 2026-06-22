"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { CalendarDisplayMode, CalendarEvent } from "@/types/calendar";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function buildMonthGrid(year: number, month: number) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    return date;
  });
}

export function CalendarMonthView({
  year,
  month,
  events,
  displayMode,
  selectedDate,
  onSelectDate,
}: {
  year: number;
  month: number;
  events: CalendarEvent[];
  displayMode: CalendarDisplayMode;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}) {
  const days = buildMonthGrid(year, month);
  const today = new Date();

  const eventsByDay = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = toDateKey(new Date(event.event_date));
    eventsByDay.set(key, [...(eventsByDay.get(key) ?? []), event]);
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
      <div className="grid grid-cols-7 border-b border-zinc-800 text-center text-xs font-medium text-zinc-500">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((date) => {
          const key = toDateKey(date);
          const dayEvents = eventsByDay.get(key) ?? [];
          const isCurrentMonth = date.getMonth() === month;
          const isToday = toDateKey(date) === toDateKey(today);
          const isSelected = selectedDate && toDateKey(date) === toDateKey(selectedDate);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(date)}
              className={cn(
                "flex min-h-20 flex-col gap-1 border-b border-r border-zinc-800 p-1.5 text-left transition-colors hover:bg-zinc-900 sm:min-h-28 sm:p-2",
                !isCurrentMonth && "bg-zinc-950/60 text-zinc-600",
                isSelected && "bg-zinc-800"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs",
                  isToday ? "bg-zinc-50 font-semibold text-zinc-900" : "text-zinc-400"
                )}
              >
                {date.getDate()}
              </span>

              {dayEvents.length > 0 && (
                <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                  {displayMode === "minimal" && (
                    <span className="inline-flex w-fit items-center rounded-full bg-zinc-700 px-1.5 py-0.5 text-[10px] font-medium text-zinc-100">
                      {dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}
                    </span>
                  )}

                  {displayMode === "covers" && (
                    <div className="flex flex-wrap gap-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div key={event.id} className="relative h-8 w-6 flex-shrink-0 overflow-hidden rounded bg-zinc-800">
                          {event.cover_url && (
                            <Image src={event.cover_url} alt={event.title} fill className="object-cover" unoptimized />
                          )}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-zinc-500">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}

                  {displayMode === "detailed" && (
                    <div className="flex flex-col gap-0.5">
                      {dayEvents.slice(0, 2).map((event) => (
                        <span key={event.id} className="truncate text-[10px] text-zinc-300">
                          {event.title}
                        </span>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[10px] text-zinc-500">+{dayEvents.length - 2} more</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
