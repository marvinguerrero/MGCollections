"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  getSpineColorFromCover,
  getSpineWidthClass,
  getSpineWidthPx,
  getSpineDisplayTitle,
  fallbackSpineColor,
} from "@/lib/spineUtils";
import type { UserBook } from "@/types/book";

export function BookSpine({
  userBook,
  view = "spine",
  isDragging = false,
  onClick,
}: {
  userBook: UserBook;
  view?: "spine" | "cover";
  isDragging?: boolean;
  onClick?: () => void;
}) {
  const book = userBook.book;
  const seed = `${book?.title ?? ""}${book?.authors?.[0] ?? ""}`;
  const [color, setColor] = useState(() => fallbackSpineColor(seed));

  useEffect(() => {
    let cancelled = false;
    getSpineColorFromCover(book?.cover_url, seed).then((c) => {
      if (!cancelled) setColor(c);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.cover_url]);

  const widthPx = getSpineWidthPx(book?.page_count);
  const widthClass = getSpineWidthClass(book?.page_count);
  const displayTitle = getSpineDisplayTitle(book?.title, widthClass);

  if (view === "cover") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "relative h-44 w-28 flex-shrink-0 overflow-hidden rounded shadow-lg transition-transform hover:-translate-y-1",
          isDragging && "book-spine-dragging"
        )}
        title={book?.title}
      >
        {book?.cover_url ? (
          <Image src={book.cover_url} alt={book.title} fill className="object-cover" unoptimized />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center p-2 text-center text-xs font-medium text-white/90"
            style={{ backgroundColor: color }}
          >
            {book?.title}
          </div>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "book-spine relative flex h-44 max-sm:min-w-11 flex-shrink-0 flex-col items-center justify-center rounded-[2px] py-2",
        isDragging && "book-spine-dragging"
      )}
      style={{ width: widthPx, backgroundColor: color }}
      title={book?.title}
    >
      {/* Vertical writing-mode on every breakpoint, like text printed along a real spine.
          CSS (book-spine-title) clamps height + ellipsizes so it never escapes the spine;
          thin spines get initials instead since there's no room to spell anything out. */}
      <span className="book-spine-title text-[11px] font-medium leading-tight text-white/90">
        {displayTitle}
      </span>
    </button>
  );
}
