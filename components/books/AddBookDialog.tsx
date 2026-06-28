"use client";

import { useState } from "react";
import Image from "next/image";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookSearch } from "@/components/books/BookSearch";
import {
  BOOK_CONDITIONS,
  READING_STATUS_LABELS,
  type BookCondition,
  type NormalizedBookResult,
  type ReadingStatus,
} from "@/types/book";
import { DEFAULT_BOOK_CONDITION, DEFAULT_PURCHASE_CURRENCY, READING_STATUSES, UNCATEGORIZED } from "@/lib/constants";
import { findFirstEmptyIndex } from "@/lib/shelves/positionUtils";
import type { BookshelfWithRows } from "@/types/shelf";
import { Plus, BookOpen } from "lucide-react";
import { toast } from "sonner";

export function AddBookDialog({
  bookshelves,
  onAdded,
  trigger,
  categorySuggestions = [],
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  bookshelves: BookshelfWithRows[];
  onAdded: () => void;
  trigger?: React.ReactElement;
  categorySuggestions?: string[];
  /** Default mode renders its own trigger button. Pass `open`/`onOpenChange` instead to drive it externally (e.g. from AddItemDialog's type-selector step). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? setControlledOpen! : setUncontrolledOpen;
  const [selected, setSelected] = useState<NormalizedBookResult | null>(null);
  const [status, setStatus] = useState<ReadingStatus>("owned_unread");
  const [shelfRowKey, setShelfRowKey] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [genre, setGenre] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState<BookCondition>(DEFAULT_BOOK_CONDITION);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseCurrency, setPurchaseCurrency] = useState(DEFAULT_PURCHASE_CURRENCY);
  const [dateBought, setDateBought] = useState("");
  const [purchaseLocation, setPurchaseLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [priceError, setPriceError] = useState<string | null>(null);

  function reset() {
    setSelected(null);
    setStatus("owned_unread");
    setShelfRowKey("");
    setGenre("");
    setCategory("");
    setCondition(DEFAULT_BOOK_CONDITION);
    setPurchasePrice("");
    setPurchaseCurrency(DEFAULT_PURCHASE_CURRENCY);
    setDateBought("");
    setPurchaseLocation("");
    setNotes("");
    setPriceError(null);
  }

  function handleSelect(result: NormalizedBookResult) {
    setSelected(result);
    setGenre(result.genre ?? "");
  }

  async function handleAdd() {
    if (!selected) return;

    if (purchasePrice && !Number.isFinite(Number(purchasePrice))) {
      setPriceError("Price must be a number");
      return;
    }
    setPriceError(null);
    setSaving(true);

    const [bookshelfId, shelfRowId] = shelfRowKey ? shelfRowKey.split("::") : [undefined, undefined];
    const row = shelfRowId
      ? bookshelves.flatMap((shelf) => shelf.rows).find((r) => r.id === shelfRowId)
      : undefined;
    const positionIndex = row ? findFirstEmptyIndex(row.positions) : 0;

    try {
      const res = await fetch("/api/books/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book: selected,
          status,
          bookshelfId,
          shelfRowId,
          positionIndex,
          genre: genre || undefined,
          category: category || UNCATEGORIZED,
          condition,
          purchasePrice: purchasePrice || undefined,
          purchaseCurrency: purchaseCurrency || undefined,
          dateBought: dateBought || undefined,
          purchaseLocation: purchaseLocation || undefined,
          notes: notes || undefined,
        }),
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
      {!isControlled && (
        <DialogTrigger
          render={
            trigger ?? (
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Book
              </Button>
            )
          }
        />
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Add a book
          </DialogTitle>
        </DialogHeader>

        {!selected ? (
          <BookSearch onSelect={handleSelect} />
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded bg-zinc-800">
                {selected.coverUrl ? (
                  <Image src={selected.coverUrl} alt={selected.title} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-zinc-500">No cover</div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-100">{selected.title}</p>
                <p className="text-xs text-zinc-400">{selected.authors.join(", ") || "Unknown author"}</p>
                {selected.genre && <p className="mt-1 text-xs text-zinc-500">Genre (from API): {selected.genre}</p>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelected(null);
                  setGenre("");
                }}
              >
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

            <div className="space-y-4 border-t border-zinc-800 pt-4">
              <p className="text-xs font-medium text-zinc-500">Personal inventory (optional)</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="add-book-genre">Genre</Label>
                  <Input
                    id="add-book-genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="e.g. Fantasy"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select value={condition} onValueChange={(v) => setCondition(v as BookCondition)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BOOK_CONDITIONS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-book-category">Category</Label>
                <Input
                  id="add-book-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  list="add-book-category-options"
                  placeholder={UNCATEGORIZED}
                />
                <datalist id="add-book-category-options">
                  {categorySuggestions.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="space-y-2">
                  <Label htmlFor="add-book-price">Purchase price</Label>
                  <Input
                    id="add-book-price"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={purchasePrice}
                    onChange={(e) => {
                      setPurchasePrice(e.target.value);
                      setPriceError(null);
                    }}
                    placeholder="0.00"
                    aria-invalid={!!priceError}
                  />
                  {priceError && <p className="text-xs text-red-400">{priceError}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-book-currency">Currency</Label>
                  <Input
                    id="add-book-currency"
                    value={purchaseCurrency}
                    onChange={(e) => setPurchaseCurrency(e.target.value)}
                    className="w-20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-book-date-bought">Date bought</Label>
                <Input
                  id="add-book-date-bought"
                  type="date"
                  value={dateBought}
                  onChange={(e) => setDateBought(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-book-location">Store / Where bought</Label>
                <Input
                  id="add-book-location"
                  value={purchaseLocation}
                  onChange={(e) => setPurchaseLocation(e.target.value)}
                  placeholder="e.g. National Bookstore"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-book-notes">Notes</Label>
                <Textarea
                  id="add-book-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <Button className="w-full" onClick={handleAdd} disabled={saving}>
              {saving ? "Adding..." : "Add to collection"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
