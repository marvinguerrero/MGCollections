"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { CalendarEventInput } from "@/hooks/useCalendarEvents";
import { CALENDAR_EVENT_LABELS, EDITABLE_CALENDAR_EVENT_TYPES, type CalendarEvent, type CalendarEventType } from "@/types/calendar";
import type { UserBook } from "@/types/book";

const NO_BOOK_VALUE = "none";

function toDateInputValue(date: string) {
  return date.length >= 10 ? date.slice(0, 10) : date;
}

export function CalendarEventDialog({
  open,
  onOpenChange,
  userBooks,
  defaultDate,
  event,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userBooks: UserBook[];
  defaultDate: Date | null;
  event?: CalendarEvent | null;
  onSubmit: (input: CalendarEventInput) => Promise<{ error: unknown }>;
}) {
  const [userBookId, setUserBookId] = useState<string>(NO_BOOK_VALUE);
  const [eventType, setEventType] = useState<CalendarEventType>("custom");
  const [eventDate, setEventDate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (event) {
      setUserBookId(event.user_book_id ?? NO_BOOK_VALUE);
      setEventType(event.event_type);
      setEventDate(toDateInputValue(event.event_date));
      setTitle(event.title);
      setDescription(event.description ?? "");
    } else {
      setUserBookId(NO_BOOK_VALUE);
      setEventType("custom");
      setEventDate(toDateInputValue((defaultDate ?? new Date()).toISOString()));
      setTitle("");
      setDescription("");
    }
  }, [open, event, defaultDate]);

  function handleSelectBook(value: string | null) {
    if (!value || value === NO_BOOK_VALUE) {
      setUserBookId(NO_BOOK_VALUE);
      return;
    }
    setUserBookId(value);

    const userBook = userBooks.find((ub) => ub.id === value);
    if (userBook?.book?.title) {
      setTitle(userBook.book.title);
    }
  }

  async function handleSubmit() {
    if (!title.trim() || !eventDate) return;
    setSaving(true);

    const userBook = userBookId !== NO_BOOK_VALUE ? userBooks.find((ub) => ub.id === userBookId) : undefined;

    const { error } = await onSubmit({
      user_book_id: userBook?.id,
      item_type: "book",
      event_type: eventType,
      title: title.trim(),
      description: description.trim() || undefined,
      event_date: eventDate,
      cover_url: userBook?.book?.cover_url ?? undefined,
    });

    setSaving(false);
    if (!error) {
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{event ? "Edit event" : "Add event"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Book (optional)</Label>
            <Select value={userBookId} onValueChange={handleSelectBook}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No book" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_BOOK_VALUE}>No book</SelectItem>
                {userBooks.map((ub) => (
                  <SelectItem key={ub.id} value={ub.id}>
                    {ub.book?.title ?? "Untitled"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Event type</Label>
            <Select value={eventType} onValueChange={(v) => setEventType(v as CalendarEventType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EDITABLE_CALENDAR_EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {CALENDAR_EVENT_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-date">Date</Label>
            <Input
              id="event-date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-title">Title</Label>
            <Input id="event-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description">Notes</Label>
            <Textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes"
            />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={saving || !title.trim() || !eventDate}>
            {saving ? "Saving..." : event ? "Save changes" : "Add event"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
