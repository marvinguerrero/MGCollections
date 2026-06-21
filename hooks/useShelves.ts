"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { BookshelfWithRows, ShelfTheme } from "@/types/shelf";
import { DEFAULT_ROW_HEIGHT_CM, DEFAULT_SHELF_HEIGHT_CM, DEFAULT_SHELF_WIDTH_CM } from "@/lib/constants";

export function useShelves(userId: string | undefined) {
  const supabase = createSupabaseBrowserClient();
  const [bookshelves, setBookshelves] = useState<BookshelfWithRows[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShelves = useCallback(async () => {
    if (!userId) {
      setBookshelves([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: shelves } = await supabase
      .from("bookshelves")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });

    if (!shelves) {
      setBookshelves([]);
      setLoading(false);
      return;
    }

    const shelfIds = shelves.map((s) => s.id);

    const { data: rows } = await supabase
      .from("shelf_rows")
      .select("*")
      .in("bookshelf_id", shelfIds)
      .order("row_index", { ascending: true });

    const rowIds = (rows ?? []).map((r) => r.id);

    const { data: positions } = rowIds.length
      ? await supabase
          .from("book_positions")
          .select("*, user_book:user_books(*, book:books(*))")
          .in("shelf_row_id", rowIds)
          .order("position_index", { ascending: true })
      : { data: [] };

    const result: BookshelfWithRows[] = shelves.map((shelf) => ({
      ...shelf,
      rows: (rows ?? [])
        .filter((row) => row.bookshelf_id === shelf.id)
        .map((row) => ({
          ...row,
          positions: (positions ?? []).filter((p) => p.shelf_row_id === row.id),
        })),
    }));

    setBookshelves(result);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    fetchShelves();
  }, [fetchShelves]);

  async function createShelf(input: { name: string; description?: string; theme?: ShelfTheme; rowCount?: number }) {
    if (!userId) return { error: new Error("Not authenticated") };

    const { data: shelf, error } = await supabase
      .from("bookshelves")
      .insert({
        user_id: userId,
        name: input.name,
        description: input.description ?? null,
        theme: input.theme ?? "walnut",
        width_cm: DEFAULT_SHELF_WIDTH_CM,
        height_cm: DEFAULT_SHELF_HEIGHT_CM,
        sort_order: bookshelves.length,
      })
      .select("*")
      .single();

    if (error || !shelf) return { error };

    const rowCount = input.rowCount ?? 4;
    const rowsToInsert = Array.from({ length: rowCount }, (_, i) => ({
      bookshelf_id: shelf.id,
      row_index: i,
      height_cm: DEFAULT_ROW_HEIGHT_CM,
    }));

    await supabase.from("shelf_rows").insert(rowsToInsert);
    await fetchShelves();
    return { error: null, shelf };
  }

  async function updateShelf(shelfId: string, updates: Partial<{ name: string; description: string | null; width_cm: number; height_cm: number; theme: string }>) {
    const { error } = await supabase.from("bookshelves").update(updates).eq("id", shelfId);
    if (!error) await fetchShelves();
    return { error };
  }

  async function deleteShelf(shelfId: string) {
    const { error } = await supabase.from("bookshelves").delete().eq("id", shelfId);
    if (!error) await fetchShelves();
    return { error };
  }

  async function addRow(bookshelfId: string) {
    const shelf = bookshelves.find((s) => s.id === bookshelfId);
    const nextIndex = shelf ? shelf.rows.length : 0;

    const { error } = await supabase.from("shelf_rows").insert({
      bookshelf_id: bookshelfId,
      row_index: nextIndex,
      height_cm: DEFAULT_ROW_HEIGHT_CM,
    });
    if (!error) await fetchShelves();
    return { error };
  }

  async function removeRow(rowId: string) {
    const { error } = await supabase.from("shelf_rows").delete().eq("id", rowId);
    if (!error) await fetchShelves();
    return { error };
  }

  async function moveBookPosition(
    positionId: string,
    target: { shelfRowId: string; bookshelfId: string; positionIndex: number }
  ) {
    const { error } = await supabase
      .from("book_positions")
      .update({
        shelf_row_id: target.shelfRowId,
        bookshelf_id: target.bookshelfId,
        position_index: target.positionIndex,
      })
      .eq("id", positionId);

    if (!error) await fetchShelves();
    return { error };
  }

  return {
    bookshelves,
    loading,
    refetch: fetchShelves,
    createShelf,
    updateShelf,
    deleteShelf,
    addRow,
    removeRow,
    moveBookPosition,
  };
}
