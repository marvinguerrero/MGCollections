/**
 * Generic, non-book collection items. Kept deliberately separate from
 * types/book.ts (no shared condition type) so book code can never be
 * affected by changes here — books and custom items are independent
 * collection types that happen to share a UI entry point (AddItemDialog).
 */
export type ItemCondition = "New" | "Like New" | "Good" | "Fair" | "Poor" | "Damaged";

export const ITEM_CONDITIONS: ItemCondition[] = ["New", "Like New", "Good", "Fair", "Poor", "Damaged"];

export interface CustomItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  purchase_price: number | null;
  purchase_currency: string | null;
  date_bought: string | null;
  purchase_location: string | null;
  condition: ItemCondition | null;
  notes: string | null;
  image_url: string | null;
  /** Free-text for now (e.g. "Bedroom Closet") — the future Home > Room > Storage > Container hierarchy builds on top of this. */
  location: string | null;
  warranty_expiry: string | null;
  created_at: string;
  updated_at: string;
}

export type CustomItemEditableFields = Partial<{
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  purchase_price: number | null;
  purchase_currency: string | null;
  date_bought: string | null;
  purchase_location: string | null;
  condition: ItemCondition | null;
  notes: string | null;
  image_url: string | null;
  location: string | null;
  warranty_expiry: string | null;
}>;
