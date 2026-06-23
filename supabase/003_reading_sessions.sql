-- Migration 003: reading sessions + book progress tracking
-- Run this AFTER 002_edit_book_fields.sql.
-- Paste this into the Supabase SQL Editor and run it.
-- Safe to re-run — every statement is idempotent.
--
-- Adds the reading_sessions table (manual or timer-based reading logs) and
-- progress columns on user_books. collection_events already exists (added
-- earlier) and already allows event_type = 'read', so no change is needed
-- there — each saved reading session also inserts a row into it.

create table if not exists reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  user_book_id uuid not null references user_books (id) on delete cascade,
  start_page integer not null check (start_page >= 0),
  end_page integer not null check (end_page >= 0),
  pages_read integer,
  minutes_read integer,
  notes text,
  read_date date not null,
  started_at timestamptz,
  ended_at timestamptz,
  timer_used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reading_sessions_user_id on reading_sessions (user_id);
create index if not exists idx_reading_sessions_user_book_id on reading_sessions (user_book_id);
create index if not exists idx_reading_sessions_read_date on reading_sessions (read_date);

-- set_updated_at() was created by the base schema (used by book_positions /
-- collection_events) — reused here rather than duplicating it.
drop trigger if exists trg_reading_sessions_updated_at on reading_sessions;
create trigger trg_reading_sessions_updated_at
  before update on reading_sessions
  for each row execute function set_updated_at();

alter table reading_sessions enable row level security;

create policy "Users can view their own reading_sessions"
  on reading_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own reading_sessions"
  on reading_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reading_sessions"
  on reading_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own reading_sessions"
  on reading_sessions for delete
  using (auth.uid() = user_id);

alter table user_books add column if not exists current_page integer not null default 0;
alter table user_books add column if not exists last_read_at timestamptz;
