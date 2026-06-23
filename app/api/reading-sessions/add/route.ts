import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { ReadingSessionInput } from "@/types/reading";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: ReadingSessionInput = await request.json();
  const { userBookId, startPage, endPage, minutesRead, notes, readDate, startedAt, endedAt, timerUsed } = body;

  if (!userBookId || startPage == null || endPage == null || !readDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!Number.isFinite(startPage) || !Number.isFinite(endPage)) {
    return NextResponse.json({ error: "Pages must be numeric" }, { status: 400 });
  }
  if (startPage < 0 || endPage < 0) {
    return NextResponse.json({ error: "Pages cannot be negative" }, { status: 400 });
  }
  if (endPage < startPage) {
    return NextResponse.json({ error: "End page must be greater than or equal to start page" }, { status: 400 });
  }
  if (Number.isNaN(new Date(readDate).getTime())) {
    return NextResponse.json({ error: "Date read must be a valid date" }, { status: 400 });
  }

  const { data: userBook, error: userBookError } = await supabase
    .from("user_books")
    .select("*, book:books(*)")
    .eq("id", userBookId)
    .eq("user_id", user.id)
    .single();

  if (userBookError || !userBook) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const pageCount: number | null = userBook.book?.page_count ?? null;
  if (pageCount != null && endPage > pageCount) {
    return NextResponse.json({ error: `End page cannot exceed total page count (${pageCount})` }, { status: 400 });
  }

  const pagesRead = endPage - startPage;

  const { data: session, error: sessionError } = await supabase
    .from("reading_sessions")
    .insert({
      user_id: user.id,
      user_book_id: userBookId,
      start_page: startPage,
      end_page: endPage,
      pages_read: pagesRead,
      minutes_read: minutesRead ?? null,
      notes: notes?.trim() || null,
      read_date: readDate,
      started_at: startedAt ?? null,
      ended_at: endedAt ?? null,
      timer_used: !!timerUsed,
    })
    .select("*")
    .single();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  const userBookUpdates: Record<string, unknown> = {
    current_page: endPage,
    last_read_at: new Date().toISOString(),
  };
  if (userBook.status === "owned_unread") {
    userBookUpdates.status = "reading";
  }

  const { error: updateError } = await supabase.from("user_books").update(userBookUpdates).eq("id", userBookId);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const descriptionParts = [`Read pages ${startPage}–${endPage}`];
  if (minutesRead) descriptionParts.push(`for ${minutesRead} minutes`);

  const { data: event, error: eventError } = await supabase
    .from("collection_events")
    .insert({
      user_id: user.id,
      user_book_id: userBookId,
      item_type: "book",
      event_type: "read",
      title: `Read ${userBook.book?.title ?? "book"}`,
      description: descriptionParts.join(" "),
      event_date: readDate,
      cover_url: userBook.book?.cover_url ?? null,
      metadata: {
        start_page: startPage,
        end_page: endPage,
        pages_read: pagesRead,
        minutes_read: minutesRead ?? null,
        timer_used: !!timerUsed,
        started_at: startedAt ?? null,
        ended_at: endedAt ?? null,
        reading_session_id: session.id,
        notes: notes?.trim() || null,
      },
    })
    .select("*")
    .single();

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  const shouldPromptFinished = pageCount != null && endPage >= pageCount && userBook.status !== "finished";

  return NextResponse.json({
    session,
    event,
    userBookUpdates,
    shouldPromptFinished,
    pageCount,
  });
}
