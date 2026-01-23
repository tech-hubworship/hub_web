import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const userRoles = (session.user as any)?.roles || [];
    if (!userRoles.includes("목회자")) {
      return Response.json({ error: "목회자 권한이 필요합니다." }, { status: 403 });
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const book = url.searchParams.get("book");
    const chapter = url.searchParams.get("chapter");
    const verse = url.searchParams.get("verse");

    if (type === "books") {
      const bookMap = new Map<string, { id: number; full_name: string; short_name: string }>();
      let offset = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabaseAdmin
          .from("bible")
          .select("id, book_full_name, book_name")
          .order("id", { ascending: true })
          .range(offset, offset + limit - 1);

        if (error) {
          console.error("Error fetching books:", error);
          return Response.json({ error: "책 목록 조회 실패" }, { status: 500 });
        }

        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }

        for (const item of data as any[]) {
          if (!bookMap.has(item.book_full_name)) {
            bookMap.set(item.book_full_name, {
              id: item.id,
              full_name: item.book_full_name,
              short_name: item.book_name,
            });
          }
        }

        if (data.length < limit) hasMore = false;
        else offset += limit;
      }

      if (bookMap.size === 0) {
        return Response.json({ error: "책 목록을 찾을 수 없습니다." }, { status: 404 });
      }

      const uniqueBooks = Array.from(bookMap.values()).sort((a, b) => a.id - b.id);
      return Response.json(
        uniqueBooks.map((item) => ({
          id: item.id,
          full_name: item.full_name,
          short_name: item.short_name,
        })),
        { status: 200 }
      );
    }

    if (type === "chapters" && book) {
      const allChapters = new Set<number>();
      let offset = 0;
      const limit = 1000;
      let hasMore = true;
      let bookFullName = "";

      while (hasMore) {
        const { data, error } = await supabaseAdmin
          .from("bible")
          .select("chapter, book_full_name")
          .eq("book_name", book)
          .order("chapter", { ascending: true })
          .range(offset, offset + limit - 1);

        if (error) {
          console.error("Error fetching chapters:", error);
          return Response.json({ error: "장 목록 조회 실패" }, { status: 500 });
        }

        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }

        if (!bookFullName && data.length > 0) {
          bookFullName = (data[0] as any).book_full_name || "";
        }

        (data as any[]).forEach((item) => allChapters.add(item.chapter));

        if (data.length < limit) hasMore = false;
        else offset += limit;
      }

      if (allChapters.size === 0) {
        return Response.json({ error: "장 목록을 찾을 수 없습니다." }, { status: 404 });
      }

      const chapters = Array.from(allChapters).sort((a, b) => a - b);
      return Response.json({ book: bookFullName || book, chapters }, { status: 200 });
    }

    if (type === "verses" && book && chapter) {
      const chapterNum = parseInt(chapter, 10);
      if (isNaN(chapterNum)) {
        return Response.json({ error: "올바른 장 번호가 아닙니다." }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from("bible")
        .select("verse, book_full_name")
        .eq("book_name", book)
        .eq("chapter", chapterNum)
        .order("verse", { ascending: true });

      if (error) {
        console.error("Error fetching verses:", error);
        return Response.json({ error: "절 목록 조회 실패" }, { status: 500 });
      }

      if (!data || data.length === 0) {
        return Response.json({ error: "장을 찾을 수 없습니다." }, { status: 404 });
      }

      const verses = Array.from(new Set((data as any[]).map((item) => item.verse))).sort(
        (a, b) => a - b
      );

      return Response.json(
        { book: (data[0] as any)?.book_full_name || book, chapter: chapterNum, verses },
        { status: 200 }
      );
    }

    if (type === "text" && book && chapter && verse) {
      const chapterNum = parseInt(chapter, 10);
      const verseStr = verse;

      if (isNaN(chapterNum)) {
        return Response.json({ error: "올바른 장 번호가 아닙니다." }, { status: 400 });
      }

      const verseRange = verseStr.includes("-")
        ? verseStr.split("-").map((v) => parseInt(v.trim(), 10))
        : [parseInt(verseStr, 10)];

      if (verseRange.some((v) => isNaN(v))) {
        return Response.json({ error: "올바른 절 번호가 아닙니다." }, { status: 400 });
      }

      const startVerse = verseRange[0];
      const endVerse = verseRange.length > 1 ? verseRange[1] : startVerse;

      if (endVerse < startVerse) {
        return Response.json({ error: "절 범위가 올바르지 않습니다." }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from("bible")
        .select("verse, content, book_full_name")
        .eq("book_name", book)
        .eq("chapter", chapterNum)
        .gte("verse", startVerse)
        .lte("verse", endVerse)
        .order("verse", { ascending: true });

      if (error) {
        console.error("Error fetching verse text:", error);
        return Response.json({ error: "본문 조회 실패" }, { status: 500 });
      }

      if (!data || data.length === 0) {
        return Response.json({ error: "구절을 찾을 수 없습니다." }, { status: 404 });
      }

      const texts = (data as any[]).map((item) => item.content).filter(Boolean);
      const combinedText = texts.join(" ");

      const bookFullName = (data[0] as any)?.book_full_name || book;
      const reference =
        endVerse > startVerse
          ? `${bookFullName} ${chapterNum}:${startVerse}-${endVerse}`
          : `${bookFullName} ${chapterNum}:${startVerse}`;

      return Response.json({ reference, text: combinedText }, { status: 200 });
    }

    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  } catch (error) {
    console.error("Error in bible API:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}

