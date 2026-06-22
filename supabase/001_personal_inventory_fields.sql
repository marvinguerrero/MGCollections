-- Migration 001: personal inventory fields on user_books
-- Run this BEFORE 002_edit_book_fields.sql.
-- Paste this into the Supabase SQL Editor and run it.
-- Safe to re-run — every statement is idempotent.
--
-- Adds purchase price/currency/date/store + genre to user_books, and a check
-- constraint on the existing (previously unused) `condition` column. These
-- are user-specific inventory details, so they live on user_books rather
-- than the shared `books` catalog.

alter table user_books add column if not exists purchase_price numeric;
alter table user_books add column if not exists purchase_currency text default 'PHP';
alter table user_books add column if not exists date_bought date;
alter table user_books add column if not exists purchase_location text;
alter table user_books add column if not exists genre text;

do $$
begin
  alter table user_books add constraint user_books_condition_check
    check (condition in ('New', 'Like New', 'Good', 'Fair', 'Poor', 'Damaged'));
exception
  when duplicate_object then null;
end $$;
