-- Optional local dev seed data.
-- Replace :owner_id with a real auth.users id (create a user via Supabase Auth first,
-- the handle_new_user trigger will create the matching profiles row automatically).

-- Example:
-- update profiles set username = 'demo', display_name = 'Demo Reader', is_public = true
-- where id = :owner_id;

insert into books (external_source, external_id, title, authors, isbn_13, publisher, published_date, page_count, cover_url, description)
values
  ('google', 'demo-1', 'The Hobbit', array['J.R.R. Tolkien'], '9780547928227', 'Houghton Mifflin', '1937', 310, 'https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg', 'A hobbit''s unexpected journey.'),
  ('google', 'demo-2', 'Dune', array['Frank Herbert'], '9780441013593', 'Ace Books', '1965', 412, 'https://covers.openlibrary.org/b/isbn/9780441013593-L.jpg', 'A desert planet, a prophecy, a fall.'),
  ('google', 'demo-3', 'Project Hail Mary', array['Andy Weir'], '9780593135204', 'Ballantine Books', '2021', 496, 'https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg', 'A lone astronaut must save humanity.')
on conflict (external_source, external_id) do nothing;

-- After creating a user and a bookshelf manually, you can link demo books with:
-- insert into user_books (user_id, book_id, status)
-- select :owner_id, id, 'owned_unread' from books where external_source = 'google' and external_id = 'demo-1';
