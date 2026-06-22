"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useBooks } from "@/hooks/useBooks";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { mergeCalendarEvents } from "@/lib/calendarEvents";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { CalendarMonthView } from "@/components/calendar/CalendarMonthView";
import { CalendarDayPanel } from "@/components/calendar/CalendarDayPanel";
import { CalendarStats } from "@/components/calendar/CalendarStats";
import { CalendarEventDialog } from "@/components/calendar/CalendarEventDialog";
import type { CalendarDisplayMode, CalendarEvent } from "@/types/calendar";

const MONTH_FORMATTER = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function CalendarPage() {
  const supabase = createSupabaseBrowserClient();
  const [userId, setUserId] = useState<string | undefined>();
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [displayMode, setDisplayMode] = useState<CalendarDisplayMode>("covers");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, [supabase]);

  const { userBooks, loading: booksLoading } = useBooks(userId);
  const { events: manualEvents, loading: eventsLoading, addEvent, updateEvent, deleteEvent } =
    useCalendarEvents(userId);

  const allEvents = useMemo(() => mergeCalendarEvents(userBooks, manualEvents), [userBooks, manualEvents]);
  const loading = booksLoading || eventsLoading;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthEvents = useMemo(
    () =>
      allEvents.filter((event) => {
        const eventDate = new Date(event.event_date);
        return eventDate.getFullYear() === year && eventDate.getMonth() === month;
      }),
    [allEvents, year, month]
  );

  const selectedDayEvents = useMemo(
    () => (selectedDate ? allEvents.filter((event) => isSameDay(new Date(event.event_date), selectedDate)) : []),
    [allEvents, selectedDate]
  );

  function openAddDialog() {
    setEditingEvent(null);
    setDialogOpen(true);
  }

  function openEditDialog(event: CalendarEvent) {
    setEditingEvent(event);
    setDialogOpen(true);
  }

  async function handleDelete(event: CalendarEvent) {
    const { error } = await deleteEvent(event.id);
    if (error) {
      toast.error("Failed to delete event");
    } else {
      toast.success("Event deleted");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Calendar</h1>
        <p className="text-sm text-zinc-400">A timeline of activity across your collection.</p>
      </div>

      <CalendarStats events={monthEvents} monthLabel={MONTH_FORMATTER.format(viewDate)} />

      <CalendarHeader
        monthLabel={MONTH_FORMATTER.format(viewDate)}
        onPrevMonth={() => setViewDate(new Date(year, month - 1, 1))}
        onNextMonth={() => setViewDate(new Date(year, month + 1, 1))}
        onToday={() => setViewDate(new Date())}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
      />

      {loading ? (
        <p className="text-sm text-zinc-500">Loading your collection activity...</p>
      ) : (
        <CalendarMonthView
          year={year}
          month={month}
          events={allEvents}
          displayMode={displayMode}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      )}

      <CalendarDayPanel
        date={selectedDate}
        events={selectedDayEvents}
        open={!!selectedDate}
        onOpenChange={(open) => !open && setSelectedDate(null)}
        onAddEvent={openAddDialog}
        onEditEvent={openEditDialog}
        onDeleteEvent={handleDelete}
      />

      <CalendarEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userBooks={userBooks}
        defaultDate={selectedDate}
        event={editingEvent}
        onSubmit={async (input) => {
          const { error } = editingEvent ? await updateEvent(editingEvent.id, input) : await addEvent(input);
          if (error) {
            toast.error(editingEvent ? "Failed to update event" : "Failed to add event");
          } else {
            toast.success(editingEvent ? "Event updated" : "Event added");
          }
          return { error };
        }}
      />
    </div>
  );
}
