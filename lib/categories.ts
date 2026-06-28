import { DEFAULT_CATEGORIES } from "@/lib/constants";

/**
 * Default categories plus every distinct custom category already saved on
 * any collection type — this is what makes a custom category "reusable":
 * once saved on any item, it shows up as a suggestion next time without
 * needing a dedicated categories table. Generic over the source (books,
 * custom items, anything future) — callers just pass the category values.
 */
export function getCategorySuggestions(...categoryLists: (string | null | undefined)[][]): string[] {
  const custom = categoryLists
    .flat()
    .filter((category): category is string => !!category && !DEFAULT_CATEGORIES.includes(category));

  return [...DEFAULT_CATEGORIES, ...Array.from(new Set(custom)).sort()];
}
