export type ReadingStatus =
  | "owned_unread"
  | "reading"
  | "on_hold"
  | "finished"
  | "wishlist"
  | "borrowed"
  | "lent_out"
  | "dnf";

export type BookCondition = "New" | "Like New" | "Good" | "Fair" | "Poor" | "Damaged";

/**
 * inherit_from_shelf (default): visible publicly only if its shelf is public.
 * private: hidden even on a public shelf.
 * public: visible publicly even on a private shelf.
 */
export const BOOK_VISIBILITIES = ["inherit_from_shelf", "private", "public"] as const;
export type BookVisibility = (typeof BOOK_VISIBILITIES)[number];

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
  /** First genre/category/subject reported by the source API, if any. */
  genre: string | null;
  /** All genres/categories/subjects reported by the source API. */
  genres: string[];
}

/** Where a physical copy sits, derived from book_positions → bookshelves/shelf_rows. */
export interface BookLocation {
  bookshelf_id: string;
  bookshelf_name: string;
  shelf_row_id: string;
  shelf_row_name: string | null;
  row_index: number;
  position_index: number;
}

export interface UserBook {
  id: string;
  user_id: string;
  book_id: string;
  status: ReadingStatus;
  is_lendable: boolean;
  date_added: string;
  created_at: string;
  book?: Book;
  // Personal inventory fields — user-specific, not part of the shared book catalog.
  condition: BookCondition | null;
  notes: string | null;
  purchase_price: number | null;
  purchase_currency: string | null;
  date_bought: string | null;
  purchase_location: string | null;
  genre: string | null;
  /** Free text, always set — falls back to "Uncategorized" rather than null. Independent of item_type. */
  category: string;
  rating: number | null;
  favorite: boolean;
  tags: string[];
  // Reading progress — updated whenever a reading session is saved.
  current_page: number;
  last_read_at: string | null;
  /** null when the book has no shelf assignment yet. */
  location: BookLocation | null;
  visibility: BookVisibility;
}

/** Fields an owner can change via EditBookDialog — everything except identity/global book data. */
export type UserBookEditableFields = Partial<{
  status: ReadingStatus;
  genre: string | null;
  category: string;
  condition: BookCondition | null;
  notes: string | null;
  purchase_price: number | null;
  purchase_currency: string | null;
  date_bought: string | null;
  purchase_location: string | null;
  rating: number | null;
  favorite: boolean;
  tags: string[];
  visibility: BookVisibility;
}>;

export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  owned_unread: "Unread",
  reading: "Reading",
  on_hold: "On Hold",
  finished: "Finished",
  wishlist: "Wishlist",
  borrowed: "Borrowed",
  lent_out: "Lent Out",
  dnf: "DNF",
};

export const BOOK_CONDITIONS: BookCondition[] = ["New", "Like New", "Good", "Fair", "Poor", "Damaged"];
export const RATING_VALUES = [1, 2, 3, 4, 5] as const;
