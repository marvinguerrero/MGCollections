import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/types/user";

export function PublicLibraryHeader({ profile }: { profile: Profile }) {
  const initials = (profile.display_name ?? profile.username).slice(0, 2).toUpperCase();

  return (
    <header className="border-b border-zinc-800 bg-zinc-950 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-5xl items-center gap-3 sm:gap-4">
        <Avatar className="h-12 w-12 flex-shrink-0 sm:h-16 sm:w-16">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="text-base sm:text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-zinc-50 sm:text-2xl">
            {profile.display_name ?? profile.username}&apos;s Library
          </h1>
          {profile.bio && <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{profile.bio}</p>}
        </div>
      </div>
    </header>
  );
}
