"use client";

import { useMemo, useState } from "react";
import { READING_STATUS_LABELS, type UserBook } from "@/types/book";
import type { BookshelfWithRows } from "@/types/shelf";

export interface UseLibrarySearchResult {
  query: string;
  setQuery: (value: string) => void;
  clearQuery: () => void;
  /** False when the query is empty — callers should render the normal, unhighlighted state. */
  isSearchActive: boolean;
  /** Set of matching user_book ids, or null when no search is active. Never used to filter render lists. */
  matchedUserBookIds: Set<string> | null;
  matchCount: number;
  hasNoMatches: boolean;
}

/**
 * Searches title, author, ISBN, status, and shelf/row name across a flat list
 * of books. Returns only a set of matching ids — callers use it to highlight
 * books in place (pop matches, dim the rest); they must never filter their
 * render list with it, or books would appear to move/disappear.
 *
 * `bookshelves` is optional and only used to resolve each book's shelf/row
 * name for the "shelf name" search criterion — pass `[]` if not applicable
 * (e.g. searching a flat list with no shelf context).
 */
export function useLibrarySearch(
  userBooks: UserBook[],
  bookshelves: BookshelfWithRows[] = []
): UseLibrarySearchResult {
  const [query, setQuery] = useState("");

  const shelfLabelByUserBookId = useMemo(() => {
    const map = new Map<string, string>();
    for (const shelf of bookshelves) {
      for (const row of shelf.rows) {
        for (const position of row.positions) {
          map.set(position.user_book_id, row.name ? `${shelf.name} ${row.name}` : shelf.name);
        }
      }
    }
    return map;
  }, [bookshelves]);

  const matchedUserBookIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const ids = new Set<string>();
    for (const userBook of userBooks) {
      if (matchesLibraryQuery(q, userBook, shelfLabelByUserBookId.get(userBook.id))) {
        ids.add(userBook.id);
      }
    }
    return ids;
  }, [userBooks, shelfLabelByUserBookId, query]);

  const isSearchActive = matchedUserBookIds !== null;
  const matchCount = matchedUserBookIds?.size ?? 0;

  return {
    query,
    setQuery,
    clearQuery: () => setQuery(""),
    isSearchActive,
    matchedUserBookIds,
    matchCount,
    hasNoMatches: isSearchActive && matchCount === 0,
  };
}

function matchesLibraryQuery(query: string, userBook: UserBook, shelfLabel: string | undefined): boolean {
  const book = userBook.book;
  const haystacks: (string | null | undefined)[] = [
    book?.title,
    ...(book?.authors ?? []),
    book?.isbn_10,
    book?.isbn_13,
    READING_STATUS_LABELS[userBook.status],
    userBook.status,
    shelfLabel,
  ];
  return haystacks.some((value) => value?.toLowerCase().includes(query));
}
