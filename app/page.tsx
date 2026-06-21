import Link from "next/link";
import { BookOpen, Rows3, HandCoins, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Search & catalog",
    description: "Find any book via Google Books and Open Library, then add it to your collection in one click.",
  },
  {
    icon: Rows3,
    title: "Build real bookshelves",
    description: "Create adjustable shelves with rows, then drag spines into place just like a physical shelf.",
  },
  {
    icon: HandCoins,
    title: "Track loans",
    description: "Know who borrowed what and when it's due — owned, reading, lent out, or wishlist.",
  },
  {
    icon: Share2,
    title: "Share your library",
    description: "Publish a public page so friends can browse your shelves and request to borrow.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-950">
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 text-zinc-100">
          <BookOpen className="h-6 w-6" />
          <span className="text-lg font-semibold">MGCollections</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" render={<Link href="/login">Sign in</Link>} />
          <Button render={<Link href="/register">Get started</Link>} />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-20 text-center">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
          Your physical bookshelf, digitized.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-zinc-400">
          Catalog your books, arrange them on virtual shelves that look like the real thing, and track who borrowed
          what.
        </p>
        <div className="mt-8 flex gap-3">
          <Button size="lg" render={<Link href="/register">Create your library</Link>} />
          <Button size="lg" variant="outline" render={<Link href="/login">Sign in</Link>} />
        </div>

        <div className="mt-20 grid w-full max-w-4xl gap-6 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-left">
              <Icon className="mb-3 h-5 w-5 text-zinc-400" />
              <h3 className="font-medium text-zinc-100">{title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
