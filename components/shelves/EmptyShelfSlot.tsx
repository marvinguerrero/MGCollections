"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

/**
 * Renders an unoccupied shelf slot. In owner edit mode it shows a faint dashed
 * outline so the gap is droppable and discoverable; in public/view mode it's
 * just blank shelf-colored space, like a real gap between books.
 *
 * Always rendered at the thin-spine width (not the wider cover width) even in
 * Cover view — an empty slot has no cover to show, and using the full cover
 * width would push real books far off-screen for the same stored gap.
 */
export function EmptyShelfSlot({
  bookshelfId,
  shelfRowId,
  index,
  editMode = false,
}: {
  bookshelfId: string;
  shelfRowId: string;
  index: number;
  view?: "spine" | "cover";
  editMode?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${bookshelfId}::${shelfRowId}::slot-${index}`,
    data: { positionIndex: index },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "empty-shelf-slot h-56 w-7 flex-shrink-0 rounded-[2px] transition-colors",
        editMode && "empty-shelf-slot-outline",
        isOver && "empty-shelf-slot-over"
      )}
    />
  );
}
