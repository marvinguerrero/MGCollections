"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { CalendarEvent, CalendarEventType } from "@/types/calendar";

interface CollectionEventRow {
  id: string;
  user_id: string;
  user_book_id: string | null;
  item_type: string;
  event_type: CalendarEventType;
  title: string;
  description: string | null;
  event_date: string;
  cover_url: string | null;
  metadata: Record<string, unknown> | null;
}

export interface CalendarEventInput {
  user_book_id?: string;
  item_type?: string;
  event_type: CalendarEventType;
  title: string;
  description?: string;
  event_date: string;
  cover_url?: string;
  metadata?: Record<string, unknown>;
}

function toCalendarEvent(row: CollectionEventRow): CalendarEvent {
  return {
    id: row.id,
    item_type: row.item_type,
    item_id: row.user_book_id ?? row.id,
    event_type: row.event_type,
    title: row.title,
    description: row.description ?? undefined,
    event_date: row.event_date,
    cover_url: row.cover_url ?? undefined,
    metadata: row.metadata ?? undefined,
    source: "collection_event",
    user_book_id: row.user_book_id ?? undefined,
  };
}

export function useCalendarEvents(userId: string | undefined) {
  const supabase = createSupabaseBrowserClient();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!userId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("collection_events")
      .select("*")
      .eq("user_id", userId)
      .order("event_date", { ascending: false });

    setEvents(((data as CollectionEventRow[]) ?? []).map(toCalendarEvent));
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  async function addEvent(input: CalendarEventInput) {
    if (!userId) return { error: new Error("Not authenticated") };

    const { data, error } = await supabase
      .from("collection_events")
      .insert({ ...input, item_type: input.item_type ?? "book", user_id: userId })
      .select("*")
      .single();

    if (!error && data) {
      setEvents((prev) => [toCalendarEvent(data as CollectionEventRow), ...prev]);
    }
    return { error };
  }

  async function updateEvent(eventId: string, input: CalendarEventInput) {
    const { data, error } = await supabase
      .from("collection_events")
      .update(input)
      .eq("id", eventId)
      .select("*")
      .single();

    if (!error && data) {
      const updated = toCalendarEvent(data as CollectionEventRow);
      setEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)));
    }
    return { error };
  }

  async function deleteEvent(eventId: string) {
    const { error } = await supabase.from("collection_events").delete().eq("id", eventId);
    if (!error) {
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    }
    return { error };
  }

  return { events, loading, refetch: fetchEvents, addEvent, updateEvent, deleteEvent };
}
