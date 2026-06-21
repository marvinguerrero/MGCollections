"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { BorrowRequest, Loan } from "@/types/loan";

export function useLoans(userId: string | undefined) {
  const supabase = createSupabaseBrowserClient();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLoans = useCallback(async () => {
    if (!userId) {
      setLoans([]);
      setBorrowRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const [{ data: loanData }, { data: requestData }] = await Promise.all([
      supabase
        .from("loans")
        .select("*, user_book:user_books(*, book:books(*))")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("borrow_requests")
        .select("*, user_book:user_books(*, book:books(*))")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    setLoans((loanData as Loan[]) ?? []);
    setBorrowRequests((requestData as BorrowRequest[]) ?? []);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  async function approveRequest(request: BorrowRequest, dueDate?: string) {
    if (!userId) return { error: new Error("Not authenticated") };

    const { error: loanError } = await supabase.from("loans").insert({
      user_book_id: request.user_book_id,
      owner_id: userId,
      borrower_name: request.requester_name,
      borrower_email: request.requester_email,
      due_date: dueDate ?? null,
    });
    if (loanError) return { error: loanError };

    await supabase.from("user_books").update({ status: "lent_out" }).eq("id", request.user_book_id);
    await supabase.from("borrow_requests").update({ status: "approved" }).eq("id", request.id);

    await fetchLoans();
    return { error: null };
  }

  async function declineRequest(requestId: string) {
    const { error } = await supabase.from("borrow_requests").update({ status: "declined" }).eq("id", requestId);
    if (!error) await fetchLoans();
    return { error };
  }

  async function createLoan(input: { userBookId: string; borrowerName: string; borrowerEmail?: string; dueDate?: string; notes?: string }) {
    if (!userId) return { error: new Error("Not authenticated") };

    const { error } = await supabase.from("loans").insert({
      user_book_id: input.userBookId,
      owner_id: userId,
      borrower_name: input.borrowerName,
      borrower_email: input.borrowerEmail ?? null,
      due_date: input.dueDate ?? null,
      notes: input.notes ?? null,
    });
    if (error) return { error };

    await supabase.from("user_books").update({ status: "lent_out" }).eq("id", input.userBookId);
    await fetchLoans();
    return { error: null };
  }

  async function markReturned(loan: Loan) {
    const { error } = await supabase
      .from("loans")
      .update({ status: "returned", return_date: new Date().toISOString().slice(0, 10) })
      .eq("id", loan.id);
    if (error) return { error };

    await supabase.from("user_books").update({ status: "owned_unread" }).eq("id", loan.user_book_id);
    await fetchLoans();
    return { error: null };
  }

  return {
    loans,
    borrowRequests,
    loading,
    refetch: fetchLoans,
    approveRequest,
    declineRequest,
    createLoan,
    markReturned,
  };
}
