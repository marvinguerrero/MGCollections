import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-zinc-100">
        <BookOpen className="h-6 w-6" />
        <span className="text-lg font-semibold">MGCollections</span>
      </Link>
      {children}
    </div>
  );
}
