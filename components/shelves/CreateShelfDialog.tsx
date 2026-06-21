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
import { Plus } from "lucide-react";
import { SHELF_THEMES, type ShelfTheme } from "@/types/shelf";
import { toast } from "sonner";

export function CreateShelfDialog({
  onCreate,
}: {
  onCreate: (input: { name: string; description?: string; theme: ShelfTheme; rowCount: number }) => Promise<{ error: unknown } | void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState<ShelfTheme>("walnut");
  const [rowCount, setRowCount] = useState(4);
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    const result = await onCreate({ name, description, theme, rowCount });
    setSaving(false);

    if (result && "error" in result && result.error) {
      toast.error("Failed to create bookshelf");
      return;
    }

    toast.success(`Created "${name}"`);
    setOpen(false);
    setName("");
    setDescription("");
    setTheme("walnut");
    setRowCount(4);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Bookshelf
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a bookshelf</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="shelf-name">Name</Label>
            <Input id="shelf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Living Room Shelf" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shelf-desc">Description</Label>
            <Textarea id="shelf-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
              <Label htmlFor="row-count">Rows</Label>
              <Input
                id="row-count"
                type="number"
                min={1}
                max={10}
                value={rowCount}
                onChange={(e) => setRowCount(Number(e.target.value))}
              />
            </div>
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={saving}>
            {saving ? "Creating..." : "Create bookshelf"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
