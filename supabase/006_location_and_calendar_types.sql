-- Migration 006: location/warranty on custom_items + wider calendar event types
-- Run this AFTER 005_custom_items.sql.
-- Paste this into the Supabase SQL Editor and run it.
-- Safe to re-run — every statement is idempotent.
--
-- Part of the "location-first" + "generic timeline" architecture refactor:
-- a free-text `location` column now (e.g. "Bedroom Closet") so item details
-- can show/edit where something lives, without yet building the full
-- Home > Room > Storage > Container hierarchy — that can layer on top of
-- this column later (e.g. by parsing/migrating it into structured rows)
-- without another schema rewrite. `warranty_expiry` backs the "Warranty
-- Expiring" Home widget and the warranty_expiry calendar event type, which
-- already existed in app code but was never reachable.

alter table custom_items add column if not exists location text;
alter table custom_items add column if not exists warranty_expiry date;

-- collection_events.event_type only allowed a subset of the event types the
-- app's CalendarEventType already defines — widen it to match, so calendar
-- events for non-reading activity (purchases, maintenance, warranty) can
-- actually be saved.
alter table collection_events drop constraint if exists collection_events_event_type_check;
alter table collection_events add constraint collection_events_event_type_check
  check (event_type in (
    'added_to_collection', 'started_reading', 'read', 'finished_reading',
    'lent', 'borrowed', 'returned', 'purchased', 'maintenance',
    'warranty_expiry', 'service', 'custom'
  ));
