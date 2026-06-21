import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentBooks } from "@/components/dashboard/RecentBooks";
import { RecentLoans } from "@/components/dashboard/RecentLoans";
import type { UserBook } from "@/types/book";
import type { Loan } from "@/types/loan";
import { BookMarked, BookOpen, CheckCircle2, HandCoins, Library, Rows3 } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: userBooks }, { data: bookshelves }, { data: loans }] = await Promise.all([
    supabase
      .from("user_books")
      .select("*, book:books(*)")
      .eq("user_id", user.id)
      .order("date_added", { ascending: false }),
    supabase.from("bookshelves").select("id").eq("user_id", user.id),
    supabase
      .from("loans")
      .select("*, user_book:user_books(*, book:books(*))")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const books = (userBooks as UserBook[]) ?? [];
  const recentLoans = (loans as Loan[]) ?? [];

  const counts = {
    total: books.length,
    unread: books.filter((b) => b.status === "owned_unread").length,
    reading: books.filter((b) => b.status === "reading").length,
    finished: books.filter((b) => b.status === "finished").length,
    lentOut: books.filter((b) => b.status === "lent_out").length,
    borrowed: books.filter((b) => b.status === "borrowed").length,
    bookshelves: bookshelves?.length ?? 0,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Dashboard</h1>
        <p className="text-sm text-zinc-400">An overview of your library.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        <StatCard label="Total Books" value={counts.total} icon={Library} />
        <StatCard label="Unread" value={counts.unread} icon={BookMarked} />
        <StatCard label="Reading" value={counts.reading} icon={BookOpen} />
        <StatCard label="Finished" value={counts.finished} icon={CheckCircle2} />
        <StatCard label="Lent Out" value={counts.lentOut} icon={HandCoins} />
        <StatCard label="Borrowed" value={counts.borrowed} icon={HandCoins} />
        <StatCard label="Bookshelves" value={counts.bookshelves} icon={Rows3} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-200">Recent additions</h2>
          <RecentBooks userBooks={books} />
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-200">Recent loans</h2>
          <RecentLoans loans={recentLoans} />
        </div>
      </div>
    </div>
  );
}
