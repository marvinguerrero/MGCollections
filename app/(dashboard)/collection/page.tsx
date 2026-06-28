"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MoreVertical, Pencil, LayoutGrid, List as ListIcon, Rows3, Lock, LockOpen } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useBooks } from "@/hooks/useBooks";
import { useShelves } from "@/hooks/useShelves";
import { useCustomItems } from "@/hooks/useCustomItems";
import { useLibrarySearch } from "@/hooks/useLibrarySearch";
import { useBookshelfEditMode } from "@/hooks/useBookshelfEditMode";
import { AddItemDialog } from "@/components/items/AddItemDialog";
import { CustomItemDetailsDialog } from "@/components/items/CustomItemDetailsDialog";
import { BookDetailsPanel } from "@/components/books/BookDetailsPanel";
import { BookStatusBadge } from "@/components/books/BookStatusBadge";
import { LibrarySearchBar } from "@/components/books/LibrarySearchBar";
import { EditBookDialog } from "@/components/books/EditBookDialog";
import { CreateShelfDialog } from "@/components/shelves/CreateShelfDialog";
import { EditShelfDialog } from "@/components/shelves/EditShelfDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { getSearchHighlightClass } from "@/lib/searchHighlightClasses";
import { buildLocation } from "@/lib/shelves/positionUtils";
import { getCategorySuggestions } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { READING_STATUS_LABELS, type ReadingStatus, type UserBook } from "@/types/book";
import type { CustomItem } from "@/types/item";
import { READING_STATUSES, SHELF_THEME_STYLES, UNCATEGORIZED } from "@/lib/constants";

type DisplayMode = "grid" | "list" | "bookshelf";
const BOOK_FILTER = "__book__";

export default function CollectionPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Loading your collection...</p>}>
      <CollectionPageContent />
    </Suspense>
  );
}

