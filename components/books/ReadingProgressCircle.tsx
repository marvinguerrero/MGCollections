"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZE = 112;
const STROKE = 9;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type ProgressStatus = "Unread" | "Reading" | "Finished";

function getStatus(percent: number | null): ProgressStatus | null {
  if (percent == null) return null;
  if (percent <= 0) return "Unread";
  if (percent >= 100) return "Finished";
  return "Reading";
}

const STATUS_BADGE_STYLES: Record<ProgressStatus, string> = {
  Unread: "bg-zinc-700 text-zinc-100",
  Reading: "bg-blue-600 text-blue-50",
  Finished: "bg-emerald-600 text-emerald-50",
};

/**
 * Self-contained circular reading-progress indicator. Computes its own
 * percentage/status from current_page + page_count so every usage stays in
 * sync with the same 0% Unread / 1-99% Reading / 100% Finished rule.
 */
export function ReadingProgressCircle({
  currentPage,
  pageCount,
  className,
}: {
  currentPage: number;
  pageCount: number | null;
  className?: string;
}) {
  const percent = pageCount && pageCount > 0 ? Math.min(100, Math.round((currentPage / pageCount) * 100)) : null;
  const status = getStatus(percent);
  const isFinished = percent === 100;

  // Animates from 0 on first mount, and from the previous value whenever
  // `percent` changes (e.g. right after a reading session is saved) — the
  // CSS transition on strokeDashoffset does the actual interpolation.
  const [animatedPercent, setAnimatedPercent] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimatedPercent(percent ?? 0));
    return () => cancelAnimationFrame(frame);
  }, [percent]);

  const dashOffset = CIRCUMFERENCE - (animatedPercent / 100) * CIRCUMFERENCE;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE}
            fill="none"
            stroke="currentColor"
            className="text-zinc-800"
          />
          {percent != null && (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              strokeWidth={STROKE}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className={cn(
                "transition-[stroke-dashoffset] duration-700 ease-out",
                isFinished ? "text-emerald-500" : "text-blue-500"
              )}
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isFinished ? (
            <Check className="h-9 w-9 text-emerald-500" />
          ) : percent != null ? (
            <span className="text-2xl font-semibold text-zinc-50">{percent}%</span>
          ) : (
            <span className="px-2 text-center text-[11px] text-zinc-500">No page count</span>
          )}
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-zinc-300">
          {pageCount ? `${currentPage} / ${pageCount} pages` : `${currentPage} page${currentPage === 1 ? "" : "s"} read`}
        </p>
        {status && (
          <span
            className={cn(
              "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              STATUS_BADGE_STYLES[status]
            )}
          >
            {status === "Finished" && <Check className="h-3 w-3" />}
            {status}
          </span>
        )}
      </div>
    </div>
  );
}
