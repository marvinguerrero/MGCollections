"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { uploadItemImage } from "@/lib/uploadItemImage";
import { UNCATEGORIZED } from "@/lib/constants";
import { ITEM_CONDITIONS, type CustomItem, type CustomItemEditableFields, type ItemCondition } from "@/types/item";

const NO_CONDITION_VALUE = "none";

export function CustomItemDetailsDialog({
  item,
  userId,
  open,
  onOpenChange,
  onSave,
  onRemove,
  categorySuggestions = [],
}: {
  item: CustomItem | null;
  userId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: CustomItemEditableFields) => Promise<{ error: unknown }>;
  onRemove: () => Promise<{ error: unknown }>;
  categorySuggestions?: string[];
}) {
  const supabase = createSupabaseBrowserClient();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseCurrency, setPurchaseCurrency] = useState("");
  const [dateBought, setDateBought] = useState("");
  const [purchaseLocation, setPurchaseLocation] = useState("");
  const [condition, setCondition] = useState<ItemCondition | "">("");
  const [location, setLocation] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !item) return;
    setName(item.name);
    setCategory(item.category ?? "");
    setBrand(item.brand ?? "");
    setModel(item.model ?? "");
    setPurchasePrice(item.purchase_price != null ? String(item.purchase_price) : "");
    setPurchaseCurrency(item.purchase_currency ?? "");
    setDateBought(item.date_bought ?? "");
    setPurchaseLocation(item.purchase_location ?? "");
    setCondition(item.condition ?? "");
    setLocation(item.location ?? "");
    setWarrantyExpiry(item.warranty_expiry ?? "");
    setNotes(item.notes ?? "");
    setImageUrl(item.image_url);
    setImageFile(null);
    setImagePreview(null);
    setNameError(null);
    setPriceError(null);
  }, [open, item]);

  if (!item) return null;

  function handleImageChange(file: File | null) {
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSave() {
    if (!name.trim()) {
      setNameError("Item name is required");
      return;
    }
    if (purchasePrice && !Number.isFinite(Number(purchasePrice))) {
      setPriceError("Price must be a number");
      return;
    }
    setNameError(null);
    setPriceError(null);
    setSaving(true);

    let nextImageUrl = imageUrl;
    if (imageFile && userId) {
      const { url, error } = await uploadItemImage(supabase, userId, imageFile);
      if (error) {
        toast.error("Failed to upload image");
        setSaving(false);
        return;
      }
      nextImageUrl = url;
    }

    const { error } = await onSave({
      name: name.trim(),
      category: category.trim() || UNCATEGORIZED,
      brand: brand.trim() || null,
      model: model.trim() || null,
      purchase_price: purchasePrice ? Number(purchasePrice) : null,
      purchase_currency: purchaseCurrency.trim() || null,
      date_bought: dateBought || null,
      purchase_location: purchaseLocation.trim() || null,
      condition: condition || null,
      location: location.trim() || null,
      warranty_expiry: warrantyExpiry || null,
      notes: notes.trim() || null,
      image_url: nextImageUrl,
    });

    setSaving(false);

    if (error) {
      toast.error("Failed to update item");
      return;
    }

    toast.success("Item updated");
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!confirm(`Remove "${name}" from your collection?`)) return;
    const { error } = await onRemove();
    if (error) {
      toast.error("Failed to remove item");
      return;
    }
    toast.success("Item removed");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-item-name">Item name</Label>
            <Input
              id="edit-item-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(null);
              }}
              aria-invalid={!!nameError}
            />
            {nameError && <p className="text-xs text-red-400">{nameError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-item-image">Image</Label>
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-zinc-800">
                {imagePreview || imageUrl ? (
                  <Image src={imagePreview ?? imageUrl!} alt={name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-600">
                    <Upload className="h-5 w-5" />
                  </div>
                )}
              </div>
              <Input
                id="edit-item-image"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-item-category">Category</Label>
              <Input
                id="edit-item-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                list="edit-item-category-options"
                placeholder={UNCATEGORIZED}
              />
              <datalist id="edit-item-category-options">
                {categorySuggestions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select
                value={condition || NO_CONDITION_VALUE}
                onValueChange={(v) => setCondition(v === NO_CONDITION_VALUE ? "" : (v as ItemCondition))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Not set" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CONDITION_VALUE}>Not set</SelectItem>
                  {ITEM_CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-item-brand">Brand</Label>
              <Input id="edit-item-brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-item-model">Model</Label>
              <Input id="edit-item-model" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-item-price">Purchase price</Label>
              <Input
                id="edit-item-price"
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
              <Label htmlFor="edit-item-currency">Currency</Label>
              <Input
                id="edit-item-currency"
                value={purchaseCurrency}
                onChange={(e) => setPurchaseCurrency(e.target.value)}
                className="w-20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-item-date-bought">Date bought</Label>
              <Input
                id="edit-item-date-bought"
                type="date"
                value={dateBought}
                onChange={(e) => setDateBought(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-item-location">Where bought</Label>
              <Input
                id="edit-item-location"
                value={purchaseLocation}
                onChange={(e) => setPurchaseLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-item-loc">Location</Label>
              <Input
                id="edit-item-loc"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bedroom Closet"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-item-warranty">Warranty expires</Label>
              <Input
                id="edit-item-warranty"
                type="date"
                value={warrantyExpiry}
                onChange={(e) => setWarrantyExpiry(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-item-notes">Notes</Label>
            <Textarea id="edit-item-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex gap-2">
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              Remove
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
