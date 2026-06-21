import Image from "next/image";
import Link from "next/link";
import { BookStatusBadge } from "@/components/books/BookStatusBadge";
import type { UserBook } from "@/types/book";

export function RecentBooks({ userBooks }: { userBooks: UserBook[] }) {
  if (userBooks.length === 0) {
    return <p className="text-sm text-zinc-500">No books added yet.</p>;
  }

  return (
    <div className="space-y-2">
      {userBooks.slice(0, 6).map((ub) => (
        <Link
          key={ub.id}
          href="/collection"
          className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-900"
        >
          <div className="relative h-12 w-9 flex-shrink-0 overflow-hidden rounded bg-zinc-800">
            {ub.book?.cover_url && (
              <Image src={ub.book.cover_url} alt={ub.book.title} fill className="object-cover" unoptimized />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm text-zinc-200">{ub.book?.title}</p>
            <p className="truncate text-xs text-zinc-500">{ub.book?.authors?.join(", ")}</p>
          </div>
          <BookStatusBadge status={ub.status} />
        </Link>
      ))}
    </div>
  );
}
