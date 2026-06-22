import { DEFAULT_ROW_CAPACITY } from "@/lib/constants";
import type { BookPosition, BookshelfWithRows, ShelfRowWithBooks } from "@/types/shelf";
import type { UserBook } from "@/types/book";

export type PositionWithBook = BookPosition & { user_book: UserBook };

export type FilledShelfSlot = { index: number; position: PositionWithBook };
export type EmptyShelfSlotData = { index: number; position: null };
export type ShelfSlot = FilledShelfSlot | EmptyShelfSlotData;

/**
 * Builds a fixed-capacity list of slots for a shelf row, one per position_index
 * from 0 up to `capacity` (or the highest occupied index, if that's larger).
 * Indexes with no book become empty slots — nothing ever shifts or compacts.
 */
export function buildShelfSlots(
  positions: PositionWithBook[],
  capacity: number = DEFAULT_ROW_CAPACITY
): ShelfSlot[] {
  const byIndex = new Map(positions.map((p) => [p.position_index, p]));
  const highestUsed = positions.reduce((max, p) => Math.max(max, p.position_index), -1);
  const slotCount = Math.max(capacity, highestUsed + 1);

  return Array.from({ length: slotCount }, (_, index) => {
    const position = byIndex.get(index);
    return position ? { index, position } : { index, position: null };
  });
}

/** Lowest unoccupied position_index in a row — used when placing newly added books. */
export function findFirstEmptyIndex(
  positions: { position_index: number }[],
  capacity: number = DEFAULT_ROW_CAPACITY
): number {
  const used = new Set(positions.map((p) => p.position_index));
  for (let i = 0; i < capacity; i++) {
    if (!used.has(i)) return i;
  }
  return positions.reduce((max, p) => Math.max(max, p.position_index + 1), capacity);
}

function findPosition(layout: BookshelfWithRows[], positionId: string) {
  for (const shelf of layout) {
    for (const row of shelf.rows) {
      const position = row.positions.find((p) => p.id === positionId);
      if (position) return { shelf, row, position };
    }
  }
  return null;
}

function replaceRows(
  layout: BookshelfWithRows[],
  updates: Map<string, PositionWithBook[]>
): BookshelfWithRows[] {
  return layout.map((shelf) => ({
    ...shelf,
    rows: shelf.rows.map((row: ShelfRowWithBooks) =>
      updates.has(row.id) ? { ...row, positions: updates.get(row.id)! } : row
    ),
  }));
}

/**
 * Moves a book into an empty slot (same row, another row, or another shelf).
 * The slot it vacates is left empty — no reindexing of any other book.
 */
export function moveBookToEmptySlot(
  layout: BookshelfWithRows[],
  positionId: string,
  target: { bookshelfId: string; shelfRowId: string; positionIndex: number }
): { layout: BookshelfWithRows[]; moved: PositionWithBook } | null {
  const found = findPosition(layout, positionId);
  if (!found) return null;
  const { row: sourceRow, position } = found;

  const moved: PositionWithBook = {
    ...position,
    bookshelf_id: target.bookshelfId,
    shelf_row_id: target.shelfRowId,
    position_index: target.positionIndex,
  };

  const updates = new Map<string, PositionWithBook[]>();
  updates.set(sourceRow.id, sourceRow.positions.filter((p) => p.id !== positionId));

  if (target.shelfRowId === sourceRow.id) {
    updates.set(sourceRow.id, [...updates.get(sourceRow.id)!, moved]);
  } else {
    for (const shelf of layout) {
      for (const row of shelf.rows) {
        if (row.id === target.shelfRowId) {
          updates.set(row.id, [...row.positions, moved]);
        }
      }
    }
  }

  return { layout: replaceRows(layout, updates), moved };
}

/** Swaps two books' shelf positions — both keep a slot, they just trade places. */
export function swapBooks(
  layout: BookshelfWithRows[],
  sourcePositionId: string,
  targetPositionId: string
): { layout: BookshelfWithRows[]; moved: [PositionWithBook, PositionWithBook] } | null {
  if (sourcePositionId === targetPositionId) return null;

  const sourceFound = findPosition(layout, sourcePositionId);
  const targetFound = findPosition(layout, targetPositionId);
  if (!sourceFound || !targetFound) return null;

  const { row: sourceRow, position: sourcePosition } = sourceFound;
  const { row: targetRow, position: targetPosition } = targetFound;

  const movedSource: PositionWithBook = {
    ...sourcePosition,
    bookshelf_id: targetPosition.bookshelf_id,
    shelf_row_id: targetPosition.shelf_row_id,
    position_index: targetPosition.position_index,
  };
  const movedTarget: PositionWithBook = {
    ...targetPosition,
    bookshelf_id: sourcePosition.bookshelf_id,
    shelf_row_id: sourcePosition.shelf_row_id,
    position_index: sourcePosition.position_index,
  };

  const updates = new Map<string, PositionWithBook[]>();

  if (sourceRow.id === targetRow.id) {
    const positions = sourceRow.positions
      .filter((p) => p.id !== sourcePositionId && p.id !== targetPositionId)
      .concat(movedSource, movedTarget);
    updates.set(sourceRow.id, positions);
  } else {
    updates.set(
      sourceRow.id,
      sourceRow.positions.filter((p) => p.id !== sourcePositionId).concat(movedTarget)
    );
    updates.set(
      targetRow.id,
      targetRow.positions.filter((p) => p.id !== targetPositionId).concat(movedSource)
    );
  }

  return { layout: replaceRows(layout, updates), moved: [movedSource, movedTarget] };
}

/** Removes a book from its shelf slot but leaves the gap — nothing else re-indexes. */
export function removeBookKeepGap(
  layout: BookshelfWithRows[],
  userBookId: string
): BookshelfWithRows[] {
  return layout.map((shelf) => ({
    ...shelf,
    rows: shelf.rows.map((row) => ({
      ...row,
      positions: row.positions.filter((p) => p.user_book_id !== userBookId),
    })),
  }));
}
