"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { CustomItem, CustomItemEditableFields } from "@/types/item";

export type CustomItemInput = Partial<Omit<CustomItem, "id" | "user_id" | "created_at" | "updated_at">> & {
  name: string;
};

/**
 * Custom (non-book) items live in their own table — no bookshelves, reading,
 * or calendar wiring, unlike useBooks. Mirrors useBooks' shape (loading,
 * optimistic update-with-rollback) so the rest of the app feels consistent.
 */
export function useCustomItems(userId: string | undefined) {
  const supabase = createSupabaseBrowserClient();
  const [items, setItems] = useState<CustomItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("custom_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setItems((data as CustomItem[]) ?? []);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function addItem(input: CustomItemInput) {
    if (!userId) return { error: new Error("Not authenticated") };

    const { data, error } = await supabase
      .from("custom_items")
      .insert({ ...input, user_id: userId })
      .select("*")
      .single();

    if (!error && data) {
      setItems((prev) => [data as CustomItem, ...prev]);
    }
    return { error, item: data as CustomItem | undefined };
  }

  async function updateItem(itemId: string, updates: CustomItemEditableFields) {
    const previous = items;
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, ...updates } : i)));

    const { error } = await supabase.from("custom_items").update(updates).eq("id", itemId);
    if (error) {
      setItems(previous);
    }
    return { error };
  }

  async function removeItem(itemId: string) {
    const { error } = await supabase.from("custom_items").delete().eq("id", itemId);
    if (!error) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    }
    return { error };
  }

  return { items, loading, refetch: fetchItems, addItem, updateItem, removeItem };
}
