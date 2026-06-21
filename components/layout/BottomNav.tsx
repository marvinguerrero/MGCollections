"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV_ITEMS } from "@/lib/navigation";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import type { Profile } from "@/types/user";

export function BottomNav({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur supports-backdrop-filter:bg-zinc-950/80 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {BOTTOM_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname?.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
              active ? "text-zinc-50" : "text-zinc-500"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
      <MobileNavDrawer
        profile={profile}
        trigger={
          <button
            type="button"
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] text-zinc-500"
          >
            <Menu className="h-5 w-5" />
            Menu
          </button>
        }
      />
    </nav>
  );
}
