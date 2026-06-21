import { format } from "date-fns";
import type { Loan } from "@/types/loan";

export function RecentLoans({ loans }: { loans: Loan[] }) {
  if (loans.length === 0) {
    return <p className="text-sm text-zinc-500">No loans yet.</p>;
  }

  return (
    <div className="space-y-2">
      {loans.slice(0, 6).map((loan) => (
        <div key={loan.id} className="flex items-center justify-between rounded-lg p-2 hover:bg-zinc-900">
          <div className="min-w-0">
            <p className="truncate text-sm text-zinc-200">{loan.user_book?.book?.title}</p>
            <p className="truncate text-xs text-zinc-500">to {loan.borrower_name}</p>
          </div>
          <span className="flex-shrink-0 text-xs text-zinc-500">
            {format(new Date(loan.borrow_date), "MMM d")}
          </span>
        </div>
      ))}
    </div>
  );
}
