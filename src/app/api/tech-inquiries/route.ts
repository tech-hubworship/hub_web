import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { message, inquiryType = "general", pageUrl } = body as Record<
      string,
      any
    >;

    if (!message || String(message).trim().length === 0) {
      return jsonError("메시지를 입력해주세요.", 400);
    }

    if (String(message).trim().length > 5000) {
      return jsonError("메시지는 5000자를 초과할 수 없습니다.", 400);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return jsonError("문의사항을 제출하려면 로그인이 필요합니다.", 401);
    }

    // profiles 테이블에서 실제 user_id 조회/생성
    let userId: string | null = null;
    let userEmail: string | null = null;
    let userName: string | null = null;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email, name")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("프로필 조회 오류:", profileError);
      return jsonError("사용자 정보를 불러오는데 실패했습니다.", 500);
    }

    if (!profile) {
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from("profiles")
        .insert({
          user_id: session.user.id,
          email: session.user.email || null,
          name: session.user.name || null,
        })
        .select("user_id, email, name")
        .single();

      if (createError) {
        console.error("프로필 생성 오류:", createError);
        return jsonError("사용자 프로필 생성에 실패했습니다.", 500);
      }

      userId = newProfile.user_id;
      userEmail = newProfile.email;
      userName = newProfile.name;
    } else {
      userId = profile.user_id;
      userEmail = profile.email;
      userName = profile.name;
    }

    if (!userId) return jsonError("사용자 ID를 확인할 수 없습니다.", 500);

    const userAgent = req.headers.get("user-agent") || null;
    const userIp =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      null;

    // 중복 제출 체크 (5분 내 동일 사용자/동일 메시지)
    const now = new Date();
    const koreanNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const fiveMinutesAgo = new Date(koreanNow.getTime() - 5 * 60 * 1000)
      .toISOString()
      .replace("Z", "");

    let duplicateCheck = supabaseAdmin
      .from("tech_inquiries")
      .select("id")
      .eq("message", String(message).trim())
      .gte("created_at", fiveMinutesAgo);

    if (userId) duplicateCheck = duplicateCheck.eq("user_id", userId);
    else if (userIp) duplicateCheck = duplicateCheck.eq("user_ip", userIp);

    const { data: recentInquiries, error: checkError } = await duplicateCheck;

    if (!checkError && recentInquiries && recentInquiries.length > 0) {
      return jsonError(
        "동일한 문의사항을 이미 제출하셨습니다. 잠시 후 다시 시도해주세요.",
        429
      );
    }

    const { data, error } = await supabaseAdmin
      .from("tech_inquiries")
      .insert({
        message: String(message).trim(),
        inquiry_type: inquiryType,
        user_agent: userAgent,
        user_ip: userIp,
        page_url: pageUrl || null,
        status: "new",
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
      })
      .select()
      .single();

    if (error) {
      console.error("문의사항 저장 오류:", error);
      return jsonError("문의사항 저장에 실패했습니다.", 500, {
        details: (error as any).message,
      });
    }

    return jsonOk(
      {
        success: true,
        message: "문의사항이 성공적으로 전송되었습니다.",
        data,
      },
      201
    );
  } catch (error) {
    console.error("Tech Inquiries API Error:", error);
    return jsonError("서버 오류가 발생했습니다.", 500);
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.isAdmin) {
      return jsonError("관리자 권한이 필요합니다.", 401);
    }

    const url = new URL(req.url);
    const limit = url.searchParams.get("limit") ?? "50";
    const offset = url.searchParams.get("offset") ?? "0";
    const status = url.searchParams.get("status");
    const stats = url.searchParams.get("stats");

    // 통계만 조회
    if (stats === "true") {
      const { data: allInquiries, error: statsError } = await supabaseAdmin
        .from("tech_inquiries")
        .select("*");

      if (statsError) {
        console.error("통계 조회 오류:", statsError);
        return jsonError("통계 조회에 실패했습니다.", 500);
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const computedStats = {
        total_count: allInquiries?.length || 0,
        new_count: allInquiries?.filter((i: any) => i.status === "new").length || 0,
        in_progress_count:
          allInquiries?.filter((i: any) => i.status === "in_progress").length || 0,
        resolved_count:
          allInquiries?.filter((i: any) => i.status === "resolved").length || 0,
        bug_count: allInquiries?.filter((i: any) => i.inquiry_type === "bug").length || 0,
        suggestion_count:
          allInquiries?.filter((i: any) => i.inquiry_type === "suggestion").length ||
          0,
        today_count: allInquiries?.filter((i: any) => new Date(i.created_at) >= today)
          .length || 0,
        this_week_count: allInquiries?.filter((i: any) => new Date(i.created_at) >= weekAgo)
          .length || 0,
      };

      return jsonOk({ success: true, stats: computedStats }, 200);
    }

    let query = supabaseAdmin
      .from("tech_inquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .range(parseInt(offset, 10), parseInt(offset, 10) + parseInt(limit, 10) - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("문의사항 조회 오류:", error);
      return jsonError("문의사항 조회에 실패했습니다.", 500);
    }

    return jsonOk(
      {
        success: true,
        data,
        pagination: {
          limit: parseInt(limit, 10),
          offset: parseInt(offset, 10),
          total: data?.length || 0,
        },
      },
      200
    );
  } catch (error) {
    console.error("Tech Inquiries API Error:", error);
    return jsonError("서버 오류가 발생했습니다.", 500);
  }
}

export async function PUT() {
  return methodNotAllowed(["GET", "POST"]);
}

export async function PATCH() {
  return methodNotAllowed(["GET", "POST"]);
}

export async function DELETE() {
  return methodNotAllowed(["GET", "POST"]);
}

