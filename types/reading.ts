export interface ReadingSession {
  id: string;
  user_id: string;
  user_book_id: string;
  start_page: number;
  end_page: number;
  pages_read: number | null;
  minutes_read: number | null;
  notes: string | null;
  read_date: string;
  started_at: string | null;
  ended_at: string | null;
  timer_used: boolean;
  created_at: string;
  updated_at: string;
}

/** Body sent to POST /api/reading-sessions/add. */
export interface ReadingSessionInput {
  userBookId: string;
  startPage: number;
  endPage: number;
  minutesRead?: number | null;
  notes?: string | null;
  readDate: string;
  startedAt?: string | null;
  endedAt?: string | null;
  timerUsed?: boolean;
}
