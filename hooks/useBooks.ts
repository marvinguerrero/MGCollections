"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { ReadingStatus, UserBook, UserBookEditableFields } from "@/types/book";

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
      .select("*, book:books(*)")
      .eq("user_id", userId)
      .order("date_added", { ascending: false });

    setUserBooks((data as UserBook[]) ?? []);
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
