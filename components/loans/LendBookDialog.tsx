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
import { toast } from "sonner";
import type { UserBook } from "@/types/book";

export function LendBookDialog({
  userBook,
  onLend,
  trigger,
}: {
  userBook: UserBook;
  onLend: (input: { borrowerName: string; borrowerEmail?: string; dueDate?: string; notes?: string }) => Promise<{ error: unknown } | void>;
  trigger?: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerEmail, setBorrowerEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleLend() {
    if (!borrowerName.trim()) return;
    setSaving(true);
    const result = await onLend({ borrowerName, borrowerEmail, dueDate, notes });
    setSaving(false);

    if (result && "error" in result && result.error) {
      toast.error("Failed to record loan");
      return;
    }

    toast.success(`Marked "${userBook.book?.title}" as lent out`);
    setOpen(false);
    setBorrowerName("");
    setBorrowerEmail("");
    setDueDate("");
    setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button className="h-10 w-full sm:w-auto">Lend</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lend &ldquo;{userBook.book?.title}&rdquo;</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="borrower-name">Borrower name</Label>
            <Input id="borrower-name" value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="borrower-email">Borrower email (optional)</Label>
            <Input id="borrower-email" type="email" value={borrowerEmail} onChange={(e) => setBorrowerEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="due-date">Due date (optional)</Label>
            <Input id="due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loan-notes">Notes (optional)</Label>
            <Textarea id="loan-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleLend} disabled={saving}>
            {saving ? "Saving..." : "Confirm loan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
