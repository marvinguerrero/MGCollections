import { NextRequest, NextResponse } from "next/server";
import { searchBooks } from "@/lib/bookApis";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  const results = await searchBooks(query);
  return NextResponse.json({ results });
}
