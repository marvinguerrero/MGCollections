"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { DraggableBook } from "@/components/shelves/DraggableBook";
import { EmptyShelfSlot } from "@/components/shelves/EmptyShelfSlot";
import { buildShelfSlots, type PositionWithBook } from "@/lib/shelves/positionUtils";
import type { ShelfRowWithBooks } from "@/types/shelf";
import type { UserBook } from "@/types/book";

function FilledShelfSlot({
  bookshelfId,
  shelfRowId,
  index,
  position,
  view,
  editMode,
  isSearchActive,
  isSearchMatch,
  onClick,
}: {
  bookshelfId: string;
  shelfRowId: string;
  index: number;
  position: PositionWithBook;
  view: "spine" | "cover";
  editMode: boolean;
  isSearchActive: boolean;
  isSearchMatch: boolean;
  onClick?: () => void;
}) {
  // Also droppable: dropping another book here swaps the two, rather than
  // shifting anything else on the shelf.
  const { setNodeRef, isOver } = useDroppable({
    id: `${bookshelfId}::${shelfRowId}::slot-${index}`,
    data: { positionIndex: index, occupantPositionId: position.id },
    disabled: !editMode,
  });

  return (
    <div ref={setNodeRef} className={cn(editMode && isOver && "shelf-slot-swap-target")}>
      <DraggableBook
        positionId={position.id}
        userBook={position.user_book}
        view={view}
        editMode={editMode}
        isSearchActive={isSearchActive}
        isSearchMatch={isSearchMatch}
        onClick={onClick}
      />
    </div>
  );
}

export function ShelfRow({
  row,
  bookshelfId,
  view,
  editMode = false,
  matchedUserBookIds = null,
  onBookClick,
}: {
  row: ShelfRowWithBooks;
  bookshelfId: string;
  view: "spine" | "cover";
  editMode?: boolean;
  /** Set of user_book ids matching the active search; null means no search is active. */
  matchedUserBookIds?: Set<string> | null;
  onBookClick?: (userBook: UserBook) => void;
}) {
  const slots = buildShelfSlots(row.positions);
  const isSearchActive = matchedUserBookIds !== null;

  return (
    <div className="flex flex-col">
      <div className="flex min-h-[15rem] items-end gap-1.5 overflow-x-auto rounded-t-sm px-2 pb-0 pt-3 sm:px-3">
        {slots.map((slot) =>
          slot.position ? (
            <FilledShelfSlot
              key={slot.position.id}
              bookshelfId={bookshelfId}
              shelfRowId={row.id}
              index={slot.index}
              position={slot.position}
              view={view}
              editMode={editMode}
              isSearchActive={isSearchActive}
              isSearchMatch={isSearchActive && (matchedUserBookIds?.has(slot.position.user_book_id) ?? false)}
              onClick={() => onBookClick?.(slot.position.user_book)}
            />
          ) : (
            <EmptyShelfSlot
              key={`empty-${row.id}-${slot.index}`}
              bookshelfId={bookshelfId}
              shelfRowId={row.id}
              index={slot.index}
              view={view}
              editMode={editMode}
            />
          )
        )}
      </div>
      <div className="shelf-row-board h-3 w-full rounded-b-sm" />
    </div>
  );
}
