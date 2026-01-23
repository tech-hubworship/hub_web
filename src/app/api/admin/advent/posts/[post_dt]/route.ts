import { supabaseAdmin } from "@src/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { getKoreanTimestamp } from "@src/lib/utils/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ post_dt: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isAdmin) {
    return Response.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const { post_dt } = await ctx.params;
  if (!post_dt || post_dt.length !== 8) {
    return Response.json(
      { error: "올바른 날짜 형식이 아닙니다. (YYYYMMDD)" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { title, content, video_url, thumbnail_url } = body ?? {};

    if (!title) {
      return Response.json({ error: "제목은 필수입니다." }, { status: 400 });
    }

    if (String(title).length > 200) {
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

    const { data, error } = await supabaseAdmin
      .from("advent_posts")
      .update({
        title: String(title).trim(),
        content: content ? String(content).trim() : null,
        video_url: video_url ? String(video_url).trim() : null,
        thumbnail_url: thumbnail_url ? String(thumbnail_url).trim() : null,
        mod_id: userId,
        mod_dt: getKoreanTimestamp(),
      })
      .eq("post_dt", post_dt)
      .select()
      .single();

    if (error) {
      if ((error as any).code === "PGRST116") {
        return Response.json({ error: "게시물을 찾을 수 없습니다." }, { status: 404 });
      }
      console.error("게시물 수정 오류:", error);
      return Response.json({ error: "게시물 수정에 실패했습니다." }, { status: 500 });
    }

    return Response.json({ post: data }, { status: 200 });
  } catch (error) {
    console.error("게시물 수정 오류:", error);
    return Response.json({ error: "게시물 수정에 실패했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ post_dt: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isAdmin) {
    return Response.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const { post_dt } = await ctx.params;
  if (!post_dt || post_dt.length !== 8) {
    return Response.json(
      { error: "올바른 날짜 형식이 아닙니다. (YYYYMMDD)" },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabaseAdmin.from("advent_posts").delete().eq("post_dt", post_dt);

    if (error) {
      console.error("게시물 삭제 오류:", error);
      return Response.json({ error: "게시물 삭제에 실패했습니다." }, { status: 500 });
    }

    return Response.json({ message: "게시물이 삭제되었습니다." }, { status: 200 });
  } catch (error) {
    console.error("게시물 삭제 오류:", error);
    return Response.json({ error: "게시물 삭제에 실패했습니다." }, { status: 500 });
  }
}

