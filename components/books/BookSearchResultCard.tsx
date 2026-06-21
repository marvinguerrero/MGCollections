import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { NormalizedBookResult } from "@/types/book";

export function BookSearchResultCard({
  result,
  onAdd,
}: {
  result: NormalizedBookResult;
  onAdd: (result: NormalizedBookResult) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 transition-colors hover:bg-zinc-900 sm:flex-row">
      <div className="flex w-full gap-3 sm:w-auto">
        <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded bg-zinc-800">
          {result.coverUrl ? (
            <Image src={result.coverUrl} alt={result.title} fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-zinc-500">No cover</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-100">{result.title}</p>
          <p className="truncate text-xs text-zinc-400">{result.authors.join(", ") || "Unknown author"}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {result.publishedDate ?? "—"} {result.pageCount ? `· ${result.pageCount}p` : ""}
          </p>
        </div>
        <Button
          size="icon"
          variant="secondary"
          className="hidden flex-shrink-0 self-center sm:flex"
          onClick={() => onAdd(result)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Button className="w-full sm:hidden" variant="secondary" onClick={() => onAdd(result)}>
        <Plus className="mr-1.5 h-4 w-4" /> Add
      </Button>
    </div>
  );
}
