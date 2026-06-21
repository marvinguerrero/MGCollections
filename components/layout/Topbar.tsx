"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink, LogOut } from "lucide-react";
import type { Profile } from "@/types/user";

export function Topbar({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = (profile?.display_name ?? profile?.username ?? "?").slice(0, 2).toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6">
      <div />
      <div className="flex items-center gap-3">
        {profile?.username && (
          <Button
            variant="ghost"
            size="sm"
            render={
              <Link href={`/library/${profile.username}`} target="_blank">
                <ExternalLink className="mr-1.5 h-4 w-4" /> Public page
              </Link>
            }
          />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="rounded-full">
                <Avatar>
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link href="/settings">Settings</Link>} />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
