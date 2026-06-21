"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { DraggableBook } from "@/components/shelves/DraggableBook";
import type { ShelfRowWithBooks } from "@/types/shelf";
import type { UserBook } from "@/types/book";

export function ShelfRow({
  row,
  bookshelfId,
  view,
  onBookClick,
}: {
  row: ShelfRowWithBooks;
  bookshelfId: string;
  view: "spine" | "cover";
  onBookClick?: (userBook: UserBook) => void;
}) {
  const droppableId = `${bookshelfId}::${row.id}`;
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { positionIndex: row.positions.length },
  });

  return (
    <div className="flex flex-col">
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[12rem] items-end gap-1.5 overflow-x-auto rounded-t-sm px-3 pb-0 pt-3 transition-colors",
          isOver && "bg-amber-500/10"
        )}
      >
        {row.positions.map((position) => (
          <DraggableBook
            key={position.id}
            positionId={position.id}
            userBook={position.user_book}
            view={view}
            onClick={() => onBookClick?.(position.user_book)}
          />
        ))}
        {row.positions.length === 0 && (
          <span className="pb-4 text-xs text-zinc-600">Drop books here</span>
        )}
      </div>
      <div className="shelf-row-board h-3 w-full rounded-b-sm" />
    </div>
  );
}
