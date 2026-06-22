/**
 * Shared "this matches the active search" vs "this doesn't" visual language —
 * used by BookSpine (shelf slots) and plain grid cards (collection, shelf
 * overview) so the highlight/dim styling is defined exactly once.
 */
export function getSearchHighlightClass(isSearchActive: boolean, isMatch: boolean): string {
  if (!isSearchActive) return "";
  return isMatch
    ? "scale-105 ring-2 ring-amber-300/80 shadow-lg shadow-amber-500/30 shelf-search-match z-20"
    : "scale-95 opacity-30";
}
