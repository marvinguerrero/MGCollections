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
import { AddBookDialog } from "@/components/books/AddBookDialog";
import { AddCustomItemDialog } from "@/components/items/AddCustomItemDialog";
import { ITEM_TYPE_OPTIONS, type ItemTypeId } from "@/lib/itemTypes";
import type { CustomItemInput } from "@/hooks/useCustomItems";
import { Plus } from "lucide-react";
import type { BookshelfWithRows } from "@/types/shelf";

/**
 * Entry point for adding anything to the collection. This component is just
 * the type-selector step + delegating to each type's own dialog — adding a
 * future item type means adding an ITEM_TYPE_OPTIONS entry and its own
 * dialog component, not changing this file's structure.
 */
export function AddItemDialog({
  userId,
  bookshelves,
  onBookAdded,
  onCustomItemAdd,
  categorySuggestions,
  trigger,
}: {
  userId: string | undefined;
  bookshelves: BookshelfWithRows[];
  onBookAdded: () => void;
  onCustomItemAdd: (input: CustomItemInput) => Promise<{ error: unknown }>;
  categorySuggestions?: string[];
  trigger?: React.ReactElement;
}) {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [activeType, setActiveType] = useState<ItemTypeId | null>(null);

  function handleChoose(type: ItemTypeId) {
    setSelectorOpen(false);
    setActiveType(type);
  }

  return (
    <>
      <Dialog open={selectorOpen} onOpenChange={setSelectorOpen}>
        <DialogTrigger
          render={
            trigger ?? (
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            )
          }
        />
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>What are you adding?</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            {ITEM_TYPE_OPTIONS.map(({ id, label, description, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleChoose(id)}
                className="flex flex-col items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900"
              >
                <Icon className="h-6 w-6 text-zinc-300" />
                <span className="text-sm font-medium text-zinc-100">{label}</span>
                <span className="text-xs text-zinc-500">{description}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AddBookDialog
        bookshelves={bookshelves}
        onAdded={onBookAdded}
        categorySuggestions={categorySuggestions}
        open={activeType === "book"}
        onOpenChange={(next) => !next && setActiveType(null)}
      />

      <AddCustomItemDialog
        userId={userId}
        onAdd={onCustomItemAdd}
        categorySuggestions={categorySuggestions}
        open={activeType === "custom"}
        onOpenChange={(next) => !next && setActiveType(null)}
      />
    </>
  );
}
