"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type { BookshelfWithRows } from "@/types/shelf";

export function ShelfBuilder({
  bookshelf,
  onUpdateDims,
  onAddRow,
  onRemoveRow,
}: {
  bookshelf: BookshelfWithRows;
  onUpdateDims: (updates: { width_cm?: number; height_cm?: number }) => void;
  onAddRow: () => void;
  onRemoveRow: (rowId: string) => void;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
      <h3 className="text-sm font-semibold text-zinc-100">Shelf dimensions</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="width">Width (cm)</Label>
          <Input
            id="width"
            type="number"
            min={30}
            value={bookshelf.width_cm}
            onChange={(e) => onUpdateDims({ width_cm: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="height">Height (cm)</Label>
          <Input
            id="height"
            type="number"
            min={30}
            value={bookshelf.height_cm}
            onChange={(e) => onUpdateDims({ height_cm: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">Rows ({bookshelf.rows.length})</h3>
        <Button size="sm" variant="secondary" onClick={onAddRow}>
          <Plus className="mr-1.5 h-4 w-4" /> Add row
        </Button>
      </div>

      <div className="space-y-2">
        {bookshelf.rows.map((row, i) => (
          <div
            key={row.id}
            className="flex items-center justify-between rounded-md border border-zinc-800 px-3 py-2 text-sm text-zinc-300"
          >
            <span>
              {row.name ?? `Row ${i + 1}`} · {row.positions.length} book{row.positions.length === 1 ? "" : "s"}
            </span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onRemoveRow(row.id)}
              disabled={row.positions.length > 0}
              title={row.positions.length > 0 ? "Move books out of this row first" : "Remove row"}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
