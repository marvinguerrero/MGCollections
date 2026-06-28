-- Migration 004: flexible categories for user_books
-- Run this AFTER 003_reading_sessions.sql.
-- Paste this into the Supabase SQL Editor and run it.
-- Safe to re-run — every statement is idempotent.
--
-- Free-text category, independent of item_type (every row here is a book,
-- but the same `category` concept is meant to be reusable for future
-- non-book collection types). Defaults to 'Uncategorized' so it's never
-- null — existing rows are backfilled automatically via the column default.

alter table user_books add column if not exists category text not null default 'Uncategorized';

create index if not exists idx_user_books_category on user_books (category);
