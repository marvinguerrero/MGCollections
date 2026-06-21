import type { UserBook } from "./book";

export type LoanStatus = "active" | "returned" | "overdue";
export type BorrowRequestStatus = "pending" | "approved" | "declined";

export interface Loan {
  id: string;
  user_book_id: string;
  owner_id: string;
  borrower_name: string;
  borrower_email: string | null;
  borrow_date: string;
  due_date: string | null;
  return_date: string | null;
  status: LoanStatus;
  notes: string | null;
  created_at: string;
  user_book?: UserBook;
}

export interface BorrowRequest {
  id: string;
  owner_id: string;
  requester_name: string;
  requester_email: string;
  user_book_id: string;
  message: string | null;
  status: BorrowRequestStatus;
  created_at: string;
  user_book?: UserBook;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}
