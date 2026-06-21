export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_public: boolean;
  created_at: string;
}

export type ProfileUpdate = Partial<Pick<Profile, "username" | "display_name" | "bio" | "avatar_url" | "is_public">>;
