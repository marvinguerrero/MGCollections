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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Package, Upload } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { uploadItemImage } from "@/lib/uploadItemImage";
import { DEFAULT_PURCHASE_CURRENCY, UNCATEGORIZED } from "@/lib/constants";
import { ITEM_CONDITIONS, type ItemCondition } from "@/types/item";
import type { CustomItemInput } from "@/hooks/useCustomItems";

const NO_CONDITION_VALUE = "none";

export function AddCustomItemDialog({
  userId,
  open,
  onOpenChange,
  onAdd,
  categorySuggestions = [],
}: {
  userId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (input: CustomItemInput) => Promise<{ error: unknown }>;
  categorySuggestions?: string[];
}) {
  const supabase = createSupabaseBrowserClient();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseCurrency, setPurchaseCurrency] = useState(DEFAULT_PURCHASE_CURRENCY);
  const [dateBought, setDateBought] = useState("");
  const [purchaseLocation, setPurchaseLocation] = useState("");
  const [condition, setCondition] = useState<ItemCondition | "">("");
  const [location, setLocation] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setName("");
    setCategory("");
    setBrand("");
    setModel("");
    setPurchasePrice("");
    setPurchaseCurrency(DEFAULT_PURCHASE_CURRENCY);
    setDateBought("");
    setPurchaseLocation("");
    setCondition("");
    setLocation("");
    setWarrantyExpiry("");
    setNotes("");
    setImageFile(null);
    setImagePreview(null);
    setNameError(null);
    setPriceError(null);
  }

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

    let imageUrl: string | null = null;
    if (imageFile && userId) {
      const { url, error } = await uploadItemImage(supabase, userId, imageFile);
      if (error) {
        toast.error("Failed to upload image");
        setSaving(false);
        return;
      }
      imageUrl = url;
    }

    const { error } = await onAdd({
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
      image_url: imageUrl,
    });

    setSaving(false);

    if (error) {
      toast.error("Failed to add item");
      return;
    }

    toast.success(`Added "${name.trim()}" to your collection`);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Add a custom item
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">Item name</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(null);
              }}
              placeholder="e.g. Sony WH-1000XM5 Headphones"
              aria-invalid={!!nameError}
            />
            {nameError && <p className="text-xs text-red-400">{nameError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-image">Image (optional)</Label>
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-zinc-800">
                {imagePreview ? (
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-600">
                    <Upload className="h-5 w-5" />
                  </div>
                )}
              </div>
              <Input
                id="item-image"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="item-category">Category</Label>
              <Input
                id="item-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                list="custom-item-category-options"
                placeholder={UNCATEGORIZED}
              />
              <datalist id="custom-item-category-options">
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
              <Label htmlFor="item-brand">Brand</Label>
              <Input id="item-brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-model">Model</Label>
              <Input id="item-model" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-2">
              <Label htmlFor="item-price">Purchase price</Label>
              <Input
                id="item-price"
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
              <Label htmlFor="item-currency">Currency</Label>
              <Input
                id="item-currency"
                value={purchaseCurrency}
                onChange={(e) => setPurchaseCurrency(e.target.value)}
                className="w-20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="item-date-bought">Date bought</Label>
              <Input
                id="item-date-bought"
                type="date"
                value={dateBought}
                onChange={(e) => setDateBought(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-location">Where bought</Label>
              <Input
                id="item-location"
                value={purchaseLocation}
                onChange={(e) => setPurchaseLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="item-location">Location</Label>
              <Input
                id="item-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bedroom Closet"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-warranty">Warranty expires</Label>
              <Input
                id="item-warranty"
                type="date"
                value={warrantyExpiry}
                onChange={(e) => setWarrantyExpiry(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-notes">Notes</Label>
            <Textarea
              id="item-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </div>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? "Adding..." : "Add to collection"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
