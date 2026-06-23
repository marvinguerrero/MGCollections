"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { UserBook } from "@/types/book";
import type { ReadingSession, ReadingSessionInput } from "@/types/reading";

interface LogSessionResult {
  session: ReadingSession;
  userBookUpdates: Partial<UserBook>;
  shouldPromptFinished: boolean;
  pageCount: number | null;
}

/** Recent reading sessions for one book, plus the ability to log a new one. */
export function useReadingSessions(userBookId: string | undefined) {
  const supabase = createSupabaseBrowserClient();
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!userBookId) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("reading_sessions")
      .select("*")
      .eq("user_book_id", userBookId)
      .order("read_date", { ascending: false })
      .limit(10);

    setSessions((data as ReadingSession[]) ?? []);
    setLoading(false);
  }, [supabase, userBookId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  async function logSession(input: ReadingSessionInput): Promise<{ error: Error | null; data?: LogSessionResult }> {
    try {
      const res = await fetch("/api/reading-sessions/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) {
        return { error: new Error(json.error ?? "Failed to log reading session") };
      }

      setSessions((prev) => [json.session as ReadingSession, ...prev]);
      return { error: null, data: json as LogSessionResult };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Failed to log reading session") };
    }
  }

  return { sessions, loading, refetch: fetchSessions, logSession };
}
