import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { PublicLibraryHeader } from "@/components/layout/PublicLibraryHeader";
import { PublicLibraryClient } from "./PublicLibraryClient";
import type { BookshelfWithRows } from "@/types/shelf";

export default async function PublicLibraryPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .eq("is_public", true)
    .single();

  if (!profile) {
    notFound();
  }

  const { data: shelves } = await supabase
    .from("bookshelves")
    .select("*")
    .eq("user_id", profile.id)
    .order("sort_order", { ascending: true });

  const shelfIds = (shelves ?? []).map((s) => s.id);

  const { data: rows } = shelfIds.length
    ? await supabase.from("shelf_rows").select("*").in("bookshelf_id", shelfIds).order("row_index", { ascending: true })
    : { data: [] };

  const rowIds = (rows ?? []).map((r) => r.id);

  const { data: positions } = rowIds.length
    ? await supabase
        .from("book_positions")
        .select("*, user_book:user_books(*, book:books(*))")
        .in("shelf_row_id", rowIds)
        .order("position_index", { ascending: true })
    : { data: [] };

  const bookshelves: BookshelfWithRows[] = (shelves ?? []).map((shelf) => ({
    ...shelf,
    rows: (rows ?? [])
      .filter((row) => row.bookshelf_id === shelf.id)
      .map((row) => ({
        ...row,
        positions: (positions ?? []).filter((p) => p.shelf_row_id === row.id),
      })),
  }));

  return (
    <div className="min-h-screen bg-zinc-950">
      <PublicLibraryHeader profile={profile} />
      <PublicLibraryClient
        ownerId={profile.id}
        ownerName={profile.display_name ?? profile.username}
        bookshelves={bookshelves}
      />
    </div>
  );
}
