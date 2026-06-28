-- Migration 007: shelf-level + book-level public sharing controls
-- Run this AFTER 006_location_and_calendar_types.sql.
-- Paste this into the Supabase SQL Editor and run it.
-- Safe to re-run — every statement is idempotent.
--
-- Previously, the public library showed every shelf/book belonging to a
-- public profile, all-or-nothing. This adds per-shelf visibility (private
-- by default) plus a per-book override, so an owner can choose exactly
-- which shelves are public without exposing everything.
--
-- Resolution rule for whether a book is publicly visible:
--   book.visibility = 'public'   -> always visible (even on a private shelf)
--   book.visibility = 'private'  -> always hidden (even on a public shelf)
--   book.visibility = 'inherit_from_shelf' (default) -> visible only if its shelf is public
-- "unlisted" shelves are excluded from public browsing entirely for now
-- (direct-link viewing is a future addition, not built here).

alter table bookshelves add column if not exists visibility text not null default 'private';
do $$
begin
  alter table bookshelves add constraint bookshelves_visibility_check
    check (visibility in ('private', 'public', 'unlisted'));
exception
  when duplicate_object then null;
end $$;

alter table user_books add column if not exists visibility text not null default 'inherit_from_shelf';
do $$
begin
  alter table user_books add constraint user_books_visibility_check
    check (visibility in ('inherit_from_shelf', 'private', 'public'));
exception
  when duplicate_object then null;
end $$;

-- Looked up from a SECURITY DEFINER function (not inline in the user_books
-- policy below) — querying book_positions inline from a user_books policy
-- would recurse, since book_positions' own policy queries user_books back.
-- SECURITY DEFINER functions run as their owner (BYPASSRLS in the SQL
-- Editor), so this lookup skips RLS entirely instead of re-triggering it.
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

-- Re-scope the existing "public profile" policies to also respect the new
-- visibility columns, instead of exposing every shelf/book unconditionally.

drop policy if exists "Public can view bookshelves of public profiles" on bookshelves;
create policy "Public can view bookshelves of public profiles"
  on bookshelves for select
  using (
    visibility = 'public'
    and exists (
      select 1 from profiles p
      where p.id = bookshelves.user_id and p.is_public = true
    )
  );

drop policy if exists "Public can view shelf_rows of public profiles" on shelf_rows;
create policy "Public can view shelf_rows of public profiles"
  on shelf_rows for select
  using (
    exists (
      select 1 from bookshelves b
      join profiles p on p.id = b.user_id
      where b.id = shelf_rows.bookshelf_id and b.visibility = 'public' and p.is_public = true
    )
  );

drop policy if exists "Public can view book_positions of public profiles" on book_positions;
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

drop policy if exists "Public can view lendable/public user_books via owner's public profile" on user_books;
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
