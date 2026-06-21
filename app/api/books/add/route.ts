import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { NormalizedBookResult, ReadingStatus } from "@/types/book";

interface AddBookBody {
  book: NormalizedBookResult;
  status?: ReadingStatus;
  isLendable?: boolean;
  bookshelfId?: string;
  shelfRowId?: string;
  positionIndex?: number;
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: AddBookBody = await request.json();
  const { book, status = "owned_unread", isLendable = true, bookshelfId, shelfRowId, positionIndex = 0 } = body;

  if (!book?.title) {
    return NextResponse.json({ error: "Missing book data" }, { status: 400 });
  }

  let existing = null;
  if (book.isbn_13 || book.isbn_10) {
    const { data } = await supabase
      .from("books")
      .select("*")
      .or(
        [book.isbn_13 ? `isbn_13.eq.${book.isbn_13}` : null, book.isbn_10 ? `isbn_10.eq.${book.isbn_10}` : null]
          .filter(Boolean)
          .join(",")
      )
      .maybeSingle();
    existing = data;
  }

  if (!existing && book.source && book.externalId) {
    const { data } = await supabase
      .from("books")
      .select("*")
      .eq("external_source", book.source)
      .eq("external_id", book.externalId)
      .maybeSingle();
    existing = data;
  }

  let bookRecord = existing;

  if (!bookRecord) {
    const { data: inserted, error: insertError } = await supabase
      .from("books")
      .insert({
        external_source: book.source,
        external_id: book.externalId,
        title: book.title,
        authors: book.authors ?? [],
        isbn_10: book.isbn_10,
        isbn_13: book.isbn_13,
        publisher: book.publisher,
        published_date: book.publishedDate,
        description: book.description,
        page_count: book.pageCount,
        cover_url: book.coverUrl,
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    bookRecord = inserted;
  }

  const { data: userBook, error: userBookError } = await supabase
    .from("user_books")
    .insert({
      user_id: user.id,
      book_id: bookRecord.id,
      status,
      is_lendable: isLendable,
    })
    .select("*")
    .single();

  if (userBookError) {
    return NextResponse.json({ error: userBookError.message }, { status: 500 });
  }

  if (bookshelfId && shelfRowId) {
    const { error: positionError } = await supabase.from("book_positions").insert({
      user_book_id: userBook.id,
      bookshelf_id: bookshelfId,
      shelf_row_id: shelfRowId,
      position_index: positionIndex,
    });

    if (positionError) {
      return NextResponse.json({ error: positionError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ book: bookRecord, userBook });
}
