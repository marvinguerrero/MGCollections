import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

interface BorrowRequestBody {
  userBookId: string;
  ownerId: string;
  requesterName: string;
  requesterEmail: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const body: BorrowRequestBody = await request.json();
  const { userBookId, ownerId, requesterName, requesterEmail, message } = body;

  if (!userBookId || !ownerId || !requesterName || !requesterEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: userBook, error: userBookError } = await supabase
    .from("user_books")
    .select("id, is_lendable, status")
    .eq("id", userBookId)
    .single();

  if (userBookError || !userBook) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  if (!userBook.is_lendable || userBook.status === "lent_out") {
    return NextResponse.json({ error: "This book is not available to borrow" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("borrow_requests")
    .insert({
      owner_id: ownerId,
      requester_name: requesterName,
      requester_email: requesterEmail,
      user_book_id: userBookId,
      message,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ borrowRequest: data });
}
