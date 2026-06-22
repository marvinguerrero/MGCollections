-- Migration 002: rating/favorite/tags + "On Hold" status for user_books
-- Run this AFTER 001_personal_inventory_fields.sql.
-- Paste this into the Supabase SQL Editor and run it.
-- Safe to re-run — every statement is idempotent.
--
-- These are personal/user-specific fields, so they live on user_books rather
-- than the shared `books` catalog. genre/condition/purchase_* were added by
-- 001_personal_inventory_fields.sql; this adds the remaining Edit Book
-- fields (rating, favorite, tags) and extends the status check constraint
-- with a new "on_hold" value.

alter table user_books add column if not exists rating integer check (rating between 1 and 5);
alter table user_books add column if not exists favorite boolean not null default false;
alter table user_books add column if not exists tags text[] not null default '{}';

alter table user_books drop constraint if exists user_books_status_check;
alter table user_books add constraint user_books_status_check
  check (status in ('owned_unread', 'reading', 'on_hold', 'finished', 'wishlist', 'borrowed', 'lent_out', 'dnf'));
