import type { NormalizedBookResult } from "@/types/book";

interface GoogleVolume {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    categories?: string[];
    industryIdentifiers?: { type: string; identifier: string }[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
}

interface OpenLibraryDoc {
  key: string;
  title?: string;
  author_name?: string[];
  publisher?: string[];
  first_publish_year?: number;
  isbn?: string[];
  number_of_pages_median?: number;
  cover_i?: number;
  subject?: string[];
}

function pickIsbn(identifiers: { type: string; identifier: string }[] | undefined) {
  const isbn13 = identifiers?.find((i) => i.type === "ISBN_13")?.identifier ?? null;
  const isbn10 = identifiers?.find((i) => i.type === "ISBN_10")?.identifier ?? null;
  return { isbn10, isbn13 };
}

export async function searchGoogleBooks(query: string): Promise<NormalizedBookResult[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", "20");
  if (apiKey) url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const json: { items?: GoogleVolume[] } = await res.json();

  return (json.items ?? []).map((item) => {
    const info = item.volumeInfo ?? {};
    const { isbn10, isbn13 } = pickIsbn(info.industryIdentifiers);
    const coverUrl = info.imageLinks?.thumbnail?.replace("http://", "https://") ?? null;
    const genres = info.categories ?? [];

    return {
      title: info.title ?? "Untitled",
      authors: info.authors ?? [],
      isbn: isbn13 ?? isbn10 ?? null,
      isbn_10: isbn10,
      isbn_13: isbn13,
      publisher: info.publisher ?? null,
      publishedDate: info.publishedDate ?? null,
      description: info.description ?? null,
      pageCount: info.pageCount ?? null,
      coverUrl,
      source: "google" as const,
      externalId: item.id,
      genre: genres[0] ?? null,
      genres,
    };
  });
}

export async function searchOpenLibrary(query: string): Promise<NormalizedBookResult[]> {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "20");

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const json: { docs?: OpenLibraryDoc[] } = await res.json();

  return (json.docs ?? []).map((doc) => {
    const isbn13 = doc.isbn?.find((i) => i.length === 13) ?? null;
    const isbn10 = doc.isbn?.find((i) => i.length === 10) ?? null;
    const coverUrl = doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : null;
    const genres = doc.subject ?? [];

    return {
      title: doc.title ?? "Untitled",
      authors: doc.author_name ?? [],
      isbn: isbn13 ?? isbn10 ?? null,
      isbn_10: isbn10,
      isbn_13: isbn13,
      publisher: doc.publisher?.[0] ?? null,
      publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : null,
      description: null,
      pageCount: doc.number_of_pages_median ?? null,
      coverUrl,
      source: "openlibrary" as const,
      externalId: doc.key,
      genre: genres[0] ?? null,
      genres,
    };
  });
}

/** Combines both sources, de-duplicating by ISBN (falling back to title+first author). */
export async function searchBooks(query: string): Promise<NormalizedBookResult[]> {
  const [googleResults, openLibraryResults] = await Promise.all([
    searchGoogleBooks(query).catch(() => []),
    searchOpenLibrary(query).catch(() => []),
  ]);

  const combined = [...googleResults, ...openLibraryResults];
  const seen = new Set<string>();
  const deduped: NormalizedBookResult[] = [];

  for (const book of combined) {
    const key = book.isbn ?? `${book.title.toLowerCase()}::${(book.authors[0] ?? "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(book);
  }

  return deduped;
}
