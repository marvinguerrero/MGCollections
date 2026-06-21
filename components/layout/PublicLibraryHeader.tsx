import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/types/user";

export function PublicLibraryHeader({ profile }: { profile: Profile }) {
  const initials = (profile.display_name ?? profile.username).slice(0, 2).toUpperCase();

  return (
    <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-8">
      <div className="mx-auto flex max-w-5xl items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">
            {profile.display_name ?? profile.username}&apos;s Library
          </h1>
          {profile.bio && <p className="mt-1 text-sm text-zinc-400">{profile.bio}</p>}
        </div>
      </div>
    </header>
  );
}
