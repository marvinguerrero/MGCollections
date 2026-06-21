"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { format } from "date-fns";
import type { Notification } from "@/types/loan";

export default function NotificationsPage() {
  const supabase = createSupabaseBrowserClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setNotifications((data as Notification[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function markAsRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Notifications</h1>
        <p className="text-sm text-zinc-400">Updates about borrow requests and loans.</p>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading...</p>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-zinc-500">You&apos;re all caught up.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4"
            >
              <div className="flex min-w-0 flex-1 gap-3">
                {n.is_read ? (
                  <BellOff className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-500" />
                ) : (
                  <Bell className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-100">{n.title}</p>
                  {n.message && <p className="text-sm text-zinc-400">{n.message}</p>}
                  <p className="mt-1 text-xs text-zinc-600">{format(new Date(n.created_at), "MMM d, yyyy h:mm a")}</p>
                </div>
              </div>
              {!n.is_read && (
                <Button className="h-10 flex-shrink-0" variant="ghost" onClick={() => markAsRead(n.id)}>
                  Mark read
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
