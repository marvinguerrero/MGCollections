"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { BookOpen, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { BookStatusBadge } from "@/components/books/BookStatusBadge";
import { EditBookDialog } from "@/components/books/EditBookDialog";
import { ReadingSessionDialog } from "@/components/books/ReadingSessionDialog";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import { READING_STATUS_LABELS, type ReadingStatus, type UserBook, type UserBookEditableFields } from "@/types/book";
import { READING_STATUSES } from "@/lib/constants";
import type { BookshelfWithRows } from "@/types/shelf";

export function BookDetailsPanel({
  userBook,
  open,
  onOpenChange,
  onStatusChange,
  onLendableChange,
  onRemove,
  onSaveDetails,
  onAssignShelf,
  onProgressUpdated,
  bookshelves,
  readOnly = false,
}: {
  userBook: UserBook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (status: ReadingStatus) => void;
  onLendableChange?: (isLendable: boolean) => void;
  onRemove?: () => void;
  onSaveDetails?: (updates: UserBookEditableFields) => Promise<{ error: unknown }>;
  onAssignShelf?: (target: { bookshelfId: string; shelfRowId: string } | null) => Promise<{ error: unknown }>;
  /** Called with the server-computed progress fields right after a reading session is saved. */
  onProgressUpdated?: (updates: Partial<UserBook>) => void;
  bookshelves?: BookshelfWithRows[];
  readOnly?: boolean;
}) {
  const [readingSessionOpen, setReadingSessionOpen] = useState(false);
  const { sessions: recentSessions, logSession } = useReadingSessions(open ? userBook?.id : undefined);

  if (!userBook) return null;
  const book = userBook.book;
  const pageCount = book?.page_count ?? null;
  const progressPercent =
    pageCount && pageCount > 0 ? Math.min(100, Math.round((userBook.current_page / pageCount) * 100)) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="flex-row items-center justify-between pr-8">
          <DialogTitle>{book?.title ?? "Untitled"}</DialogTitle>
          {!readOnly && onSaveDetails && (
            <EditBookDialog userBook={userBook} bookshelves={bookshelves} onSave={onSaveDetails} onAssignShelf={onAssignShelf} />
          )}
        </DialogHeader>

        <div className="flex gap-4">
          <div className="relative h-44 w-28 flex-shrink-0 overflow-hidden rounded bg-zinc-800">
            {book?.cover_url ? (
              <Image src={book.cover_url} alt={book.title} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500">No cover</div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm text-zinc-400">{book?.authors?.join(", ") || "Unknown author"}</p>
            <BookStatusBadge status={userBook.status} />
            <p className="text-xs text-zinc-500">
              {book?.publisher ?? "—"} {book?.published_date ? `· ${book.published_date}` : ""}
            </p>
            {book?.page_count && <p className="text-xs text-zinc-500">{book.page_count} pages</p>}
          </div>
        </div>

        {book?.description && (
          <p className="max-h-32 overflow-y-auto text-sm text-zinc-400">{book.description}</p>
        )}

        {!readOnly && (
          <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-500">Reading Progress</p>
                <p className="text-sm text-zinc-300">
                  {pageCount
                    ? `${userBook.current_page} / ${pageCount} pages${progressPercent != null ? `, ${progressPercent}%` : ""}`
                    : userBook.current_page > 0
                      ? `Page ${userBook.current_page}`
                      : "Not started"}
                </p>
                {userBook.last_read_at && (
                  <p className="text-xs text-zinc-500">
                    Last read {new Date(userBook.last_read_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Button size="sm" onClick={() => setReadingSessionOpen(true)} className="flex-shrink-0">
                <BookOpen className="mr-1.5 h-4 w-4" /> Read
              </Button>
            </div>

            {progressPercent != null && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progressPercent}%` }} />
              </div>
            )}

            {recentSessions.length > 0 && (
              <div className="space-y-1 border-t border-zinc-800 pt-2">
                <p className="text-xs font-medium text-zinc-500">Recent sessions</p>
                {recentSessions.slice(0, 3).map((session) => (
                  <p key={session.id} className="text-xs text-zinc-400">
                    {session.read_date}: pages {session.start_page}–{session.end_page}
                    {session.minutes_read != null ? ` · ${session.minutes_read} min` : ""}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-xs text-zinc-400">
          <p className="text-xs font-medium text-zinc-500">Personal Information</p>
          {userBook.genre && <p>Genre: {userBook.genre}</p>}
          {userBook.condition && <p>Condition: {userBook.condition}</p>}
          {userBook.purchase_price != null && (
            <p>
              Price: {userBook.purchase_currency ?? ""} {userBook.purchase_price}
            </p>
          )}
          {userBook.date_bought && <p>Bought: {userBook.date_bought}</p>}
          {userBook.purchase_location && <p>Where bought: {userBook.purchase_location}</p>}
          {userBook.rating != null && (
            <div className="flex items-center gap-1">
              <span>Rating:</span>
              {[1, 2, 3, 4, 5].map((value) => (
                <Star
                  key={value}
                  className={cn(
                    "h-3.5 w-3.5",
                    value <= userBook.rating! ? "fill-amber-400 text-amber-400" : "text-zinc-700"
                  )}
                />
              ))}
            </div>
          )}
          {userBook.favorite && <p>★ Favorite</p>}
          {userBook.tags && userBook.tags.length > 0 && <p>Tags: {userBook.tags.join(", ")}</p>}
          {userBook.notes && <p>Notes: {userBook.notes}</p>}
          {!userBook.genre &&
            !userBook.condition &&
            userBook.purchase_price == null &&
            !userBook.date_bought &&
            !userBook.purchase_location &&
            userBook.rating == null &&
            !userBook.favorite &&
            (!userBook.tags || userBook.tags.length === 0) &&
            !userBook.notes && <p className="text-zinc-600">No personal details yet.</p>}
        </div>

        {!readOnly && (
          <div className="space-y-4 border-t border-zinc-800 pt-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={userBook.status} onValueChange={(v) => onStatusChange?.(v as ReadingStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {READING_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {READING_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="lendable">Lendable to visitors</Label>
              <Switch
                id="lendable"
                checked={userBook.is_lendable}
                onCheckedChange={(checked) => onLendableChange?.(checked)}
              />
            </div>

            {onRemove && (
              <Button variant="destructive" className="w-full" onClick={onRemove}>
                Remove from collection
              </Button>
            )}
          </div>
        )}
      </DialogContent>

      {!readOnly && (
        <ReadingSessionDialog
          userBook={userBook}
          open={readingSessionOpen}
          onOpenChange={setReadingSessionOpen}
          onLogSession={async (input) => {
            const result = await logSession(input);
            if (!result.error && result.data) {
              onProgressUpdated?.(result.data.userBookUpdates);
            }
            return result;
          }}
          onMarkFinished={onStatusChange ? async () => onStatusChange("finished") : undefined}
        />
      )}
    </Dialog>
  );
}
