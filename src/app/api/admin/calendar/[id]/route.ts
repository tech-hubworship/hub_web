import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@src/lib/supabase";
import { requireAdminSession } from "@src/lib/api/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const id = Number((await params).id);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json(
      { error: "유효하지 않은 id입니다." },
      { status: 400 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      title,
      start_at,
      end_at,
      all_day,
      location,
      description,
      is_public,
    } = body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return NextResponse.json(
          { error: "title 형식이 올바르지 않습니다." },
          { status: 400 }
        );
      }
      updates.title = title.trim();
    }
    if (start_at !== undefined) {
      if (typeof start_at !== "string") {
        return NextResponse.json(
          { error: "start_at 형식이 올바르지 않습니다." },
          { status: 400 }
        );
      }
      updates.start_at = start_at;
    }
    if (end_at !== undefined) {
      if (end_at !== null && typeof end_at !== "string") {
        return NextResponse.json(
          { error: "end_at 형식이 올바르지 않습니다." },
          { status: 400 }
        );
      }
      updates.end_at = end_at ?? null;
    }
    if (all_day !== undefined) updates.all_day = Boolean(all_day);
    if (location !== undefined) {
      updates.location =
        typeof location === "string" ? location.trim() : null;
    }
    if (description !== undefined) {
      updates.description =
        typeof description === "string" ? description.trim() : null;
    }
    if (is_public !== undefined) updates.is_public = Boolean(is_public);

    const { data, error } = await supabaseAdmin
      .from("calendar_events")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("admin calendar 수정 오류:", error);
      return NextResponse.json(
        { error: "일정 수정 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("admin calendar [id] PUT API Error:", e);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const id = Number((await params).id);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json(
      { error: "유효하지 않은 id입니다." },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabaseAdmin
      .from("calendar_events")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("admin calendar 삭제 오류:", error);
      return NextResponse.json(
        { error: "일정 삭제 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("admin calendar [id] DELETE API Error:", e);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
