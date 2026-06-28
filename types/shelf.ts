import type { UserBook } from "./book";

export const SHELF_THEMES = ["walnut", "oak", "ebony", "white"] as const;
export type ShelfTheme = (typeof SHELF_THEMES)[number];

/**
 * private (default): never shown on the public library.
 * public: shown, and books on it follow their own visibility (see UserBook).
 * unlisted: hidden from public browsing for now — reserved for a future
 * direct-link viewing feature, not built yet.
 */
export const SHELF_VISIBILITIES = ["private", "public", "unlisted"] as const;
export type ShelfVisibility = (typeof SHELF_VISIBILITIES)[number];

export interface Bookshelf {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  width_cm: number;
  height_cm: number;
  theme: ShelfTheme | string;
  sort_order: number;
  visibility: ShelfVisibility;
  created_at: string;
}

export interface ShelfRow {
  id: string;
  bookshelf_id: string;
  name: string | null;
  row_index: number;
  height_cm: number;
  created_at: string;
}

/**
 * x/y/z + rotation are persisted now even though the MVP only renders 2D spines,
 * so a future Three.js room can reuse this table without a migration.
 */
export interface BookPosition {
  id: string;
  user_book_id: string;
  bookshelf_id: string;
  shelf_row_id: string;
  position_index: number;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_y: number;
  display_width: number | null;
  display_height: number | null;
  display_depth: number | null;
  created_at: string;
  updated_at: string;
}

export interface ShelfRowWithBooks extends ShelfRow {
  positions: (BookPosition & { user_book: UserBook })[];
}

export interface BookshelfWithRows extends Bookshelf {
  rows: ShelfRowWithBooks[];
}
