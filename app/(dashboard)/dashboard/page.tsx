"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Library,
  HandCoins,
  CalendarDays,
  Search,
  BookOpen,
  ShieldAlert,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useBooks } from "@/hooks/useBooks";
import { useCustomItems } from "@/hooks/useCustomItems";
import { useLoans } from "@/hooks/useLoans";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { mergeCalendarEvents } from "@/lib/calendarEvents";
import { StatCard } from "@/components/dashboard/StatCard";
import { AddItemDialog } from "@/components/items/AddItemDialog";
import { ReadingProgressCircle } from "@/components/books/ReadingProgressCircle";
import { CalendarEventCard } from "@/components/calendar/CalendarEventCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useShelves } from "@/hooks/useShelves";
import { UNCATEGORIZED } from "@/lib/constants";

const WARRANTY_WINDOW_DAYS = 30;

function daysFromNow(dateStr: string) {
  const diffMs = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export default function HomePage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [userId, setUserId] = useState<string | undefined>();
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, [supabase]);

  const { userBooks, refetch: refetchBooks } = useBooks(userId);
  const { items, addItem } = useCustomItems(userId);
  const { bookshelves } = useShelves(userId);
  const { loans } = useLoans(userId);
  const { events: manualEvents } = useCalendarEvents(userId);

  const allEvents = useMemo(
    () => mergeCalendarEvents(userBooks, manualEvents, items),
    [userBooks, manualEvents, items]
  );

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const upcomingEvents = useMemo(
    () =>
      allEvents
        .filter((e) => e.event_date >= today)
        .sort((a, b) => a.event_date.localeCompare(b.event_date))
        .slice(0, 4),
    [allEvents, today]
  );
  const recentEvents = useMemo(
    () => [...allEvents].sort((a, b) => b.event_date.localeCompare(a.event_date)).slice(0, 5),
    [allEvents]
  );

  const continueReading = useMemo(() => {
    const reading = userBooks.filter((ub) => ub.status === "reading");
    return reading.sort((a, b) => (b.last_read_at ?? "").localeCompare(a.last_read_at ?? ""))[0] ?? null;
  }, [userBooks]);

  const activeLoans = loans.filter((l) => l.status === "active");
  const dueSoon = [...activeLoans]
    .filter((l) => l.due_date)
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
    .slice(0, 3);

  const expiringWarranties = useMemo(
    () =>
      items
        .filter((i) => i.warranty_expiry && daysFromNow(i.warranty_expiry) <= WARRANTY_WINDOW_DAYS)
        .sort((a, b) => (a.warranty_expiry ?? "").localeCompare(b.warranty_expiry ?? "")),
    [items]
  );

  const itemCategoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      const key = item.category && item.category !== UNCATEGORIZED ? item.category : "Other";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [items]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(searchValue ? `/collection?q=${encodeURIComponent(searchValue)}` : "/collection");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Welcome back</h1>
        <p className="text-sm text-zinc-400">Here&apos;s what&apos;s happening across your collection.</p>
      </div>

      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search everything — books, items, categories, brands, locations..."
          className="pl-9"
        />
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300">Collection Summary</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Link href="/collection">
            <StatCard label="Books" value={userBooks.length} icon={Library} />
          </Link>
          {itemCategoryCounts.map(([category, count]) => (
            <Link
              key={category}
              href={category === "Other" ? "/collection" : `/collection?category=${encodeURIComponent(category)}`}
            >
              <StatCard label={category} value={count} />
            </Link>
          ))}
          {items.length === 0 && (
            <Link href="/collection">
              <StatCard label="Other items" value={0} />
            </Link>
          )}
        </div>
      </section>

      {continueReading && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300">Continue Reading</h2>
          <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:flex-row sm:items-start">
            <div className="relative h-32 w-22 flex-shrink-0 overflow-hidden rounded bg-zinc-800">
              {continueReading.book?.cover_url ? (
                <Image
                  src={continueReading.book.cover_url}
                  alt={continueReading.book.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : null}
            </div>
            <div className="flex flex-1 flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-center sm:text-left">
                <p className="font-medium text-zinc-100">{continueReading.book?.title}</p>
                <p className="text-sm text-zinc-400">{continueReading.book?.authors?.join(", ")}</p>
              </div>
              <ReadingProgressCircle
                currentPage={continueReading.current_page}
                pageCount={continueReading.book?.page_count ?? null}
              />
              <Link href={`/collection?openBook=${continueReading.id}`}>
                <Button>
                  <BookOpen className="mr-1.5 h-4 w-4" /> Continue Reading
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {(dueSoon.length > 0 || expiringWarranties.length > 0 || upcomingEvents.length > 0) && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300">Upcoming</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {expiringWarranties.length > 0 && (
              <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
                  <ShieldAlert className="h-4 w-4" /> Warranty expiring
                </p>
                {expiringWarranties.slice(0, 3).map((item) => (
                  <p key={item.id} className="text-sm text-zinc-300">
                    {item.name} — {item.warranty_expiry}
                  </p>
                ))}
              </div>
            )}
            {dueSoon.length > 0 && (
              <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <HandCoins className="h-4 w-4" /> Books due back
                </p>
                {dueSoon.map((loan) => (
                  <p key={loan.id} className="text-sm text-zinc-300">
                    {loan.user_book?.book?.title} — due {loan.due_date}
                  </p>
                ))}
              </div>
            )}
            {upcomingEvents.length > 0 && (
              <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:col-span-2">
                <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <CalendarDays className="h-4 w-4" /> Upcoming events
                </p>
                {upcomingEvents.map((event) => (
                  <p key={event.id} className="text-sm text-zinc-300">
                    {event.title} — {event.event_date}
                  </p>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300">Recent Activity</h2>
        {recentEvents.length === 0 ? (
          <p className="text-sm text-zinc-500">Nothing yet — add a book or item to get started.</p>
        ) : (
          <div className="space-y-2">
            {recentEvents.map((event) => (
              <CalendarEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <AddItemDialog
            userId={userId}
            bookshelves={bookshelves}
            onBookAdded={refetchBooks}
            onCustomItemAdd={addItem}
          />
          <Link href="/collection">
            <Button variant="outline">Open Collection</Button>
          </Link>
          <Link href="/calendar">
            <Button variant="outline">Open Calendar</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