function CollectionPageContent() {
  const supabase = createSupabaseBrowserClient();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | undefined>();
  const [filter, setFilter] = useState<ReadingStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("grid");
  const [selected, setSelected] = useState<UserBook | null>(null);
  const [editing, setEditing] = useState<UserBook | null>(null);
  const [selectedItem, setSelectedItem] = useState<CustomItem | null>(null);
  const { isEditMode, toggleEditMode } = useBookshelfEditMode();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, [supabase]);

  const {
    userBooks,
    loading,
    refetch,
    updateStatus,
    updateLendable,
    updatePersonalDetails,
    patchLocal,
    removeBook,
  } = useBooks(userId);
  const { bookshelves, assignBookToShelf, createShelf, updateShelf, deleteShelf } = useShelves(userId);
  const { items, loading: itemsLoading, addItem, updateItem, removeItem } = useCustomItems(userId);
  const search = useLibrarySearch(userBooks, bookshelves);
  const categorySuggestions = useMemo(
    () => getCategorySuggestions(userBooks.map((ub) => ub.category), items.map((i) => i.category)),
    [userBooks, items]
  );

  // Deep links from Home: ?q= prefills search, ?category= sets the filter chip, ?openBook= opens that book's details.
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) search.setQuery(q);
    const category = searchParams.get("category");
    if (category) setTypeFilter(category);
    const openBookId = searchParams.get("openBook");
    if (openBookId) {
      const match = userBooks.find((ub) => ub.id === openBookId);
      if (match) setSelected(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, userBooks.length]);

  const itemCategories = useMemo(
    () =>
      Array.from(new Set(items.map((i) => i.category).filter((c) => c && c !== UNCATEGORIZED))).sort().slice(0, 5),
    [items]
  );

  const visibleBooks = useMemo(() => {
    let books = filter === "all" ? userBooks : userBooks.filter((ub) => ub.status === filter);
    if (typeFilter !== "all" && typeFilter !== BOOK_FILTER) {
      books = books.filter((ub) => ub.category === typeFilter);
    }
    return books;
  }, [userBooks, filter, typeFilter]);

  const visibleItems = useMemo(() => {
    if (typeFilter === BOOK_FILTER) return [];
    if (typeFilter === "all") return items;
    return items.filter((i) => i.category === typeFilter);
  }, [items, typeFilter]);

  const showItems = typeFilter !== BOOK_FILTER;
  const canShowBookshelf = typeFilter === "all" || typeFilter === BOOK_FILTER;

  useEffect(() => {
    if (!canShowBookshelf && displayMode === "bookshelf") setDisplayMode("grid");
  }, [canShowBookshelf, displayMode]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">Collection</h1>
          <p className="text-sm text-zinc-400">
            {userBooks.length} book{userBooks.length === 1 ? "" : "s"} · {items.length} other item
            {items.length === 1 ? "" : "s"}
          </p>
        </div>
        <AddItemDialog
          userId={userId}
          bookshelves={bookshelves}
          onBookAdded={refetch}
          onCustomItemAdd={addItem}
          categorySuggestions={categorySuggestions}
        />
      </div>

      <div className="sticky top-0 z-10 space-y-3 bg-zinc-950 pb-3 pt-1">
        <LibrarySearchBar
          query={search.query}
          onQueryChange={search.setQuery}
          onClear={search.clearQuery}
          matchCount={search.matchCount}
          isSearchActive={search.isSearchActive}
          placeholder="Search everything by title, author, ISBN, brand, category, location..."
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {[{ id: "all", label: "All" }, { id: BOOK_FILTER, label: "Books" }, ...itemCategories.map((c) => ({ id: c, label: c })), { id: UNCATEGORIZED, label: "Other" }].map(
              (chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setTypeFilter(chip.id)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    typeFilter === chip.id
                      ? "bg-zinc-100 text-zinc-900"
                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  {chip.label}
                </button>
              )
            )}
          </div>

          <div className="flex gap-1 self-start rounded-lg border border-zinc-800 bg-zinc-900 p-1 sm:self-auto">
            <Button
              size="sm"
              className="h-8"
              variant={displayMode === "grid" ? "secondary" : "ghost"}
              onClick={() => setDisplayMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              className="h-8"
              variant={displayMode === "list" ? "secondary" : "ghost"}
              onClick={() => setDisplayMode("list")}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
            {canShowBookshelf && (
              <Button
                size="sm"
                className="h-8"
                variant={displayMode === "bookshelf" ? "secondary" : "ghost"}
                onClick={() => setDisplayMode("bookshelf")}
              >
                <Rows3 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {displayMode === "bookshelf" ? (
        <BookshelfModeView
          bookshelves={bookshelves}
          isEditMode={isEditMode}
          onToggleEditMode={toggleEditMode}
          onCreateShelf={createShelf}
          onUpdateShelf={updateShelf}
          onDeleteShelf={deleteShelf}
          matchedUserBookIds={search.matchedUserBookIds}
          isSearchActive={search.isSearchActive}
        />
      ) : (
        <>
          {typeFilter === "all" || typeFilter === BOOK_FILTER ? (
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
          ) : null}

          {loading ? (
            <p className="text-sm text-zinc-500">Loading your collection...</p>
          ) : visibleBooks.length === 0 ? null : (
            <>
              {search.hasNoMatches && <p className="text-sm text-zinc-500">No books match your search.</p>}
              {displayMode === "grid" ? (
                <BooksGrid
                  books={visibleBooks}
                  isSearchActive={search.isSearchActive}
                  matchedUserBookIds={search.matchedUserBookIds}
                  onSelect={setSelected}
                  onEdit={setEditing}
                />
              ) : (
                <BooksList books={visibleBooks} onSelect={setSelected} />
              )}
            </>
          )}

          {showItems && items.length > 0 && (
            <div className="space-y-3 border-t border-zinc-800 pt-6">
              <h2 className="text-sm font-semibold text-zinc-300">
                Other items {itemsLoading ? "" : `(${visibleItems.length})`}
              </h2>
              {visibleItems.length === 0 ? (
                <p className="text-sm text-zinc-500">No items in this category.</p>
              ) : displayMode === "grid" ? (
                <ItemsGrid items={visibleItems} onSelect={setSelectedItem} />
              ) : (
                <ItemsList items={visibleItems} onSelect={setSelectedItem} />
              )}
            </div>
          )}
        </>
      )}

      <BookDetailsPanel
        userBook={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        bookshelves={bookshelves}
        categorySuggestions={categorySuggestions}
        onSaveDetails={async (updates) => {
          if (!selected) return { error: null };
          const result = await updatePersonalDetails(selected.id, updates);
          if (!result.error) setSelected((prev) => prev && { ...prev, ...updates });
          return result;
        }}
        onAssignShelf={async (target) => {
          if (!selected) return { error: null };
          const result = await assignBookToShelf(selected.id, target);
          if (!result.error) {
            const location = buildLocation(bookshelves, target, result.positionIndex);
            patchLocal(selected.id, { location });
            setSelected((prev) => prev && { ...prev, location });
          }
          return result;
        }}
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
        onProgressUpdated={(updates) => {
          if (!selected) return;
          patchLocal(selected.id, updates);
          setSelected((prev) => prev && { ...prev, ...updates });
        }}
      />

      {editing && (
        <EditBookDialog
          userBook={editing}
          bookshelves={bookshelves}
          categorySuggestions={categorySuggestions}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSave={(updates) => updatePersonalDetails(editing.id, updates)}
          onAssignShelf={async (target) => {
            const result = await assignBookToShelf(editing.id, target);
            if (!result.error) {
              patchLocal(editing.id, { location: buildLocation(bookshelves, target, result.positionIndex) });
            }
            return result;
          }}
        />
      )}

      <CustomItemDetailsDialog
        item={selectedItem}
        userId={userId}
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
        categorySuggestions={categorySuggestions}
        onSave={async (updates) => {
          if (!selectedItem) return { error: null };
          const result = await updateItem(selectedItem.id, updates);
          if (!result.error) setSelectedItem((prev) => prev && { ...prev, ...updates });
          return result;
        }}
        onRemove={async () => {
          if (!selectedItem) return { error: null };
          const result = await removeItem(selectedItem.id);
          if (!result.error) setSelectedItem(null);
          return result;
        }}
      />
    </div>
  );
}

function BooksGrid({
  books,
  isSearchActive,
  matchedUserBookIds,
  onSelect,
  onEdit,
}: {
  books: UserBook[];
  isSearchActive: boolean;
  matchedUserBookIds: Set<string> | null;
  onSelect: (ub: UserBook) => void;
  onEdit: (ub: UserBook) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {books.map((ub) => {
        const isMatch = matchedUserBookIds?.has(ub.id) ?? false;
        return (
          <div
            key={ub.id}
            className={cn(
              "group relative flex flex-col items-start gap-2 rounded-lg p-2 transition-all duration-300 ease-out hover:bg-zinc-900",
              getSearchHighlightClass(isSearchActive, isMatch)
            )}
          >
            <div className="absolute right-1 top-1 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="secondary" size="icon-sm" aria-label="Book options">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onSelect(ub)}>View details</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(ub)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit Book
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <button
              type="button"
              onClick={() => onSelect(ub)}
              className="flex w-full flex-col items-start gap-2 text-left"
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
              <div className="flex flex-wrap items-center gap-1">
                <BookStatusBadge status={ub.status} />
                {ub.category && ub.category !== UNCATEGORIZED && (
                  <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                    {ub.category}
                  </span>
                )}
                {ub.genre && (
                  <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                    {ub.genre}
                  </span>
                )}
                {ub.condition && (
                  <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                    {ub.condition}
                  </span>
                )}
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function BooksList({ books, onSelect }: { books: UserBook[]; onSelect: (ub: UserBook) => void }) {
  return (
    <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
      {books.map((ub) => (
        <button
          key={ub.id}
          type="button"
          onClick={() => onSelect(ub)}
          className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-zinc-900"
        >
          <div className="relative h-14 w-10 flex-shrink-0 overflow-hidden rounded bg-zinc-800">
            {ub.book?.cover_url && (
              <Image src={ub.book.cover_url} alt={ub.book.title} fill className="object-cover" unoptimized />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-200">{ub.book?.title}</p>
            <p className="truncate text-xs text-zinc-500">{ub.book?.authors?.join(", ")}</p>
          </div>
          <BookStatusBadge status={ub.status} className="flex-shrink-0" />
        </button>
      ))}
    </div>
  );
}

function ItemsGrid({ items, onSelect }: { items: CustomItem[]; onSelect: (item: CustomItem) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item)}
          className="flex flex-col items-start gap-2 rounded-lg p-2 text-left transition-colors hover:bg-zinc-900"
        >
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded bg-zinc-800">
            {item.image_url ? (
              <Image src={item.image_url} alt={item.name} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center p-2 text-center text-xs text-zinc-500">
                {item.name}
              </div>
            )}
          </div>
          <p className="line-clamp-2 text-xs font-medium text-zinc-200">{item.name}</p>
          <div className="flex flex-wrap items-center gap-1">
            {item.category && item.category !== UNCATEGORIZED && (
              <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                {item.category}
              </span>
            )}
            {item.condition && (
              <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                {item.condition}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

function ItemsList({ items, onSelect }: { items: CustomItem[]; onSelect: (item: CustomItem) => void }) {
  return (
    <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item)}
          className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-zinc-900"
        >
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-zinc-800">
            {item.image_url && (
              <Image src={item.image_url} alt={item.name} fill className="object-cover" unoptimized />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-200">{item.name}</p>
            <p className="truncate text-xs text-zinc-500">{item.brand ?? item.category}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

/** Bookshelf display mode — the same shelf-management UI that used to live at /bookshelves, now embedded in Collection. */
function BookshelfModeView({
  bookshelves,
  isEditMode,
  onToggleEditMode,
  onCreateShelf,
  onUpdateShelf,
  onDeleteShelf,
  matchedUserBookIds,
  isSearchActive,
}: {
  bookshelves: ReturnType<typeof useShelves>["bookshelves"];
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onCreateShelf: ReturnType<typeof useShelves>["createShelf"];
  onUpdateShelf: ReturnType<typeof useShelves>["updateShelf"];
  onDeleteShelf: ReturnType<typeof useShelves>["deleteShelf"];
  matchedUserBookIds: Set<string> | null;
  isSearchActive: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-400">
          {bookshelves.length} shelf{bookshelves.length === 1 ? "" : "ves"}
        </p>
        <div className="flex gap-2">
          <Button
            variant={isEditMode ? "secondary" : "outline"}
            onClick={onToggleEditMode}
            title={
              isEditMode
                ? "Edit Mode — shelves can be renamed or deleted"
                : "Browse Mode — shelf management is locked"
            }
          >
            {isEditMode ? <LockOpen className="mr-1.5 h-4 w-4" /> : <Lock className="mr-1.5 h-4 w-4" />}
            {isEditMode ? "Edit Mode" : "Browse Mode"}
          </Button>
          <CreateShelfDialog onCreate={onCreateShelf} />
        </div>
      </div>

      {bookshelves.length === 0 ? (
        <p className="text-sm text-zinc-500">No bookshelves yet. Create one to start arranging your books.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookshelves.map((shelf) => {
            const theme = SHELF_THEME_STYLES[shelf.theme as keyof typeof SHELF_THEME_STYLES] ?? SHELF_THEME_STYLES.walnut;
            const bookCount = shelf.rows.reduce((sum, row) => sum + row.positions.length, 0);
            const shelfHasMatch = shelf.rows.some((row) =>
              row.positions.some((p) => matchedUserBookIds?.has(p.user_book_id))
            );

            return (
              <div
                key={shelf.id}
                className={cn(
                  "group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 transition-all duration-300 ease-out hover:border-zinc-700",
                  getSearchHighlightClass(isSearchActive, shelfHasMatch)
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
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-medium text-zinc-100">{shelf.name}</h3>
                    {shelf.visibility !== "private" && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                          shelf.visibility === "public"
                            ? "bg-emerald-600 text-emerald-50"
                            : "bg-zinc-700 text-zinc-200"
                        )}
                      >
                        {shelf.visibility === "public" ? "Public" : "Unlisted"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    {shelf.rows.length} row{shelf.rows.length === 1 ? "" : "s"} · {bookCount} book
                    {bookCount === 1 ? "" : "s"}
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
                    onUpdate={(updates) => onUpdateShelf(shelf.id, updates)}
                    onDelete={() => onDeleteShelf(shelf.id)}
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
