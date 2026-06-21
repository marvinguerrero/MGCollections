import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Loan } from "@/types/loan";

export function LoanCard({ loan, onMarkReturned }: { loan: Loan; onMarkReturned?: () => void }) {
  const isOverdue = loan.status === "active" && loan.due_date && new Date(loan.due_date) < new Date();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-100">{loan.user_book?.book?.title ?? "Untitled"}</p>
        <p className="truncate text-xs text-zinc-400">Lent to {loan.borrower_name}</p>
        <p className="mt-1 text-xs text-zinc-500">
          Borrowed {format(new Date(loan.borrow_date), "MMM d, yyyy")}
          {loan.due_date && ` · Due ${format(new Date(loan.due_date), "MMM d, yyyy")}`}
          {loan.return_date && ` · Returned ${format(new Date(loan.return_date), "MMM d, yyyy")}`}
        </p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        {isOverdue && <Badge variant="destructive">Overdue</Badge>}
        {loan.status === "returned" ? (
          <Badge variant="secondary">Returned</Badge>
        ) : (
          onMarkReturned && (
            <Button className="h-10 flex-1 sm:flex-initial" variant="secondary" onClick={onMarkReturned}>
              Mark returned
            </Button>
          )
        )}
      </div>
    </div>
  );
}
