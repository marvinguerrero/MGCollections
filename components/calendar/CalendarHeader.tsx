"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CalendarDisplayMode } from "@/types/calendar";

export function CalendarHeader({
  monthLabel,
  onPrevMonth,
  onNextMonth,
  onToday,
  displayMode,
  onDisplayModeChange,
}: {
  monthLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  displayMode: CalendarDisplayMode;
  onDisplayModeChange: (mode: CalendarDisplayMode) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onPrevMonth} aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="min-w-36 text-center text-lg font-semibold text-zinc-50">{monthLabel}</h2>
        <Button variant="outline" size="icon" onClick={onNextMonth} aria-label="Next month">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onToday}>
          Today
        </Button>
      </div>

      <Tabs value={displayMode} onValueChange={(v) => onDisplayModeChange(v as CalendarDisplayMode)}>
        <TabsList>
          <TabsTrigger value="minimal">Minimal</TabsTrigger>
          <TabsTrigger value="covers">Covers</TabsTrigger>
          <TabsTrigger value="detailed">Detailed</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
