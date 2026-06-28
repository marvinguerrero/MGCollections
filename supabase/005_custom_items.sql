-- Migration 005: custom (non-book) collection items + image storage
-- Run this AFTER 004_flexible_categories.sql.
-- Paste this into the Supabase SQL Editor and run it.
-- Safe to re-run — every statement is idempotent.
--
-- Custom items are intentionally a separate table from user_books — they
-- don't support bookshelves, reading, or calendar events, so there's no
-- shared schema to extend. They DO reuse the same "flexible category"
-- concept (free text, default 'Uncategorized') introduced in migration 004.

create table if not exists custom_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  category text not null default 'Uncategorized',
  brand text,
  model text,
  purchase_price numeric,
  purchase_currency text default 'PHP',
  date_bought date,
  purchase_location text,
  condition text check (condition in ('New', 'Like New', 'Good', 'Fair', 'Poor', 'Damaged')),
  notes text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_custom_items_user_id on custom_items (user_id);
create index if not exists idx_custom_items_category on custom_items (category);

-- set_updated_at() was created by the base schema (used by book_positions /
-- collection_events / reading_sessions) — reused here, not duplicated.
drop trigger if exists trg_custom_items_updated_at on custom_items;
create trigger trg_custom_items_updated_at
  before update on custom_items
  for each row execute function set_updated_at();

alter table custom_items enable row level security;

create policy "Users can view their own custom_items"
  on custom_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own custom_items"
  on custom_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own custom_items"
  on custom_items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own custom_items"
  on custom_items for delete
  using (auth.uid() = user_id);

-- =========================================
-- Storage: item-images bucket for the optional image upload field.
-- Public read (images just render in the UI, same as book covers being
-- public URLs already); writes restricted to files under the owner's own
-- "<user_id>/..." folder.
-- =========================================
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view item images" on storage.objects;
create policy "Public can view item images"
  on storage.objects for select
  using (bucket_id = 'item-images');

drop policy if exists "Users can upload their own item images" on storage.objects;
create policy "Users can upload their own item images"
  on storage.objects for insert
  with check (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update their own item images" on storage.objects;
create policy "Users can update their own item images"
  on storage.objects for update
  using (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own item images" on storage.objects;
create policy "Users can delete their own item images"
  on storage.objects for delete
  using (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);
