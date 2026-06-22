"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useBooks } from "@/hooks/useBooks";
import { useShelves } from "@/hooks/useShelves";
import { useLibrarySearch } from "@/hooks/useLibrarySearch";
import { AddBookDialog } from "@/components/books/AddBookDialog";
import { BookDetailsPanel } from "@/components/books/BookDetailsPanel";
import { BookStatusBadge } from "@/components/books/BookStatusBadge";
import { LibrarySearchBar } from "@/components/books/LibrarySearchBar";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { getSearchHighlightClass } from "@/lib/searchHighlightClasses";
import { cn } from "@/lib/utils";
import { READING_STATUS_LABELS, type ReadingStatus, type UserBook } from "@/types/book";
import { READING_STATUSES } from "@/lib/constants";

export default function CollectionPage() {
  const supabase = createSupabaseBrowserClient();
  const [userId, setUserId] = useState<string | undefined>();
  const [filter, setFilter] = useState<ReadingStatus | "all">("all");
  const [selected, setSelected] = useState<UserBook | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, [supabase]);

  const { userBooks, loading, refetch, updateStatus, updateLendable, removeBook } = useBooks(userId);
  const { bookshelves } = useShelves(userId);
  const search = useLibrarySearch(userBooks, bookshelves);

  const visibleBooks = filter === "all" ? userBooks : userBooks.filter((ub) => ub.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">My Collection</h1>
          <p className="text-sm text-zinc-400">{userBooks.length} book{userBooks.length === 1 ? "" : "s"} total</p>
        </div>
        <AddBookDialog bookshelves={bookshelves} onAdded={refetch} />
      </div>

      <div className="sticky top-0 z-10 bg-zinc-950 pb-3 pt-1">
        <LibrarySearchBar
          query={search.query}
          onQueryChange={search.setQuery}
          onClear={search.clearQuery}
          matchCount={search.matchCount}
          isSearchActive={search.isSearchActive}
          placeholder="Search your collection by title, author, ISBN, or status..."
        />
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as ReadingStatus | "all")}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          {READING_STATUSES.map((s) => (
            <TabsTrigger key={s} value={s}>
              {READING_STATUS_LABELS[s]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading your collection...</p>
      ) : visibleBooks.length === 0 ? (
        <p className="text-sm text-zinc-500">No books in this category yet.</p>
      ) : (
        <>
          {search.hasNoMatches && (
            <p className="text-sm text-zinc-500">No books in this category match your search.</p>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {visibleBooks.map((ub) => {
              const isMatch = search.matchedUserBookIds?.has(ub.id) ?? false;
              return (
                <button
                  key={ub.id}
                  type="button"
                  onClick={() => setSelected(ub)}
                  className={cn(
                    "group relative flex flex-col items-start gap-2 rounded-lg p-2 text-left transition-all duration-300 ease-out hover:bg-zinc-900",
                    getSearchHighlightClass(search.isSearchActive, isMatch)
                  )}
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded bg-zinc-800">
                    {ub.book?.cover_url ? (
                      <Image src={ub.book.cover_url} alt={ub.book.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full items-center justify-center p-2 text-center text-xs text-zinc-500">
                        {ub.book?.title}
                      </div>
                    )}
                  </div>
                  <p className="line-clamp-2 text-xs font-medium text-zinc-200">{ub.book?.title}</p>
                  <BookStatusBadge status={ub.status} />
                </button>
              );
            })}
          </div>
        </>
      )}

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
          setSelected(null);
        }}
      />
    </div>
  );
}
