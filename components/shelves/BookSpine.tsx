"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  getSpineColorFromCover,
  getSpineWidthPx,
  fallbackSpineColor,
  SPINE_HEIGHT_PX,
} from "@/lib/spineUtils";
import type { UserBook } from "@/types/book";

const SPINE_PADDING_Y_PX = 20;
const TITLE_AUTHOR_GAP_PX = 8;

const MAX_TITLE_FONT_PX = 15;
const MIN_TITLE_FONT_PX = 7;
const MAX_AUTHOR_FONT_PX = 10;
const MIN_AUTHOR_FONT_PX = 6.5;

function letterSpacingFor(fontPx: number): string {
  if (fontPx <= 8) return "-0.02em";
  if (fontPx <= 10) return "-0.01em";
  return "normal";
}

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
  const author = book?.authors?.[0] ?? null;
  const seed = `${book?.title ?? ""}${author ?? ""}`;
  const [color, setColor] = useState(() => fallbackSpineColor(seed));

  const titleRef = useRef<HTMLSpanElement>(null);
  const authorRef = useRef<HTMLSpanElement>(null);
  const [titleFontPx, setTitleFontPx] = useState(MAX_TITLE_FONT_PX);
  const [authorFontPx, setAuthorFontPx] = useState(MAX_AUTHOR_FONT_PX);
  const [showAuthor, setShowAuthor] = useState(true);

  useLayoutEffect(() => {
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

  // Auto-fit the full title (never abbreviated) within the spine's available
  // height by shrinking font-size until it fits; the author line only gets
  // to exist in whatever vertical space is left over, and disappears first
  // if there isn't any — title always wins.
  useLayoutEffect(() => {
    if (view !== "spine") return;
    const titleEl = titleRef.current;
    if (!titleEl) return;

    const availableHeight = SPINE_HEIGHT_PX - SPINE_PADDING_Y_PX;

    let size = MAX_TITLE_FONT_PX;
    titleEl.style.fontSize = `${size}px`;
    titleEl.style.letterSpacing = letterSpacingFor(size);
    while (size > MIN_TITLE_FONT_PX && titleEl.scrollHeight > availableHeight) {
      size -= 0.5;
      titleEl.style.fontSize = `${size}px`;
      titleEl.style.letterSpacing = letterSpacingFor(size);
    }
    setTitleFontPx(size);

    const remainingForAuthor = availableHeight - titleEl.scrollHeight - (author ? TITLE_AUTHOR_GAP_PX : 0);

    const authorEl = authorRef.current;
    if (author && authorEl && remainingForAuthor >= MIN_AUTHOR_FONT_PX * 2) {
      let authorSize = MAX_AUTHOR_FONT_PX;
      authorEl.style.fontSize = `${authorSize}px`;
      while (authorSize > MIN_AUTHOR_FONT_PX && authorEl.scrollHeight > remainingForAuthor) {
        authorSize -= 0.5;
        authorEl.style.fontSize = `${authorSize}px`;
      }
      const fitsAuthor = authorEl.scrollHeight <= remainingForAuthor;
      setAuthorFontPx(authorSize);
      setShowAuthor(fitsAuthor);
    } else {
      setShowAuthor(false);
    }
  }, [book?.title, author, view]);

  if (view === "cover") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "relative h-56 w-28 flex-shrink-0 overflow-hidden rounded shadow-lg transition-transform hover:-translate-y-1",
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
        "book-spine relative flex h-56 max-sm:min-w-11 flex-shrink-0 flex-col items-center justify-center gap-2 rounded-[2px] py-2.5",
        isDragging && "book-spine-dragging"
      )}
      style={{ width: widthPx, backgroundColor: color }}
      title={book?.title}
    >
      <span
        ref={titleRef}
        className="book-spine-text book-spine-title font-semibold text-white/95"
        style={{ fontSize: titleFontPx }}
      >
        {book?.title}
      </span>
      {author && (
        <span
          ref={authorRef}
          className={cn(
            "book-spine-text book-spine-author font-normal text-white/70",
            !showAuthor && "invisible absolute"
          )}
          style={{ fontSize: authorFontPx }}
          aria-hidden={showAuthor ? undefined : "true"}
        >
          {author}
        </span>
      )}
    </button>
  );
}
