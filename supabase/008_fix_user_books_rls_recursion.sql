-- Migration 008: fix infinite recursion in user_books RLS (from migration 007)
-- Run this AFTER 007_shelf_book_visibility.sql.
-- Paste this into the Supabase SQL Editor and run it.
-- Safe to re-run — every statement is idempotent.
--
-- Bug: the "Public can view user_books via shelf/book visibility" policy
-- queries book_positions, and book_positions' own policies query user_books
-- back — Postgres detects that cycle and raises "infinite recursion
-- detected in policy for relation user_books" on EVERY query against
-- user_books, including the owner's own authenticated requests (error code
-- 42P17). This was breaking Collection, Loans, and the bookshelf view.
--
-- Fix: move the book_positions lookup into a SECURITY DEFINER function.
-- Such functions run as their owner (the role that creates them in the SQL
-- Editor, which has BYPASSRLS), so the lookup inside it skips RLS entirely
-- instead of re-triggering book_positions' policies — breaking the cycle.

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

drop policy if exists "Public can view user_books via shelf/book visibility" on user_books;
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
