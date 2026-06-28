"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Pencil, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DEFAULT_PURCHASE_CURRENCY, READING_STATUSES, UNCATEGORIZED } from "@/lib/constants";
import {
  BOOK_CONDITIONS,
  READING_STATUS_LABELS,
  RATING_VALUES,
  type BookCondition,
  type ReadingStatus,
  type UserBook,
  type UserBookEditableFields,
} from "@/types/book";
import type { BookshelfWithRows } from "@/types/shelf";

const NO_SHELF_VALUE = "none";
const NO_CONDITION_VALUE = "none";

export function EditBookDialog({
  userBook,
  bookshelves = [],
  categorySuggestions = [],
  onSave,
  onAssignShelf,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  userBook: UserBook;
  bookshelves?: BookshelfWithRows[];
  categorySuggestions?: string[];
  onSave: (updates: UserBookEditableFields) => Promise<{ error: unknown }>;
  onAssignShelf?: (target: { bookshelfId: string; shelfRowId: string } | null) => Promise<{ error: unknown }>;
  /** Default mode renders its own trigger button. Pass `open`/`onOpenChange` instead to drive it externally (e.g. from a dropdown menu item, where a Dialog can't be nested inside a Menu.Item). */
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? setControlledOpen! : setUncontrolledOpen;
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState<ReadingStatus>(userBook.status);
  const [genre, setGenre] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState<BookCondition | "">("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseCurrency, setPurchaseCurrency] = useState(DEFAULT_PURCHASE_CURRENCY);
  const [dateBought, setDateBought] = useState("");
  const [purchaseLocation, setPurchaseLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [shelfRowKey, setShelfRowKey] = useState<string>(NO_SHELF_VALUE);
  const [priceError, setPriceError] = useState<string | null>(null);

  const currentPosition = bookshelves
    .flatMap((shelf) => shelf.rows.map((row) => ({ shelf, row })))
    .find(({ row }) => row.positions.some((p) => p.user_book_id === userBook.id));

  useEffect(() => {
    if (!open) return;
    setStatus(userBook.status);
    setGenre(userBook.genre ?? "");
    setCategory(userBook.category ?? "");
    setCondition(userBook.condition ?? "");
    setPurchasePrice(userBook.purchase_price != null ? String(userBook.purchase_price) : "");
    setPurchaseCurrency(userBook.purchase_currency ?? DEFAULT_PURCHASE_CURRENCY);
    setDateBought(userBook.date_bought ?? "");
    setPurchaseLocation(userBook.purchase_location ?? "");
    setNotes(userBook.notes ?? "");
    setRating(userBook.rating ?? null);
    setFavorite(userBook.favorite);
    setTagsInput((userBook.tags ?? []).join(", "));
    setShelfRowKey(currentPosition ? `${currentPosition.shelf.id}::${currentPosition.row.id}` : NO_SHELF_VALUE);
    setPriceError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userBook]);

  async function handleSave() {
    if (purchasePrice && !Number.isFinite(Number(purchasePrice))) {
      setPriceError("Price must be a number");
      return;
    }
    setPriceError(null);
    setSaving(true);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const { error } = await onSave({
      status,
      genre: genre.trim() || null,
      category: category.trim() || UNCATEGORIZED,
      condition: condition || null,
      purchase_price: purchasePrice ? Number(purchasePrice) : null,
      purchase_currency: purchaseCurrency.trim() || null,
      date_bought: dateBought || null,
      purchase_location: purchaseLocation.trim() || null,
      notes: notes.trim() || null,
      rating,
      favorite,
      tags,
    });

    if (error) {
      toast.error("Failed to update book");
      setSaving(false);
      return;
    }

    if (onAssignShelf) {
      const target =
        shelfRowKey === NO_SHELF_VALUE
          ? null
          : (() => {
              const [bookshelfId, shelfRowId] = shelfRowKey.split("::");
              return { bookshelfId, shelfRowId };
            })();

      const previousKey = currentPosition ? `${currentPosition.shelf.id}::${currentPosition.row.id}` : NO_SHELF_VALUE;
      if (shelfRowKey !== previousKey) {
        const { error: shelfError } = await onAssignShelf(target);
        if (shelfError) {
          toast.error("Book updated, but shelf assignment failed");
          setSaving(false);
          setOpen(false);
          return;
        }
      }
    }

    toast.success("Book updated");
    setSaving(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger
          render={
            trigger ?? (
              <Button variant="ghost" size="sm">
                <Pencil className="mr-1.5 h-4 w-4" /> Edit Book
              </Button>
            )
          }
        />
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit “{userBook.book?.title ?? "book"}”</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-medium text-zinc-500">General</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-book-genre">Genre</Label>
                <Input id="edit-book-genre" value={genre} onChange={(e) => setGenre(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ReadingStatus)}>
                  <SelectTrigger className="w-full">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-book-category">Category</Label>
              <Input
                id="edit-book-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                list="edit-book-category-options"
                placeholder={UNCATEGORIZED}
              />
              <datalist id="edit-book-category-options">
                {categorySuggestions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <p className="text-xs font-medium text-zinc-500">Purchase</p>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-book-price">Purchase price</Label>
                <Input
                  id="edit-book-price"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={purchasePrice}
                  onChange={(e) => {
                    setPurchasePrice(e.target.value);
                    setPriceError(null);
                  }}
                  aria-invalid={!!priceError}
                />
                {priceError && <p className="text-xs text-red-400">{priceError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-book-currency">Currency</Label>
                <Input
                  id="edit-book-currency"
                  value={purchaseCurrency}
                  onChange={(e) => setPurchaseCurrency(e.target.value)}
                  className="w-20"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-book-date">Date bought</Label>
                <Input
                  id="edit-book-date"
                  type="date"
                  value={dateBought}
                  onChange={(e) => setDateBought(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-book-location">Where bought</Label>
                <Input
                  id="edit-book-location"
                  value={purchaseLocation}
                  onChange={(e) => setPurchaseLocation(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-zinc-800 pt-4">
            <p className="text-xs font-medium text-zinc-500">Condition</p>
            <Select
              value={condition || NO_CONDITION_VALUE}
              onValueChange={(v) => setCondition(v === NO_CONDITION_VALUE ? "" : (v as BookCondition))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Not set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CONDITION_VALUE}>Not set</SelectItem>
                {BOOK_CONDITIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 border-t border-zinc-800 pt-4">
            <Label htmlFor="edit-book-notes">Personal notes</Label>
            <Textarea
              id="edit-book-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </div>

          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <p className="text-xs font-medium text-zinc-500">Reading</p>
            <div className="flex items-center justify-between">
              <Label>Rating</Label>
              <div className="flex items-center gap-1">
                {RATING_VALUES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(rating === value ? null : value)}
                    aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
                  >
                    <Star
                      className={cn(
                        "h-5 w-5 transition-colors",
                        rating != null && value <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-600 hover:text-zinc-400"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-book-favorite">Favorite</Label>
              <Switch id="edit-book-favorite" checked={favorite} onCheckedChange={setFavorite} />
            </div>
          </div>

          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <p className="text-xs font-medium text-zinc-500">Organization</p>
            <div className="space-y-2">
              <Label htmlFor="edit-book-tags">Tags</Label>
              <Input
                id="edit-book-tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Comma-separated, e.g. signed, gift"
              />
            </div>
            {onAssignShelf && bookshelves.length > 0 && (
              <div className="space-y-2">
                <Label>Shelf</Label>
                <Select value={shelfRowKey} onValueChange={(v) => setShelfRowKey(v ?? NO_SHELF_VALUE)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SHELF_VALUE}>Unassigned</SelectItem>
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
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
