import { supabaseAdmin } from "@src/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { getKoreanTimestamp } from "@src/lib/utils/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isAdmin) {
    return Response.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("advent_posts")
      .select("*")
      .order("post_dt", { ascending: false });

    if (error) {
      console.error("게시물 목록 조회 오류:", error);
      return Response.json(
        { error: "게시물 목록을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    return Response.json({ posts: data || [] }, { status: 200 });
  } catch (error) {
    console.error("게시물 목록 조회 오류:", error);
    return Response.json(
      { error: "게시물 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isAdmin) {
    return Response.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { post_dt, title, content, video_url, thumbnail_url } = body ?? {};

    if (!post_dt || !title) {
      return Response.json({ error: "날짜와 제목은 필수입니다." }, { status: 400 });
    }

    if (typeof post_dt !== "string" || post_dt.length !== 8) {
      return Response.json({ error: "날짜는 YYYYMMDD 형식이어야 합니다." }, { status: 400 });
    }

    if (title.length > 200) {
      return Response.json({ error: "제목은 200자 이하여야 합니다." }, { status: 400 });
    }

    if (video_url && String(video_url).length > 500) {
      return Response.json({ error: "유튜브 URL은 500자 이하여야 합니다." }, { status: 400 });
    }

    if (thumbnail_url && String(thumbnail_url).length > 500) {
      return Response.json({ error: "썸네일 URL은 500자 이하여야 합니다." }, { status: 400 });
    }

    let userId = (session.user as any).id || session.user.email || "admin";
    if (userId.length > 100) userId = userId.substring(0, 100);
    const now = getKoreanTimestamp();

    const { data, error } = await supabaseAdmin
      .from("advent_posts")
      .insert({
        post_dt,
        title: String(title).trim(),
        content: content ? String(content).trim() : null,
        video_url: video_url ? String(video_url).trim() : null,
        thumbnail_url: thumbnail_url ? String(thumbnail_url).trim() : null,
        reg_id: userId,
        reg_dt: now,
        mod_id: userId,
        mod_dt: now,
      })
      .select()
      .single();

    if (error) {
      if ((error as any).code === "23505") {
        return Response.json(
          { error: "이미 해당 날짜의 게시물이 존재합니다." },
          { status: 400 }
        );
      }
      console.error("게시물 추가 오류:", error);
      return Response.json({ error: "게시물 추가에 실패했습니다." }, { status: 500 });
    }

    return Response.json({ post: data }, { status: 201 });
  } catch (error) {
    console.error("게시물 추가 오류:", error);
    return Response.json({ error: "게시물 추가에 실패했습니다." }, { status: 500 });
  }
}

