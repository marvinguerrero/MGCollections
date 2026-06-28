"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { BookLocation, ReadingStatus, UserBook, UserBookEditableFields } from "@/types/book";

interface RawBookPosition {
  position_index: number;
  bookshelf: { id: string; name: string } | null;
  shelf_row: { id: string; name: string | null; row_index: number } | null;
}

/**
 * Raw shape of a user_books row with its book_positions → bookshelves/shelf_rows
 * join embedded. PostgREST collapses this to a single object (not an array)
 * because book_positions.user_book_id is unique — i.e. a to-one relationship —
 * so we accept either shape here rather than assuming an array.
 */
interface RawUserBookRow extends Omit<UserBook, "location"> {
  book_positions: RawBookPosition[] | RawBookPosition | null;
}

function toLocation(row: RawUserBookRow): BookLocation | null {
  const raw = row.book_positions;
  const position = Array.isArray(raw) ? raw[0] : raw;
  if (!position?.bookshelf || !position.shelf_row) return null;

  return {
    bookshelf_id: position.bookshelf.id,
    bookshelf_name: position.bookshelf.name,
    shelf_row_id: position.shelf_row.id,
    shelf_row_name: position.shelf_row.name,
    row_index: position.shelf_row.row_index,
    position_index: position.position_index,
  };
}

function toUserBook(row: RawUserBookRow): UserBook {
  const location = toLocation(row);

  // TEMPORARY debug instrumentation — remove once location display is confirmed fixed.
  console.log("Selected collection book", row);
  console.log("Book position", row.book_positions);
  console.log("Mapped location", location);

  const { book_positions, ...rest } = row;
  void book_positions; // only used via toLocation(row) above — destructured here just to exclude it from `rest`
  return { ...rest, location };
}

export function useBooks(userId: string | undefined) {
  const supabase = createSupabaseBrowserClient();
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    if (!userId) {
      setUserBooks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("user_books")
      .select(
        "*, book:books(*), book_positions(position_index, bookshelf:bookshelves(id, name), shelf_row:shelf_rows(id, name, row_index))"
      )
      .eq("user_id", userId)
      .order("date_added", { ascending: false });

    setUserBooks(((data as RawUserBookRow[]) ?? []).map(toUserBook));
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  async function updateStatus(userBookId: string, status: ReadingStatus) {
    const { error } = await supabase.from("user_books").update({ status }).eq("id", userBookId);
    if (!error) {
      setUserBooks((prev) => prev.map((ub) => (ub.id === userBookId ? { ...ub, status } : ub)));
    }
    return { error };
  }

  async function updateLendable(userBookId: string, isLendable: boolean) {
    const { error } = await supabase.from("user_books").update({ is_lendable: isLendable }).eq("id", userBookId);
    if (!error) {
      setUserBooks((prev) => prev.map((ub) => (ub.id === userBookId ? { ...ub, is_lendable: isLendable } : ub)));
    }
    return { error };
  }

  async function removeBook(userBookId: string) {
    const { error } = await supabase.from("user_books").delete().eq("id", userBookId);
    if (!error) {
      setUserBooks((prev) => prev.filter((ub) => ub.id !== userBookId));
    }
    return { error };
  }

  /**
   * Used by EditBookDialog to save any combination of personal fields in one
   * request. Applies the change to local state immediately and rolls back
   * if the write fails, so the UI never needs a full refetch/reload.
   */
  async function updatePersonalDetails(userBookId: string, updates: UserBookEditableFields) {
    const previous = userBooks;
    setUserBooks((prev) => prev.map((ub) => (ub.id === userBookId ? { ...ub, ...updates } : ub)));

    const { error } = await supabase.from("user_books").update(updates).eq("id", userBookId);
    if (error) {
      setUserBooks(previous);
    }
    return { error };
  }

  /**
   * Merges a partial update into local state without writing to Supabase —
   * for callers (like reading sessions) that already persisted the change
   * server-side and just need the UI to reflect it without a refetch.
   */
  function patchLocal(userBookId: string, updates: Partial<UserBook>) {
    setUserBooks((prev) => prev.map((ub) => (ub.id === userBookId ? { ...ub, ...updates } : ub)));
  }

  return {
    userBooks,
    loading,
    refetch: fetchBooks,
    updateStatus,
    updateLendable,
    updatePersonalDetails,
    patchLocal,
    removeBook,
  };
}
