-- MGCollections schema
-- Designed for future expansion beyond books (collection_type stays implicit on `books` for now)
-- and for a future Three.js 3D room reusing book_positions x/y/z + rotation data.

create extension if not exists "pgcrypto";

-- =========================================
-- profiles
-- =========================================
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_username on profiles (username);

-- =========================================
-- books (shared catalog, not user-owned)
-- =========================================
create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  external_source text,
  external_id text,
  title text not null,
  authors text[] not null default '{}',
  isbn_10 text,
  isbn_13 text,
  publisher text,
  published_date text,
  description text,
  page_count integer,
  cover_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_books_isbn_13 on books (isbn_13);
create index if not exists idx_books_isbn_10 on books (isbn_10);
create unique index if not exists idx_books_external on books (external_source, external_id);

-- =========================================
-- user_books (a user's copy of a book)
-- =========================================
create table if not exists user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  book_id uuid not null references books (id) on delete cascade,
  status text not null default 'owned_unread'
    check (status in ('owned_unread', 'reading', 'on_hold', 'finished', 'wishlist', 'borrowed', 'lent_out', 'dnf')),
  condition text,
  notes text,
  is_lendable boolean not null default true,
  date_added timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_user_books_user_id on user_books (user_id);
create index if not exists idx_user_books_book_id on user_books (book_id);
create index if not exists idx_user_books_status on user_books (status);

-- Personal inventory fields. These are user-specific (a given physical copy's
-- price, condition, etc.), so they live on user_books rather than the shared
-- books catalog. `condition` and `notes` already existed (unused until now);
-- this just adds the remaining inventory columns alongside them.
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

-- Edit Book fields: rating, favorite, tags, and the "On Hold" status.
alter table user_books add column if not exists rating integer check (rating between 1 and 5);
alter table user_books add column if not exists favorite boolean not null default false;
alter table user_books add column if not exists tags text[] not null default '{}';

alter table user_books drop constraint if exists user_books_status_check;
alter table user_books add constraint user_books_status_check
  check (status in ('owned_unread', 'reading', 'on_hold', 'finished', 'wishlist', 'borrowed', 'lent_out', 'dnf'));

-- =========================================
-- bookshelves
-- =========================================
create table if not exists bookshelves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  description text,
  width_cm integer not null default 90,
  height_cm integer not null default 180,
  theme text not null default 'walnut',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_bookshelves_user_id on bookshelves (user_id);

-- Shelf-level public sharing control. Private by default — only shelves
-- explicitly marked 'public' are eligible for the public library; existing
-- shelves backfill to 'private' via this default.
alter table bookshelves add column if not exists visibility text not null default 'private';
do $$
begin
  alter table bookshelves add constraint bookshelves_visibility_check
    check (visibility in ('private', 'public', 'unlisted'));
exception
  when duplicate_object then null;
end $$;

-- =========================================
-- shelf_rows
-- =========================================
create table if not exists shelf_rows (
  id uuid primary key default gen_random_uuid(),
  bookshelf_id uuid not null references bookshelves (id) on delete cascade,
  name text,
  row_index integer not null default 0,
  height_cm integer not null default 30,
  created_at timestamptz not null default now()
);

create index if not exists idx_shelf_rows_bookshelf_id on shelf_rows (bookshelf_id);

-- =========================================
-- book_positions
-- Includes x/y/z + rotation so a future Three.js 3D room can reuse this data directly.
-- =========================================
create table if not exists book_positions (
  id uuid primary key default gen_random_uuid(),
  user_book_id uuid not null references user_books (id) on delete cascade,
  bookshelf_id uuid not null references bookshelves (id) on delete cascade,
  shelf_row_id uuid not null references shelf_rows (id) on delete cascade,
  position_index integer not null default 0,
  position_x numeric not null default 0,
  position_y numeric not null default 0,
  position_z numeric not null default 0,
  rotation_y numeric not null default 0,
  display_width numeric,
  display_height numeric,
  display_depth numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_book_id)
);

create index if not exists idx_book_positions_shelf_row_id on book_positions (shelf_row_id);
create index if not exists idx_book_positions_bookshelf_id on book_positions (bookshelf_id);

