"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { BookSearchResultCard } from "@/components/books/BookSearchResultCard";
import type { NormalizedBookResult } from "@/types/book";

export function BookSearch({ onSelect }: { onSelect: (result: NormalizedBookResult) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NormalizedBookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Search failed");
      setResults(json.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, author, or ISBN..."
          className="pl-9"
        />
      </form>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Searching...
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && results.length > 0 && (
        <div className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
          {results.map((result) => (
            <BookSearchResultCard key={`${result.source}-${result.externalId}`} result={result} onAdd={onSelect} />
          ))}
        </div>
      )}

      {!loading && !error && results.length === 0 && query && (
        <p className="py-4 text-center text-sm text-zinc-500">No results yet — press Enter to search.</p>
      )}
    </div>
  );
}
