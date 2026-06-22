"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { BookSpine } from "@/components/shelves/BookSpine";
import type { UserBook } from "@/types/book";

export function DraggableBook({
  positionId,
  userBook,
  view,
  isSearchActive = false,
  isSearchMatch = false,
  onClick,
}: {
  positionId: string;
  userBook: UserBook;
  view: "spine" | "cover";
  isSearchActive?: boolean;
  isSearchMatch?: boolean;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: positionId,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50 }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none">
      <BookSpine
        userBook={userBook}
        view={view}
        isDragging={isDragging}
        isSearchActive={isSearchActive}
        isSearchMatch={isSearchMatch}
        onClick={onClick}
      />
    </div>
  );
}
