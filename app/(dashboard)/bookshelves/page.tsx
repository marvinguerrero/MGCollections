"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useShelves } from "@/hooks/useShelves";
import { CreateShelfDialog } from "@/components/shelves/CreateShelfDialog";
import { EditShelfDialog } from "@/components/shelves/EditShelfDialog";
import { SHELF_THEME_STYLES } from "@/lib/constants";

export default function BookshelvesPage() {
  const supabase = createSupabaseBrowserClient();
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, [supabase]);

  const { bookshelves, loading, createShelf, updateShelf, deleteShelf } = useShelves(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">Bookshelves</h1>
          <p className="text-sm text-zinc-400">{bookshelves.length} shelf{bookshelves.length === 1 ? "" : "ves"}</p>
        </div>
        <CreateShelfDialog onCreate={createShelf} />
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading bookshelves...</p>
      ) : bookshelves.length === 0 ? (
        <p className="text-sm text-zinc-500">No bookshelves yet. Create one to start arranging your books.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookshelves.map((shelf) => {
            const theme = SHELF_THEME_STYLES[shelf.theme as keyof typeof SHELF_THEME_STYLES] ?? SHELF_THEME_STYLES.walnut;
            const bookCount = shelf.rows.reduce((sum, row) => sum + row.positions.length, 0);

            return (
              <div
                key={shelf.id}
                className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 transition-colors hover:border-zinc-700"
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
                <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
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
      )}
    </div>
  );
}
