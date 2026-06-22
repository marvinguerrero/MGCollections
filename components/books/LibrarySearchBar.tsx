"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Bare search input + clear button + match count, with no opinion on sticky
 * positioning or page padding — callers wrap it however fits their layout.
 * Shared by the owner's library pages and the public library page so the
 * search UI never has to be redefined per-page.
 */
export function LibrarySearchBar({
  query,
  onQueryChange,
  onClear,
  matchCount,
  isSearchActive,
  placeholder = "Search by title, author, ISBN, status, or shelf...",
  autoFocus,
  className,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onClear: () => void;
  matchCount: number;
  isSearchActive: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full pl-9 pr-10"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2"
            onClick={onClear}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {isSearchActive && (
        <p className="mt-1.5 px-1 text-xs text-zinc-500">
          {matchCount} match{matchCount === 1 ? "" : "es"} found
        </p>
      )}
    </div>
  );
}
