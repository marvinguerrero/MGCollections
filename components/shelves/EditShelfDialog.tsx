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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { SHELF_THEMES, SHELF_VISIBILITIES, type Bookshelf, type ShelfTheme, type ShelfVisibility } from "@/types/shelf";
import { SHELF_VISIBILITY_LABELS } from "@/lib/constants";
import { toast } from "sonner";

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return fallback;
}

export function EditShelfDialog({
  bookshelf,
  onUpdate,
  onDelete,
}: {
  bookshelf: Bookshelf;
  onUpdate: (
    updates: Partial<Pick<Bookshelf, "name" | "description" | "theme" | "visibility">>
  ) => Promise<{ error: unknown } | void>;
  onDelete: () => Promise<{ error: unknown } | void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(bookshelf.name);
  const [description, setDescription] = useState(bookshelf.description ?? "");
  const [theme, setTheme] = useState<ShelfTheme>((bookshelf.theme as ShelfTheme) ?? "walnut");
  const [visibility, setVisibility] = useState<ShelfVisibility>(bookshelf.visibility ?? "private");
  const [saving, setSaving] = useState(false);

  function handleVisibilityChange(next: ShelfVisibility) {
    if (next === "public" && visibility !== "public") {
      toast.warning("Books in this shelf will be visible publicly unless individually marked private.");
    }
    setVisibility(next);
  }

  async function handleSave() {
    setSaving(true);
    const result = await onUpdate({ name, description, theme, visibility });
    setSaving(false);
    if (result && "error" in result && result.error) {
      console.error("Failed to update bookshelf", result.error);
      toast.error(errorMessage(result.error, "Failed to update bookshelf"));
      return;
    }
    toast.success("Bookshelf updated");
    setOpen(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${bookshelf.name}"? Books on it will need a new home.`)) return;
    const result = await onDelete();
    if (result && "error" in result && result.error) {
      console.error("Failed to delete bookshelf", result.error);
      toast.error(errorMessage(result.error, "Failed to delete bookshelf"));
      return;
    }
    toast.success("Bookshelf deleted");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="icon" variant="ghost">
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit bookshelf</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-shelf-name">Name</Label>
            <Input id="edit-shelf-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-shelf-desc">Description</Label>
            <Textarea id="edit-shelf-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as ShelfTheme)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHELF_THEMES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Visibility</Label>
            <Select value={visibility} onValueChange={(v) => handleVisibilityChange(v as ShelfVisibility)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHELF_VISIBILITIES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {SHELF_VISIBILITY_LABELS[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {visibility === "public" && (
              <p className="text-xs text-amber-400">
                Books in this shelf will be visible publicly unless individually marked private.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
