"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Settings2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useShelves } from "@/hooks/useShelves";
import { useBooks } from "@/hooks/useBooks";
import { BookshelfView } from "@/components/shelves/BookshelfView";
import { ShelfBuilder } from "@/components/shelves/ShelfBuilder";
import { BookDetailsPanel } from "@/components/books/BookDetailsPanel";
import { AddBookDialog } from "@/components/books/AddBookDialog";
import { Button } from "@/components/ui/button";
import type { UserBook } from "@/types/book";

export default function BookshelfDetailPage() {
  const params = useParams<{ id: string }>();
  const supabase = createSupabaseBrowserClient();
  const [userId, setUserId] = useState<string | undefined>();
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<UserBook | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, [supabase]);

  const { bookshelves, loading, refetch, updateShelf, addRow, removeRow, moveBookPosition } = useShelves(userId);
  const { updateStatus, updateLendable, removeBook } = useBooks(userId);

  const bookshelf = bookshelves.find((s) => s.id === params.id);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading bookshelf...</p>;
  }

  if (!bookshelf) {
    return <p className="text-sm text-zinc-500">Bookshelf not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/bookshelves" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200">
          <ArrowLeft className="h-4 w-4" /> All bookshelves
        </Link>
        <div className="flex gap-2">
          <AddBookDialog bookshelves={bookshelves} onAdded={refetch} />
          <Button variant={editing ? "secondary" : "outline"} onClick={() => setEditing((e) => !e)}>
            <Settings2 className="mr-1.5 h-4 w-4" /> {editing ? "Done editing" : "Edit shelf"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <BookshelfView
          bookshelf={bookshelf}
          onMoveBook={async (target) => {
            await moveBookPosition(target.positionId, {
              shelfRowId: target.shelfRowId,
              bookshelfId: target.bookshelfId,
              positionIndex: target.positionIndex,
            });
          }}
          onBookClick={setSelected}
        />

        {editing && (
          <ShelfBuilder
            bookshelf={bookshelf}
            onUpdateDims={(updates) => updateShelf(bookshelf.id, updates)}
            onAddRow={() => addRow(bookshelf.id)}
            onRemoveRow={removeRow}
          />
        )}
      </div>

      <BookDetailsPanel
        userBook={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onStatusChange={async (status) => {
          if (!selected) return;
          await updateStatus(selected.id, status);
          setSelected({ ...selected, status });
        }}
        onLendableChange={async (isLendable) => {
          if (!selected) return;
          await updateLendable(selected.id, isLendable);
          setSelected({ ...selected, is_lendable: isLendable });
        }}
        onRemove={async () => {
          if (!selected) return;
          await removeBook(selected.id);
          await refetch();
          setSelected(null);
        }}
      />
    </div>
  );
}
