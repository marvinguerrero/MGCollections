import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Loan } from "@/types/loan";

export function LoanCard({ loan, onMarkReturned }: { loan: Loan; onMarkReturned?: () => void }) {
  const isOverdue = loan.status === "active" && loan.due_date && new Date(loan.due_date) < new Date();

  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
      <div>
        <p className="text-sm font-medium text-zinc-100">{loan.user_book?.book?.title ?? "Untitled"}</p>
        <p className="text-xs text-zinc-400">Lent to {loan.borrower_name}</p>
        <p className="mt-1 text-xs text-zinc-500">
          Borrowed {format(new Date(loan.borrow_date), "MMM d, yyyy")}
          {loan.due_date && ` · Due ${format(new Date(loan.due_date), "MMM d, yyyy")}`}
          {loan.return_date && ` · Returned ${format(new Date(loan.return_date), "MMM d, yyyy")}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {isOverdue && <Badge variant="destructive">Overdue</Badge>}
        {loan.status === "returned" ? (
          <Badge variant="secondary">Returned</Badge>
        ) : (
          onMarkReturned && (
            <Button size="sm" variant="secondary" onClick={onMarkReturned}>
              Mark returned
            </Button>
          )
        )}
      </div>
    </div>
  );
}
