import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900/60 p-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-zinc-500" />}
      </div>
      <p className="mt-2 text-2xl font-semibold text-zinc-50">{value}</p>
    </div>
  );
}
