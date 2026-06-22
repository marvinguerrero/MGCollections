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
const SPINE_PADDING_X_PX = 6;
const TITLE_AUTHOR_GAP_PX = 3;

const MAX_TITLE_FONT_PX = 15;
const MIN_TITLE_FONT_PX = 7;
const MIN_TITLE_FONT_PX_WRAPPED = 6;
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
  const baseWidthPx = getSpineWidthPx(book?.page_count);

  const titleRef = useRef<HTMLSpanElement>(null);
  const authorRef = useRef<HTMLSpanElement>(null);
  const [titleFontPx, setTitleFontPx] = useState(MAX_TITLE_FONT_PX);
  const [authorFontPx, setAuthorFontPx] = useState(MAX_AUTHOR_FONT_PX);
  const [showAuthor, setShowAuthor] = useState(true);
  const [spineWidthPx, setSpineWidthPx] = useState(baseWidthPx);
  const [titleWrapped, setTitleWrapped] = useState(false);

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

  // Auto-fit the full title (never abbreviated) within the spine's available
  // height. Phase 1 tries a single vertical column, shrinking font-size.
  // If even the smallest readable font still doesn't fit in one column
  // (very long titles), phase 2 lets it wrap into additional parallel
  // columns — like a real thick spine with a two- or three-line title —
  // widening the spine itself if the page-count width can't hold them.
  // The author runs in its own vertical column to the right of the title
  // (each gets the full spine height independently) and disappears first
  // if the spine isn't wide enough for both columns side by side.
  useLayoutEffect(() => {
    if (view !== "spine") return;
    const titleEl = titleRef.current;
    if (!titleEl) return;

    const availableHeight = SPINE_HEIGHT_PX - SPINE_PADDING_Y_PX;
    const availableWidth = baseWidthPx - SPINE_PADDING_X_PX;

    titleEl.style.whiteSpace = "nowrap";
    titleEl.style.height = "auto";

    let size = MAX_TITLE_FONT_PX;
    titleEl.style.fontSize = `${size}px`;
    titleEl.style.letterSpacing = letterSpacingFor(size);
    while (size > MIN_TITLE_FONT_PX && titleEl.scrollHeight > availableHeight) {
      size -= 0.5;
      titleEl.style.fontSize = `${size}px`;
      titleEl.style.letterSpacing = letterSpacingFor(size);
    }

    if (titleEl.scrollHeight <= availableHeight) {
      // Fits in one column — keep the simple, fully-legible single-line spine.
      setTitleFontPx(size);
      setTitleWrapped(false);
      setSpineWidthPx(baseWidthPx);

      const authorEl = authorRef.current;
      const remainingWidth = availableWidth - titleEl.scrollWidth - (author ? TITLE_AUTHOR_GAP_PX : 0);
      if (author && authorEl && remainingWidth >= MIN_AUTHOR_FONT_PX) {
        authorEl.style.whiteSpace = "nowrap";
        let authorSize = MAX_AUTHOR_FONT_PX;
        authorEl.style.fontSize = `${authorSize}px`;
        while (authorSize > MIN_AUTHOR_FONT_PX && authorEl.scrollHeight > availableHeight) {
          authorSize -= 0.5;
          authorEl.style.fontSize = `${authorSize}px`;
        }
        setAuthorFontPx(authorSize);
        setShowAuthor(authorEl.scrollHeight <= availableHeight && authorEl.scrollWidth <= remainingWidth);
      } else {
        setShowAuthor(false);
      }
      return;
    }

    // Phase 2: too long for one column even at the floor font — wrap into
    // multiple parallel columns instead of clipping or abbreviating.
    setShowAuthor(false);
    titleEl.style.whiteSpace = "normal";
    titleEl.style.overflowWrap = "break-word";
    titleEl.style.height = `${availableHeight}px`;

    let wrapSize = MIN_TITLE_FONT_PX;
    titleEl.style.fontSize = `${wrapSize}px`;
    titleEl.style.letterSpacing = letterSpacingFor(wrapSize);
    while (wrapSize > MIN_TITLE_FONT_PX_WRAPPED && titleEl.scrollWidth > availableWidth) {
      wrapSize -= 0.5;
      titleEl.style.fontSize = `${wrapSize}px`;
      titleEl.style.letterSpacing = letterSpacingFor(wrapSize);
    }

    setTitleFontPx(wrapSize);
    setTitleWrapped(true);
    // If it still needs more room than the page-count width allows, grow the
    // spine itself rather than lose any of the title.
    setSpineWidthPx(Math.max(baseWidthPx, titleEl.scrollWidth + SPINE_PADDING_X_PX));
  }, [book?.title, author, baseWidthPx, view]);

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
        "book-spine relative flex h-56 max-sm:min-w-11 flex-shrink-0 flex-row items-center justify-center gap-[3px] rounded-[2px] py-2.5",
        isDragging && "book-spine-dragging"
      )}
      style={{ width: spineWidthPx, backgroundColor: color }}
      title={book?.title}
    >
      <span
        ref={titleRef}
        className={cn(
          "book-spine-text book-spine-title font-semibold text-white/95",
          titleWrapped && "book-spine-title-wrapped"
        )}
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
