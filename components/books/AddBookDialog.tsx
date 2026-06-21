"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BookSearch } from "@/components/books/BookSearch";
import { READING_STATUS_LABELS, type NormalizedBookResult, type ReadingStatus } from "@/types/book";
import { READING_STATUSES } from "@/lib/constants";
import type { BookshelfWithRows } from "@/types/shelf";
import { Plus, BookOpen } from "lucide-react";
import { toast } from "sonner";

export function AddBookDialog({
  bookshelves,
  onAdded,
  trigger,
}: {
  bookshelves: BookshelfWithRows[];
  onAdded: () => void;
  trigger?: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<NormalizedBookResult | null>(null);
  const [status, setStatus] = useState<ReadingStatus>("owned_unread");
  const [shelfRowKey, setShelfRowKey] = useState<string>("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setSelected(null);
    setStatus("owned_unread");
    setShelfRowKey("");
  }

  async function handleAdd() {
    if (!selected) return;
    setSaving(true);

    const [bookshelfId, shelfRowId] = shelfRowKey ? shelfRowKey.split("::") : [undefined, undefined];

    try {
      const res = await fetch("/api/books/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book: selected, status, bookshelfId, shelfRowId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to add book");

      toast.success(`Added "${selected.title}" to your collection`);
      setOpen(false);
      reset();
      onAdded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add book");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Book
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Add a book
          </DialogTitle>
        </DialogHeader>

        {!selected ? (
          <BookSearch onSelect={setSelected} />
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-100">{selected.title}</p>
                <p className="text-xs text-zinc-400">{selected.authors.join(", ")}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                Change
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ReadingStatus)}>
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

            {bookshelves.length > 0 && (
              <div className="space-y-2">
                <Label>Shelf placement (optional)</Label>
                <Select value={shelfRowKey} onValueChange={(v) => setShelfRowKey(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Place on a shelf later" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookshelves.map((shelf) =>
                      shelf.rows.map((row) => (
                        <SelectItem key={row.id} value={`${shelf.id}::${row.id}`}>
                          {shelf.name} — {row.name ?? `Row ${row.row_index + 1}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button className="w-full" onClick={handleAdd} disabled={saving}>
              {saving ? "Adding..." : "Add to collection"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
