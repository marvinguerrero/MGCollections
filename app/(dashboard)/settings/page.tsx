"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Profile } from "@/types/user";

export default function SettingsPage() {
  const supabase = createSupabaseBrowserClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
      setProfile(data);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        is_public: profile.is_public,
      })
      .eq("id", profile.id);

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Settings saved");
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading settings...</p>;
  if (!profile) return <p className="text-sm text-zinc-500">Profile not found.</p>;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Settings</h1>
        <p className="text-sm text-zinc-400">Manage your profile and public library page.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={profile.username}
            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
          />
          <p className="text-xs text-zinc-500">Your public library is at /library/{profile.username}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="display-name">Display name</Label>
          <Input
            id="display-name"
            value={profile.display_name ?? ""}
            onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={profile.bio ?? ""}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="avatar-url">Avatar URL</Label>
          <Input
            id="avatar-url"
            value={profile.avatar_url ?? ""}
            onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-zinc-800 p-3">
          <div>
            <Label htmlFor="is-public">Public library page</Label>
            <p className="text-xs text-zinc-500">Allow anyone with the link to view your shelves.</p>
          </div>
          <Switch
            id="is-public"
            checked={profile.is_public}
            onCheckedChange={(checked) => setProfile({ ...profile, is_public: checked })}
          />
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
