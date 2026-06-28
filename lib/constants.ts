import type { BookVisibility, ReadingStatus } from "@/types/book";
import type { ShelfTheme, ShelfVisibility } from "@/types/shelf";

export const READING_STATUSES: ReadingStatus[] = [
  "owned_unread",
  "reading",
  "on_hold",
  "finished",
  "wishlist",
  "borrowed",
  "lent_out",
  "dnf",
];

export const STATUS_BADGE_STYLES: Record<ReadingStatus, string> = {
  owned_unread: "bg-zinc-700 text-zinc-100",
  reading: "bg-blue-600 text-blue-50",
  on_hold: "bg-orange-600 text-orange-50",
  finished: "bg-emerald-600 text-emerald-50",
  wishlist: "bg-purple-600 text-purple-50",
  borrowed: "bg-amber-600 text-amber-50",
  lent_out: "bg-rose-600 text-rose-50",
  dnf: "bg-neutral-600 text-neutral-50",
};

export const SHELF_THEME_STYLES: Record<ShelfTheme, { shelf: string; frame: string }> = {
  walnut: { shelf: "#5c3a21", frame: "#3d2414" },
  oak: { shelf: "#8a6240", frame: "#5e4128" },
  ebony: { shelf: "#2a2622", frame: "#171513" },
  white: { shelf: "#e8e4dc", frame: "#bdb6a8" },
};

export const DEFAULT_PURCHASE_CURRENCY = "PHP";
export const DEFAULT_BOOK_CONDITION = "Good";

/**
 * Suggested starting points only — users can type any custom category and
 * it's saved as free text (see lib/categories.ts for how custom values
 * become reusable suggestions, too).
 */
export const DEFAULT_CATEGORIES = [
  "Books",
  "Electronics",
  "Appliances",
  "Shoes",
  "Watches",
  "Bags",
  "Furniture",
  "Tools",
  "Documents",
  "Collectibles",
  "Other",
  "Uncategorized",
];

export const UNCATEGORIZED = "Uncategorized";

export const SHELF_VISIBILITY_LABELS: Record<ShelfVisibility, string> = {
  private: "Private",
  public: "Public",
  unlisted: "Unlisted",
};

export const BOOK_VISIBILITY_LABELS: Record<BookVisibility, string> = {
  inherit_from_shelf: "Inherit from Shelf",
  private: "Private",
  public: "Public",
};

export const DEFAULT_SHELF_WIDTH_CM = 90;
export const DEFAULT_SHELF_HEIGHT_CM = 180;
export const DEFAULT_ROW_HEIGHT_CM = 30;

/** How many physical slots a shelf row renders (filled or empty) before it scrolls. */
export const DEFAULT_ROW_CAPACITY = 30;

export const FALLBACK_SPINE_COLORS = [
  "#6b5b95",
  "#88b04b",
  "#955251",
  "#b565a7",
  "#009b77",
  "#dd4124",
  "#45b8ac",
  "#5b5ea6",
  "#9b2335",
  "#bc243c",
];
