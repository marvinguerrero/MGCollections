export type ReadingStatus =
  | "owned_unread"
  | "reading"
  | "finished"
  | "wishlist"
  | "borrowed"
  | "lent_out"
  | "dnf";

export type BookSource = "google" | "openlibrary";

export interface Book {
  id: string;
  external_source: string | null;
  external_id: string | null;
  title: string;
  authors: string[];
  isbn_10: string | null;
  isbn_13: string | null;
  publisher: string | null;
  published_date: string | null;
  description: string | null;
  page_count: number | null;
  cover_url: string | null;
  created_at: string;
}

/** Normalized shape returned by /api/books/search, before a book exists in our catalog. */
export interface NormalizedBookResult {
  title: string;
  authors: string[];
  isbn: string | null;
  isbn_10: string | null;
  isbn_13: string | null;
  publisher: string | null;
  publishedDate: string | null;
  description: string | null;
  pageCount: number | null;
  coverUrl: string | null;
  source: BookSource;
  externalId: string;
}

export interface UserBook {
  id: string;
  user_id: string;
  book_id: string;
  status: ReadingStatus;
  condition: string | null;
  notes: string | null;
  is_lendable: boolean;
  date_added: string;
  created_at: string;
  book?: Book;
}

export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  owned_unread: "Owned (Unread)",
  reading: "Reading",
  finished: "Finished",
  wishlist: "Wishlist",
  borrowed: "Borrowed",
  lent_out: "Lent Out",
  dnf: "DNF",
};
