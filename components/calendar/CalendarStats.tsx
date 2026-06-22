import { CalendarDays, BookPlus, BookOpen, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import type { CalendarEvent } from "@/types/calendar";

export function CalendarStats({ events, monthLabel }: { events: CalendarEvent[]; monthLabel: string }) {
  const counts = {
    total: events.length,
    added: events.filter((e) => e.event_type === "added_to_collection").length,
    reading: events.filter((e) => e.event_type === "started_reading").length,
    finished: events.filter((e) => e.event_type === "finished_reading").length,
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard label={`Events in ${monthLabel}`} value={counts.total} icon={CalendarDays} />
      <StatCard label="Added" value={counts.added} icon={BookPlus} />
      <StatCard label="Started Reading" value={counts.reading} icon={BookOpen} />
      <StatCard label="Finished" value={counts.finished} icon={CheckCircle2} />
    </div>
  );
}
