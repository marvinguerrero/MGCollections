"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, LockOpen } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useShelves } from "@/hooks/useShelves";
import { useBooks } from "@/hooks/useBooks";
import { useLibrarySearch } from "@/hooks/useLibrarySearch";
import { useBookshelfEditMode } from "@/hooks/useBookshelfEditMode";
import { CreateShelfDialog } from "@/components/shelves/CreateShelfDialog";
import { EditShelfDialog } from "@/components/shelves/EditShelfDialog";
import { LibrarySearchBar } from "@/components/books/LibrarySearchBar";
import { Button } from "@/components/ui/button";
import { getSearchHighlightClass } from "@/lib/searchHighlightClasses";
import { cn } from "@/lib/utils";
import { SHELF_THEME_STYLES } from "@/lib/constants";

export default function BookshelvesPage() {
  const supabase = createSupabaseBrowserClient();
  const [userId, setUserId] = useState<string | undefined>();
  const { isEditMode, toggleEditMode } = useBookshelfEditMode();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, [supabase]);

  const { bookshelves, loading, createShelf, updateShelf, deleteShelf } = useShelves(userId);
  const { userBooks } = useBooks(userId);
  const search = useLibrarySearch(userBooks, bookshelves);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">Bookshelves</h1>
          <p className="text-sm text-zinc-400">{bookshelves.length} shelf{bookshelves.length === 1 ? "" : "ves"}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={isEditMode ? "secondary" : "outline"}
            onClick={toggleEditMode}
            title={
              isEditMode
                ? "Edit Mode — shelves can be renamed or deleted"
                : "Browse Mode — shelf management is locked"
            }
          >
            {isEditMode ? <LockOpen className="mr-1.5 h-4 w-4" /> : <Lock className="mr-1.5 h-4 w-4" />}
            {isEditMode ? "Edit Mode" : "Browse Mode"}
          </Button>
          <CreateShelfDialog onCreate={createShelf} />
        </div>
      </div>

      <div className="sticky top-0 z-10 bg-zinc-950 pb-3 pt-1">
        <LibrarySearchBar
          query={search.query}
          onQueryChange={search.setQuery}
          onClear={search.clearQuery}
          matchCount={search.matchCount}
          isSearchActive={search.isSearchActive}
          placeholder="Search across all your shelves by title, author, ISBN, or status..."
        />
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading bookshelves...</p>
      ) : bookshelves.length === 0 ? (
        <p className="text-sm text-zinc-500">No bookshelves yet. Create one to start arranging your books.</p>
      ) : (
        <>
          {search.hasNoMatches && (
            <p className="text-sm text-zinc-500">No shelves contain a book matching your search.</p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bookshelves.map((shelf) => {
              const theme = SHELF_THEME_STYLES[shelf.theme as keyof typeof SHELF_THEME_STYLES] ?? SHELF_THEME_STYLES.walnut;
              const bookCount = shelf.rows.reduce((sum, row) => sum + row.positions.length, 0);
              const shelfHasMatch = shelf.rows.some((row) =>
                row.positions.some((p) => search.matchedUserBookIds?.has(p.user_book_id))
              );

              return (
                <div
                  key={shelf.id}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 transition-all duration-300 ease-out hover:border-zinc-700",
                    getSearchHighlightClass(search.isSearchActive, shelfHasMatch)
                  )}
                >
                  <Link href={`/bookshelves/${shelf.id}`} className="block p-4 pb-2">
                    <div
                      className="mb-3 flex h-20 items-end gap-1 rounded-md p-2"
                      style={{ backgroundColor: theme.shelf }}
                    >
                      {Array.from({ length: Math.min(shelf.rows.length, 6) }).map((_, i) => (
                        <div key={i} className="h-full flex-1 rounded-sm bg-black/20" />
                      ))}
                    </div>
                    <h3 className="font-medium text-zinc-100">{shelf.name}</h3>
                    <p className="text-xs text-zinc-500">
                      {shelf.rows.length} row{shelf.rows.length === 1 ? "" : "s"} · {bookCount} book{bookCount === 1 ? "" : "s"}
                    </p>
                  </Link>
                  <div
                    className={cn(
                      "absolute right-2 top-2 transition-opacity",
                      isEditMode ? "opacity-100" : "pointer-events-none opacity-0"
                    )}
                  >
                    <EditShelfDialog
                      bookshelf={shelf}
                      onUpdate={(updates) => updateShelf(shelf.id, updates)}
                      onDelete={() => deleteShelf(shelf.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
