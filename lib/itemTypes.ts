import { BookOpen, Package, type LucideIcon } from "lucide-react";

export type ItemTypeId = "book" | "custom";

export interface ItemTypeOption {
  id: ItemTypeId;
  label: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Registry behind AddItemDialog's selection step. Adding a future item type
 * means adding an entry here plus its own dialog component — AddItemDialog
 * itself (the selector UI) doesn't need to change.
 */
export const ITEM_TYPE_OPTIONS: ItemTypeOption[] = [
  {
    id: "book",
    label: "Book",
    description: "Search Google Books/Open Library and add a book to the collection.",
    icon: BookOpen,
  },
  {
    id: "custom",
    label: "Custom Item",
    description: "Manually add any item you own.",
    icon: Package,
  },
];
