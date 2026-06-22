"use client";

import { useState } from "react";
import {
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

export interface DragBookMoveTarget {
  positionId: string;
  shelfRowId: string;
  bookshelfId: string;
  positionIndex: number;
  /** Set when the drop lands on an occupied slot — the two books should swap. */
  occupantPositionId?: string;
}

interface UseDragBooksOptions {
  onMove: (target: DragBookMoveTarget) => void | Promise<void>;
}

/**
 * Wraps dnd-kit setup for dragging book spines between shelf rows.
 * Draggable ids are book_positions.id; droppable ids are shelf_rows.id
 * encoded as `${bookshelfId}::${shelfRowId}` so cross-shelf drops resolve in one parse.
 */
export function useDragBooks({ onMove }: UseDragBooksOptions) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const [bookshelfId, shelfRowId] = String(over.id).split("::");
    if (!bookshelfId || !shelfRowId) return;

    const positionIndex = typeof over.data.current?.positionIndex === "number" ? over.data.current.positionIndex : 0;
    const occupantPositionId = over.data.current?.occupantPositionId as string | undefined;

    // Dropped back onto the same slot it came from — nothing to do.
    if (occupantPositionId === String(active.id)) return;

    onMove({
      positionId: String(active.id),
      shelfRowId,
      bookshelfId,
      positionIndex,
      occupantPositionId,
    });
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  return { sensors, activeId, handleDragStart, handleDragEnd, handleDragCancel };
}
