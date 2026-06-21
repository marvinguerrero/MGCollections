"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useLoans } from "@/hooks/useLoans";
import { useBooks } from "@/hooks/useBooks";
import { LoanCard } from "@/components/loans/LoanCard";
import { BorrowRequestCard } from "@/components/loans/BorrowRequestCard";
import { LendBookDialog } from "@/components/loans/LendBookDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LoansPage() {
  const supabase = createSupabaseBrowserClient();
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, [supabase]);

  const { loans, borrowRequests, loading, approveRequest, declineRequest, createLoan, markReturned } = useLoans(userId);
  const { userBooks, refetch: refetchBooks } = useBooks(userId);
  const [lendBookId, setLendBookId] = useState<string>("");

  const lendableBooks = useMemo(
    () => userBooks.filter((ub) => ub.is_lendable && ub.status !== "lent_out"),
    [userBooks]
  );
  const selectedUserBook = lendableBooks.find((ub) => ub.id === lendBookId);

  const pendingRequests = borrowRequests.filter((r) => r.status === "pending");
  const activeLoans = loans.filter((l) => l.status === "active");
  const pastLoans = loans.filter((l) => l.status !== "active");

  async function handleApprove(requestId: string) {
    const request = borrowRequests.find((r) => r.id === requestId);
    if (!request) return;
    await approveRequest(request);
    await refetchBooks();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">Loans</h1>
          <p className="text-sm text-zinc-400">Track who has your books and incoming requests.</p>
        </div>
        {lendableBooks.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={lendBookId} onValueChange={(v) => setLendBookId(v ?? "")}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Choose a book to lend" />
              </SelectTrigger>
              <SelectContent>
                {lendableBooks.map((ub) => (
                  <SelectItem key={ub.id} value={ub.id}>
                    {ub.book?.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedUserBook && (
              <LendBookDialog
                userBook={selectedUserBook}
                onLend={async (input) => {
                  const result = await createLoan({ userBookId: selectedUserBook.id, ...input });
                  await refetchBooks();
                  setLendBookId("");
                  return result;
                }}
              />
            )}
          </div>
        )}
      </div>

      {loading && <p className="text-sm text-zinc-500">Loading loans...</p>}

      {pendingRequests.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-200">Pending borrow requests</h2>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <BorrowRequestCard
                key={request.id}
                request={request}
                onApprove={() => handleApprove(request.id)}
                onDecline={() => declineRequest(request.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-200">Active loans</h2>
        {activeLoans.length === 0 ? (
          <p className="text-sm text-zinc-500">No books currently lent out.</p>
        ) : (
          <div className="space-y-2">
            {activeLoans.map((loan) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                onMarkReturned={async () => {
                  await markReturned(loan);
                  await refetchBooks();
                }}
              />
            ))}
          </div>
        )}
      </section>

      {pastLoans.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-200">Loan history</h2>
          <div className="space-y-2">
            {pastLoans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
