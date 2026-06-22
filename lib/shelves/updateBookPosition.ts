import type { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type SupabaseBrowserClient = ReturnType<typeof createSupabaseBrowserClient>;

interface PositionTarget {
  id: string;
  bookshelfId: string;
  shelfRowId: string;
  positionIndex: number;
}

/** Updates exactly one book_positions row — used for moves into an empty slot. */
export async function persistBookMove(supabase: SupabaseBrowserClient, target: PositionTarget) {
  const { error } = await supabase
    .from("book_positions")
    .update({
      bookshelf_id: target.bookshelfId,
      shelf_row_id: target.shelfRowId,
      position_index: target.positionIndex,
    })
    .eq("id", target.id);
  return error;
}

/** Updates the two affected book_positions rows for a swap — never touches anything else. */
export async function persistBookSwap(
  supabase: SupabaseBrowserClient,
  a: PositionTarget,
  b: PositionTarget
) {
  const [resA, resB] = await Promise.all([
    supabase
      .from("book_positions")
      .update({ bookshelf_id: a.bookshelfId, shelf_row_id: a.shelfRowId, position_index: a.positionIndex })
      .eq("id", a.id),
    supabase
      .from("book_positions")
      .update({ bookshelf_id: b.bookshelfId, shelf_row_id: b.shelfRowId, position_index: b.positionIndex })
      .eq("id", b.id),
  ]);
  return resA.error ?? resB.error ?? null;
}
