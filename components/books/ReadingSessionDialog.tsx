"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Play, Square, Timer as TimerIcon } from "lucide-react";
import { toast } from "sonner";
import type { UserBook } from "@/types/book";
import type { ReadingSessionInput } from "@/types/reading";

type Mode = "manual" | "timer";

function todayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatElapsed(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function ReadingSessionDialog({
  userBook,
  open,
  onOpenChange,
  onLogSession,
  onMarkFinished,
}: {
  userBook: UserBook;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogSession: (input: ReadingSessionInput) => Promise<{
    error: Error | null;
    data?: { userBookUpdates: Partial<UserBook>; shouldPromptFinished: boolean };
  }>;
  onMarkFinished?: () => Promise<void>;
}) {
  const pageCount = userBook.book?.page_count ?? null;

  const [mode, setMode] = useState<Mode>("manual");
  const [startPage, setStartPage] = useState("");
  const [endPage, setEndPage] = useState("");
  const [readDate, setReadDate] = useState(todayDateInputValue());
  const [minutesRead, setMinutesRead] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [endedAt, setEndedAt] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) return;
    setMode("manual");
    setStartPage(String(userBook.current_page ?? 0));
    setEndPage("");
    setReadDate(todayDateInputValue());
    setMinutesRead("");
    setNotes("");
    setError(null);
    setTimerRunning(false);
    setElapsedSeconds(0);
    setStartedAt(null);
    setEndedAt(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userBook.id]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startTimer() {
    if (startPage === "" || !Number.isFinite(Number(startPage)) || Number(startPage) < 0) {
      setError("Enter a valid start page before starting the timer");
      return;
    }
    setError(null);
    setStartedAt(new Date());
    setTimerRunning(true);
    intervalRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
  }

  function stopTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setTimerRunning(false);
    setEndedAt(new Date());
  }

  function handleOpenChange(next: boolean) {
    if (!next && timerRunning) {
      const confirmed = window.confirm("Your reading timer is still running. Close without saving this session?");
      if (!confirmed) return;
      stopTimer();
    }
    onOpenChange(next);
  }

  function validate(): string | null {
    if (startPage === "" || endPage === "") return "Start page and end page are required";
    const start = Number(startPage);
    const end = Number(endPage);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return "Pages must be numbers";
    if (start < 0 || end < 0) return "Pages cannot be negative";
    if (end < start) return "End page must be greater than or equal to start page";
    if (pageCount != null && end > pageCount) return `End page cannot exceed ${pageCount}`;
    if (!readDate) return "Date read is required";
    return null;
  }

  async function handleSave() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);

    const minutes =
      mode === "timer" ? Math.round(elapsedSeconds / 60) : minutesRead ? Number(minutesRead) : null;

    const { error: saveError, data } = await onLogSession({
      userBookId: userBook.id,
      startPage: Number(startPage),
      endPage: Number(endPage),
      minutesRead: minutes,
      notes: notes.trim() || null,
      readDate,
      startedAt: mode === "timer" ? startedAt?.toISOString() ?? null : null,
      endedAt: mode === "timer" ? endedAt?.toISOString() ?? null : null,
      timerUsed: mode === "timer",
    });

    setSaving(false);

    if (saveError) {
      toast.error(saveError.message || "Failed to log reading session");
      return;
    }

    toast.success("Reading session saved");
    onOpenChange(false);

    if (data?.shouldPromptFinished && onMarkFinished) {
      const markFinished = window.confirm("You've reached the end of the book. Mark it as finished?");
      if (markFinished) await onMarkFinished();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log reading session</DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList className="w-full">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="timer">Timer Mode</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="session-start-page">Start page</Label>
                <Input
                  id="session-start-page"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={startPage}
                  onChange={(e) => setStartPage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-end-page">End page</Label>
                <Input
                  id="session-end-page"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={endPage}
                  onChange={(e) => setEndPage(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="session-date">Date read</Label>
                <Input
                  id="session-date"
                  type="date"
                  value={readDate}
                  onChange={(e) => setReadDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-minutes">Minutes read</Label>
                <Input
                  id="session-minutes"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={minutesRead}
                  onChange={(e) => setMinutesRead(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timer" className="space-y-4 pt-3">
            <div className="space-y-2">
              <Label htmlFor="session-timer-start-page">Start page</Label>
              <Input
                id="session-timer-start-page"
                type="number"
                inputMode="numeric"
                min="0"
                value={startPage}
                onChange={(e) => setStartPage(e.target.value)}
                disabled={timerRunning}
              />
            </div>

            <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-zinc-400">
                <TimerIcon className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Elapsed time</span>
              </div>
              <p className="font-mono text-3xl font-semibold text-zinc-50">{formatElapsed(elapsedSeconds)}</p>

              {!timerRunning ? (
                <Button className="h-14 w-full text-base" onClick={startTimer} disabled={elapsedSeconds > 0}>
                  <Play className="mr-2 h-5 w-5" /> Start Timer
                </Button>
              ) : (
                <Button className="h-14 w-full text-base" variant="destructive" onClick={stopTimer}>
                  <Square className="mr-2 h-5 w-5" /> Stop Timer
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-timer-end-page">End page</Label>
              <Input
                id="session-timer-end-page"
                type="number"
                inputMode="numeric"
                min="0"
                value={endPage}
                onChange={(e) => setEndPage(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-timer-date">Date read</Label>
              <Input
                id="session-timer-date"
                type="date"
                value={readDate}
                onChange={(e) => setReadDate(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label htmlFor="session-notes">Notes</Label>
          <Textarea
            id="session-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => handleOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Session"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
