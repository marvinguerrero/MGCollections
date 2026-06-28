"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/navigation";
import { BookOpen, ExternalLink, LogOut } from "lucide-react";
import type { Profile } from "@/types/user";

/**
 * Single shared drawer used by both the header hamburger button and the
 * bottom nav's "More" tab. Each call site renders its own <Sheet> instance
 * with the same content, so there's no need to share open-state across
 * components that live in different parts of the layout tree.
 */
export function MobileNavDrawer({ profile, trigger }: { profile: Profile | null; trigger: React.ReactElement }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleLogout() {
    setOpen(false);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
      <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0">
        <SheetHeader className="border-b border-zinc-800 px-4 py-4">
          <SheetTitle className="flex items-center gap-2 text-zinc-100">
            <BookOpen className="h-5 w-5" /> MGCollections
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                  active ? "bg-zinc-800 text-zinc-50" : "text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}

          {profile?.username && (
            <Link
              href={`/library/${profile.username}`}
              target="_blank"
              onClick={() => setOpen(false)}
              className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
            >
              <ExternalLink className="h-5 w-5" /> Public Library
            </Link>
          )}
        </nav>

        <div className="border-t border-zinc-800 p-3">
          <Button
            variant="ghost"
            className="h-11 w-full justify-start gap-3 text-zinc-300"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" /> Log out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
