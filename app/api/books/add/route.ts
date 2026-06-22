import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { BOOK_CONDITIONS } from "@/types/book";
import type { BookCondition, NormalizedBookResult, ReadingStatus } from "@/types/book";

interface InventoryFields {
  condition?: BookCondition | null;
  notes?: string | null;
  genre?: string | null;
  purchasePrice?: number | string | null;
  purchaseCurrency?: string | null;
  dateBought?: string | null;
  purchaseLocation?: string | null;
}

interface AddBookBody extends InventoryFields {
  book: NormalizedBookResult;
  status?: ReadingStatus;
  isLendable?: boolean;
  bookshelfId?: string;
  shelfRowId?: string;
  positionIndex?: number;
}

/** Blank optional fields must save as null, not empty strings/NaN. */
function normalizeInventoryFields(body: AddBookBody) {
  const { condition, notes, genre, purchasePrice, purchaseCurrency, dateBought, purchaseLocation } = body;

  if (condition && !BOOK_CONDITIONS.includes(condition)) {
    return { error: `Invalid condition: ${condition}` } as const;
  }

  let price: number | null = null;
  if (purchasePrice !== undefined && purchasePrice !== null && purchasePrice !== "") {
    price = typeof purchasePrice === "number" ? purchasePrice : Number(purchasePrice);
    if (!Number.isFinite(price)) {
      return { error: "Purchase price must be numeric" } as const;
    }
  }

  if (dateBought && Number.isNaN(new Date(dateBought).getTime())) {
    return { error: "Date bought must be a valid date" } as const;
  }

  return {
    fields: {
      condition: condition || null,
      notes: notes?.trim() || null,
      genre: genre?.trim() || null,
      purchase_price: price,
      purchase_currency: purchaseCurrency?.trim() || null,
      date_bought: dateBought || null,
      purchase_location: purchaseLocation?.trim() || null,
    },
  } as const;
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

  const normalized = normalizeInventoryFields(body);
  if ("error" in normalized) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
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
      ...normalized.fields,
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