-- =========================================
-- borrow_requests
-- =========================================
create table if not exists borrow_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  requester_name text not null,
  requester_email text not null,
  user_book_id uuid not null references user_books (id) on delete cascade,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now()
);

create index if not exists idx_borrow_requests_owner_id on borrow_requests (owner_id);
create index if not exists idx_borrow_requests_user_book_id on borrow_requests (user_book_id);

-- =========================================
-- loans
-- =========================================
create table if not exists loans (
  id uuid primary key default gen_random_uuid(),
  user_book_id uuid not null references user_books (id) on delete cascade,
  owner_id uuid not null references profiles (id) on delete cascade,
  borrower_name text not null,
  borrower_email text,
  borrow_date date not null default current_date,
  due_date date,
  return_date date,
  status text not null default 'active'
    check (status in ('active', 'returned', 'overdue')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_loans_owner_id on loans (owner_id);
create index if not exists idx_loans_user_book_id on loans (user_book_id);

-- =========================================
-- collection_events
-- User-created calendar events. Kept generic (item_type/item_id-free-form
-- metadata) so non-book collection types can reuse this table later.
-- =========================================
create table if not exists collection_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  user_book_id uuid references user_books (id) on delete cascade,
  item_type text not null default 'book',
  event_type text not null
    check (event_type in (
      'added_to_collection', 'started_reading', 'read', 'finished_reading',
      'lent', 'borrowed', 'returned', 'purchased', 'maintenance',
      'warranty_expiry', 'service', 'custom'
    )),
  title text not null,
  description text,
  event_date date not null,
  cover_url text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_collection_events_user_id on collection_events (user_id);
create index if not exists idx_collection_events_user_book_id on collection_events (user_book_id);
create index if not exists idx_collection_events_event_date on collection_events (event_date);

-- =========================================
-- reading_sessions
-- Manual or timer-based reading logs. Each saved session also inserts a
-- 'read' row into collection_events (no schema change needed there).
-- =========================================
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

drop trigger if exists trg_reading_sessions_updated_at on reading_sessions;
create trigger trg_reading_sessions_updated_at
  before update on reading_sessions
  for each row execute function set_updated_at();

-- Progress tracking on user_books, updated whenever a reading session is saved.
alter table user_books add column if not exists current_page integer not null default 0;
alter table user_books add column if not exists last_read_at timestamptz;

-- Flexible categories: free text, independent of item_type, defaults to
-- 'Uncategorized'. Default suggestions live in app code (lib/constants.ts),
-- not as a DB enum/table, so users can type any custom category.
alter table user_books add column if not exists category text not null default 'Uncategorized';
create index if not exists idx_user_books_category on user_books (category);

-- Book-level visibility override. Defaults to inherit_from_shelf so a book's
-- public/private state follows its shelf unless explicitly overridden.
alter table user_books add column if not exists visibility text not null default 'inherit_from_shelf';
do $$
begin
  alter table user_books add constraint user_books_visibility_check
    check (visibility in ('inherit_from_shelf', 'private', 'public'));
exception
  when duplicate_object then null;
end $$;

-- =========================================
-- custom_items
-- Non-book collection items. Separate table — no bookshelves, reading,
-- or calendar events; reuses the same flexible-category concept as books.
-- =========================================
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
  location text,
  warranty_expiry date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_custom_items_user_id on custom_items (user_id);
create index if not exists idx_custom_items_category on custom_items (category);

-- Idempotent for databases that already had custom_items/collection_events
-- created before this column/constraint existed.
alter table custom_items add column if not exists location text;
alter table custom_items add column if not exists warranty_expiry date;
alter table collection_events drop constraint if exists collection_events_event_type_check;
alter table collection_events add constraint collection_events_event_type_check
  check (event_type in (
    'added_to_collection', 'started_reading', 'read', 'finished_reading',
    'lent', 'borrowed', 'returned', 'purchased', 'maintenance',
    'warranty_expiry', 'service', 'custom'
  ));

drop trigger if exists trg_custom_items_updated_at on custom_items;
create trigger trg_custom_items_updated_at
  before update on custom_items
  for each row execute function set_updated_at();

-- Storage bucket for the optional image upload field — public read (same
-- as book covers being public URLs), writes restricted to the owner's
-- own "<user_id>/..." folder.
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

-- =========================================
-- notifications
-- =========================================
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on notifications (user_id);

-- =========================================
-- updated_at trigger for book_positions
-- =========================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_book_positions_updated_at on book_positions;
create trigger trg_book_positions_updated_at
  before update on book_positions
  for each row execute function set_updated_at();

drop trigger if exists trg_collection_events_updated_at on collection_events;
create trigger trg_collection_events_updated_at
  before update on collection_events
  for each row execute function set_updated_at();

-- =========================================
-- auto-create profile on signup
-- =========================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 6)),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =========================================
-- notify owner on new borrow request (bypasses RLS via security definer,
-- so we don't need to expose an open insert policy on notifications)
-- =========================================
create or replace function notify_owner_on_borrow_request()
returns trigger as $$
begin
  insert into public.notifications (user_id, type, title, message)
  values (
    new.owner_id,
    'borrow_request',
    'New borrow request',
    new.requester_name || ' requested to borrow one of your books.'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_on_borrow_request_created on borrow_requests;
create trigger trg_on_borrow_request_created
  after insert on borrow_requests
  for each row execute function notify_owner_on_borrow_request();

-- =========================================
-- Used by the user_books public-visibility policy below. Must be
-- SECURITY DEFINER (bypasses RLS internally) rather than an inline EXISTS
-- subquery in that policy — book_positions' own policy queries user_books
-- back, and an inline subquery here would form an RLS recursion cycle.
-- =========================================
create or replace function is_user_book_on_public_shelf(p_user_book_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from book_positions bp
    join bookshelves b on b.id = bp.bookshelf_id
    where bp.user_book_id = p_user_book_id and b.visibility = 'public'
  );
$$;

-- =========================================
-- Row Level Security
-- =========================================
alter table profiles enable row level security;
alter table books enable row level security;
alter table user_books enable row level security;
alter table bookshelves enable row level security;
alter table shelf_rows enable row level security;
alter table book_positions enable row level security;
alter table borrow_requests enable row level security;
alter table loans enable row level security;
alter table collection_events enable row level security;
alter table reading_sessions enable row level security;
alter table custom_items enable row level security;
alter table notifications enable row level security;

-- ---------- profiles ----------
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (is_public = true or auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- ---------- books (shared catalog) ----------
create policy "Books are viewable by everyone"
  on books for select
  using (true);

create policy "Authenticated users can add books to the catalog"
  on books for insert
  to authenticated
  with check (true);

-- ---------- user_books ----------
create policy "Users can view their own user_books"
  on user_books for select
  using (auth.uid() = user_id);

-- Visible publicly only via an explicit book.visibility='public' override,
-- or (inherit_from_shelf) when its shelf is itself public.
create policy "Public can view user_books via shelf/book visibility"
  on user_books for select
  using (
    exists (
      select 1 from profiles p
      where p.id = user_books.user_id and p.is_public = true
    )
    and (
      user_books.visibility = 'public'
      or (
        user_books.visibility = 'inherit_from_shelf'
        and is_user_book_on_public_shelf(user_books.id)
      )
    )
  );

create policy "Users can insert their own user_books"
  on user_books for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own user_books"
  on user_books for update
  using (auth.uid() = user_id);

create policy "Users can delete their own user_books"
  on user_books for delete
  using (auth.uid() = user_id);

-- ---------- bookshelves ----------
create policy "Users can view their own bookshelves"
  on bookshelves for select
  using (auth.uid() = user_id);

-- Only shelves explicitly marked public — 'private' (default) and
-- 'unlisted' are excluded from public browsing.
create policy "Public can view bookshelves of public profiles"
  on bookshelves for select
  using (
    visibility = 'public'
    and exists (
      select 1 from profiles p
      where p.id = bookshelves.user_id and p.is_public = true
    )
  );

create policy "Users can insert their own bookshelves"
  on bookshelves for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bookshelves"
  on bookshelves for update
  using (auth.uid() = user_id);

create policy "Users can delete their own bookshelves"
  on bookshelves for delete
  using (auth.uid() = user_id);

-- ---------- shelf_rows ----------
create policy "Users can view their own shelf_rows"
  on shelf_rows for select
  using (
    exists (
      select 1 from bookshelves b
      where b.id = shelf_rows.bookshelf_id and b.user_id = auth.uid()
    )
  );

create policy "Public can view shelf_rows of public profiles"
  on shelf_rows for select
  using (
    exists (
      select 1 from bookshelves b
      join profiles p on p.id = b.user_id
      where b.id = shelf_rows.bookshelf_id and b.visibility = 'public' and p.is_public = true
    )
  );

create policy "Users can manage shelf_rows on their own bookshelves"
  on shelf_rows for insert
  with check (
    exists (
      select 1 from bookshelves b
      where b.id = shelf_rows.bookshelf_id and b.user_id = auth.uid()
    )
  );

create policy "Users can update shelf_rows on their own bookshelves"
  on shelf_rows for update
  using (
    exists (
      select 1 from bookshelves b
      where b.id = shelf_rows.bookshelf_id and b.user_id = auth.uid()
    )
  );

create policy "Users can delete shelf_rows on their own bookshelves"
  on shelf_rows for delete
  using (
    exists (
      select 1 from bookshelves b
      where b.id = shelf_rows.bookshelf_id and b.user_id = auth.uid()
    )
  );

-- ---------- book_positions ----------
create policy "Users can view their own book_positions"
  on book_positions for select
  using (
    exists (
      select 1 from user_books ub
      where ub.id = book_positions.user_book_id and ub.user_id = auth.uid()
    )
  );

create policy "Public can view book_positions of public profiles"
  on book_positions for select
  using (
    exists (
      select 1 from user_books ub
      join profiles p on p.id = ub.user_id
      join bookshelves b on b.id = book_positions.bookshelf_id
      where ub.id = book_positions.user_book_id
        and p.is_public = true
        and (
          ub.visibility = 'public'
          or (ub.visibility = 'inherit_from_shelf' and b.visibility = 'public')
        )
    )
  );

create policy "Users can manage their own book_positions"
  on book_positions for insert
  with check (
    exists (
      select 1 from user_books ub
      where ub.id = book_positions.user_book_id and ub.user_id = auth.uid()
    )
  );

create policy "Users can update their own book_positions"
  on book_positions for update
  using (
    exists (
      select 1 from user_books ub
      where ub.id = book_positions.user_book_id and ub.user_id = auth.uid()
    )
  );

create policy "Users can delete their own book_positions"
  on book_positions for delete
  using (
    exists (
      select 1 from user_books ub
      where ub.id = book_positions.user_book_id and ub.user_id = auth.uid()
    )
  );

-- ---------- borrow_requests ----------
create policy "Owners can view borrow requests addressed to them"
  on borrow_requests for select
  using (auth.uid() = owner_id);

create policy "Anyone can create a borrow request"
  on borrow_requests for insert
  with check (true);

create policy "Owners can update borrow requests addressed to them"
  on borrow_requests for update
  using (auth.uid() = owner_id);

-- ---------- loans ----------
create policy "Owners can view their own loans"
  on loans for select
  using (auth.uid() = owner_id);

create policy "Owners can insert their own loans"
  on loans for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their own loans"
  on loans for update
  using (auth.uid() = owner_id);

create policy "Owners can delete their own loans"
  on loans for delete
  using (auth.uid() = owner_id);

-- ---------- collection_events ----------
create policy "Users can view their own collection_events"
  on collection_events for select
  using (auth.uid() = user_id);

create policy "Users can insert their own collection_events"
  on collection_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own collection_events"
  on collection_events for update
  using (auth.uid() = user_id);

create policy "Users can delete their own collection_events"
  on collection_events for delete
  using (auth.uid() = user_id);

-- ---------- reading_sessions ----------
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

-- ---------- custom_items ----------
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

-- ---------- notifications ----------
create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on notifications for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notifications"
  on notifications for delete
  using (auth.uid() = user_id);
