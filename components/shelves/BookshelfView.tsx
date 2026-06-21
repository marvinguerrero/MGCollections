"use client";

import { useState } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { LayoutList, BookOpen as CoverIcon } from "lucide-react";
import { ShelfRow } from "@/components/shelves/ShelfRow";
import { BookSpine } from "@/components/shelves/BookSpine";
import { useDragBooks, type DragBookMoveTarget } from "@/hooks/useDragBooks";
import { SHELF_THEME_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { BookshelfWithRows } from "@/types/shelf";
import type { UserBook } from "@/types/book";

export function BookshelfView({
  bookshelf,
  onMoveBook,
  onBookClick,
  readOnly = false,
}: {
  bookshelf: BookshelfWithRows;
  onMoveBook?: (target: DragBookMoveTarget) => void | Promise<void>;
  onBookClick?: (userBook: UserBook) => void;
  readOnly?: boolean;
}) {
  const [view, setView] = useState<"spine" | "cover">("spine");
  const { sensors, activeId, handleDragStart, handleDragEnd, handleDragCancel } = useDragBooks({
    onMove: (target) => onMoveBook?.(target),
  });

  const theme = SHELF_THEME_STYLES[bookshelf.theme as keyof typeof SHELF_THEME_STYLES] ?? SHELF_THEME_STYLES.walnut;

  const activePosition = activeId
    ? bookshelf.rows.flatMap((r) => r.positions).find((p) => p.id === activeId)
    : null;

  const content = (
    <div className="w-full max-w-full space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-zinc-100">{bookshelf.name}</h2>
          {bookshelf.description && <p className="text-sm text-zinc-400">{bookshelf.description}</p>}
        </div>
        <div className="flex gap-1 self-start rounded-lg border border-zinc-800 bg-zinc-900 p-1 sm:self-auto">
          <Button
            size="sm"
            className="h-9"
            variant={view === "spine" ? "secondary" : "ghost"}
            onClick={() => setView("spine")}
          >
            <LayoutList className="mr-1.5 h-4 w-4" /> Spine
          </Button>
          <Button
            size="sm"
            className="h-9"
            variant={view === "cover" ? "secondary" : "ghost"}
            onClick={() => setView("cover")}
          >
            <CoverIcon className="mr-1.5 h-4 w-4" /> Cover
          </Button>
        </div>
      </div>

      <div
        className={cn("shelf-frame w-full max-w-full overflow-hidden rounded-lg border-[6px] p-2 sm:border-[10px] sm:p-3")}
        style={{ borderColor: theme.frame, backgroundColor: theme.shelf }}
      >
        <div className="flex flex-col gap-3">
          {bookshelf.rows.map((row) => (
            <ShelfRow key={row.id} row={row} bookshelfId={bookshelf.id} view={view} onBookClick={onBookClick} />
          ))}
          {bookshelf.rows.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-300/70">
              This bookshelf has no rows yet. Add one to start placing books.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (readOnly) return content;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {content}
      <DragOverlay>
        {activePosition ? <BookSpine userBook={activePosition.user_book} view={view} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
