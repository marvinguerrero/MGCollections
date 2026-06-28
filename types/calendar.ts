export type CalendarEventType =
  | "added_to_collection"
  | "started_reading"
  | "read"
  | "finished_reading"
  | "lent"
  | "borrowed"
  | "returned"
  | "purchased"
  | "maintenance"
  | "warranty_expiry"
  | "service"
  | "custom";

/**
 * "user_book"/"custom_item" events are derived on the fly from their source
 * table and have no row in collection_events, so they can't be edited or
 * deleted. "collection_event" events are real rows owned by the user.
 */
export type CalendarEventSource = "user_book" | "custom_item" | "collection_event";

export interface CalendarEvent {
  id: string;
  item_type: string;
  item_id: string;
  event_type: CalendarEventType;
  title: string;
  description?: string;
  event_date: string;
  cover_url?: string;
  metadata?: Record<string, unknown>;
  source: CalendarEventSource;
  user_book_id?: string;
}

export type CalendarDisplayMode = "minimal" | "covers" | "detailed";

export const CALENDAR_EVENT_LABELS: Record<CalendarEventType, string> = {
  added_to_collection: "Added to Collection",
  started_reading: "Started Reading",
  read: "Read",
  finished_reading: "Finished Reading",
  lent: "Lent Out",
  borrowed: "Borrowed",
  returned: "Returned",
  purchased: "Purchased",
  maintenance: "Maintenance",
  warranty_expiry: "Warranty Expiry",
  service: "Service",
  custom: "Custom",
};

/** Event types selectable in the manual add/edit event form. */
export const EDITABLE_CALENDAR_EVENT_TYPES: CalendarEventType[] = [
  "added_to_collection",
  "started_reading",
  "read",
  "finished_reading",
  "lent",
  "borrowed",
  "returned",
  "purchased",
  "maintenance",
  "warranty_expiry",
  "service",
  "custom",
];
