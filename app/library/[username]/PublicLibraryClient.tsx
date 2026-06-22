"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookStatusBadge } from "@/components/books/BookStatusBadge";
import { LibrarySearchBar } from "@/components/books/LibrarySearchBar";
import { BookshelfView } from "@/components/shelves/BookshelfView";
import { useLibrarySearch } from "@/hooks/useLibrarySearch";
import { toast } from "sonner";
import { Home, Search, X } from "lucide-react";
import type { BookshelfWithRows } from "@/types/shelf";
import type { UserBook } from "@/types/book";

export function PublicLibraryClient({
  ownerId,
  ownerName,
  bookshelves,
}: {
  ownerId: string;
  ownerName: string;
  bookshelves: BookshelfWithRows[];
}) {
  const [selected, setSelected] = useState<UserBook | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Search never removes or reorders books — it only highlights matches in
  // place, like scanning a real shelf.
  const allUserBooks = useMemo(
    () => bookshelves.flatMap((shelf) => shelf.rows.flatMap((row) => row.positions.map((p) => p.user_book))),
    [bookshelves]
  );
  const search = useLibrarySearch(allUserBooks, bookshelves);

  async function handleSubmitRequest() {
    if (!selected || !name.trim() || !email.trim()) return;
    setRequesting(true);

    try {
      const res = await fetch("/api/borrow-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userBookId: selected.id,
          ownerId,
          requesterName: name,
          requesterEmail: email,
          message,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to send request");

      setSubmitted(true);
      toast.success("Borrow request sent!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send request");
    } finally {
      setRequesting(false);
    }
  }

  function closeDialog() {
    setSelected(null);
    setSubmitted(false);
    setName("");
    setEmail("");
    setMessage("");
  }

  return (
    <>
      <div className="sticky top-0 z-30 flex h-12 items-center gap-1 border-b border-zinc-800 bg-zinc-950/95 px-2 backdrop-blur supports-backdrop-filter:bg-zinc-950/80 sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 flex-shrink-0"
          nativeButton={false}
          render={
            <Link href="/" aria-label="Home">
              <Home className="h-5 w-5" />
            </Link>
          }
        />
        <span className="flex-1 truncate text-sm font-medium text-zinc-300 sm:hidden">{ownerName}</span>
        <div className="hidden flex-1 sm:block" />
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 flex-shrink-0"
          aria-label="Search this library"
          onClick={() => setShowSearch((s) => !s)}
        >
          {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </Button>
      </div>

      {showSearch && (
        <div className="border-b border-zinc-800 bg-zinc-950 px-3 py-2 sm:px-4">
          <LibrarySearchBar
            autoFocus
            query={search.query}
            onQueryChange={search.setQuery}
            onClear={search.clearQuery}
            matchCount={search.matchCount}
            isSearchActive={search.isSearchActive}
            placeholder="Search this library by title, author, ISBN, or status..."
          />
        </div>
      )}

      <div className="mx-auto w-full max-w-5xl space-y-10 overflow-x-hidden px-3 py-6 sm:px-6 sm:py-10">
        {bookshelves.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">This library doesn&apos;t have any public shelves yet.</p>
        ) : (
          <>
            {search.hasNoMatches && (
              <p className="text-center text-sm text-zinc-500">No books match your search.</p>
            )}
            {bookshelves.map((shelf) => (
              <BookshelfView
                key={shelf.id}
                bookshelf={shelf}
                readOnly
                onBookClick={setSelected}
                matchedUserBookIds={search.matchedUserBookIds}
              />
            ))}
          </>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.book?.title}</DialogTitle>
              </DialogHeader>
              <div className="flex gap-4">
                <div className="relative h-40 w-28 flex-shrink-0 overflow-hidden rounded bg-zinc-800">
                  {selected.book?.cover_url && (
                    <Image src={selected.book.cover_url} alt={selected.book.title} fill className="object-cover" unoptimized />
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-zinc-400">{selected.book?.authors?.join(", ")}</p>
                  <BookStatusBadge status={selected.status} />
                </div>
              </div>

              {submitted ? (
                <p className="text-sm text-zinc-300">Your request has been sent to the owner.</p>
              ) : selected.is_lendable && selected.status !== "lent_out" ? (
                <div className="space-y-3 border-t border-zinc-800 pt-4">
                  <h3 className="text-sm font-medium text-zinc-200">Request to borrow</h3>
                  <div className="space-y-1.5">
                    <Label htmlFor="req-name">Your name</Label>
                    <Input id="req-name" className="h-11" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="req-email">Your email</Label>
                    <Input
                      id="req-email"
                      type="email"
                      className="h-11"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="req-message">Message (optional)</Label>
                    <Textarea id="req-message" value={message} onChange={(e) => setMessage(e.target.value)} />
                  </div>
                  <Button className="h-11 w-full" onClick={handleSubmitRequest} disabled={requesting}>
                    {requesting ? "Sending..." : "Send request"}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">This book isn&apos;t currently available to borrow.</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
