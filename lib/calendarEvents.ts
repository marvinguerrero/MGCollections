import type { ReadingStatus, UserBook } from "@/types/book";
import type { CustomItem } from "@/types/item";
import type { CalendarEvent, CalendarEventType } from "@/types/calendar";

const STATUS_EVENT_TYPE: Partial<Record<ReadingStatus, CalendarEventType>> = {
  reading: "started_reading",
  finished: "finished_reading",
  lent_out: "lent",
  borrowed: "borrowed",
};

/**
 * Books have no dedicated event timestamps yet, so every derived event
 * falls back to date_added (or created_at) per the calendar module's
 * read-only, no-new-tables constraint.
 */
export function userBooksToCalendarEvents(userBooks: UserBook[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const ub of userBooks) {
    const eventDate = ub.date_added ?? ub.created_at;
    if (!eventDate) continue;

    const title = ub.book?.title ?? "Untitled";
    const cover_url = ub.book?.cover_url ?? undefined;

    events.push({
      id: `${ub.id}-added_to_collection`,
      item_type: "book",
      item_id: ub.id,
      event_type: "added_to_collection",
      title,
      event_date: eventDate,
      cover_url,
      metadata: { status: ub.status },
      source: "user_book",
      user_book_id: ub.id,
    });

    const statusEventType = STATUS_EVENT_TYPE[ub.status];
    if (statusEventType) {
      events.push({
        id: `${ub.id}-${statusEventType}`,
        item_type: "book",
        item_id: ub.id,
        event_type: statusEventType,
        title,
        event_date: eventDate,
        cover_url,
        metadata: { status: ub.status },
        source: "user_book",
        user_book_id: ub.id,
      });
    }
  }

  return events;
}

/**
 * Custom items have no dedicated event timestamps either — derives
 * "added_to_collection" from created_at, plus "warranty_expiry" when set,
 * mirroring the book-derived approach above so the calendar stays a
 * generic timeline across every collection type.
 */
export function customItemsToCalendarEvents(items: CustomItem[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const item of items) {
    events.push({
      id: `${item.id}-added_to_collection`,
      item_type: "custom_item",
      item_id: item.id,
      event_type: "added_to_collection",
      title: item.name,
      event_date: item.created_at,
      cover_url: item.image_url ?? undefined,
      metadata: { category: item.category },
      source: "custom_item",
    });

    if (item.warranty_expiry) {
      events.push({
        id: `${item.id}-warranty_expiry`,
        item_type: "custom_item",
        item_id: item.id,
        event_type: "warranty_expiry",
        title: item.name,
        description: `Warranty for ${item.name} expires`,
        event_date: item.warranty_expiry,
        cover_url: item.image_url ?? undefined,
        metadata: { category: item.category },
        source: "custom_item",
      });
    }
  }

  return events;
}

/**
 * Combines manually-created collection_events with book- and item-derived
 * events. A book's derived events are only shown when that book has no
 * manual events yet, so a user adding a manual event for a book replaces
 * the auto-generated placeholders for it rather than duplicating them.
 */
export function mergeCalendarEvents(
  userBooks: UserBook[],
  manualEvents: CalendarEvent[],
  customItems: CustomItem[] = []
): CalendarEvent[] {
  const userBookIdsWithManualEvents = new Set(
    manualEvents.map((event) => event.user_book_id).filter((id): id is string => !!id)
  );

  const derivedEvents = userBooksToCalendarEvents(
    userBooks.filter((ub) => !userBookIdsWithManualEvents.has(ub.id))
  );
  const itemEvents = customItemsToCalendarEvents(customItems);

  return [...derivedEvents, ...itemEvents, ...manualEvents];
}
