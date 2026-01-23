import { supabaseAdmin } from "@src/lib/supabase";
import { getKoreanTimestamp } from "@src/lib/utils/date";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getRemainingDownloads(): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .from("downloads")
      .select("remaining_count")
      .eq("key", "wallpaper_downloads")
      .order("id", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // 데이터가 없으면 초기화
      if ((error as any).code === "PGRST116") {
        const { data: insertData, error: insertError } = await supabaseAdmin
          .from("downloads")
          .insert({
            key: "wallpaper_downloads",
            remaining_count: 1000,
          })
          .select("remaining_count")
          .single();

        if (insertError) return 1000;
        return (insertData as any).remaining_count;
      }

      return 1000;
    }

    return (data as any).remaining_count;
  } catch (error) {
    console.error("getRemainingDownloads 에러:", error);
    return 1000;
  }
}

async function decrementDownloadCount(): Promise<{
  success: boolean;
  remaining_count: number;
  can_download: boolean;
}> {
  try {
    const currentCount = await getRemainingDownloads();

    if (currentCount <= 0) {
      return { success: false, remaining_count: currentCount, can_download: false };
    }

    const { data: updateData, error: updateError } = await supabaseAdmin
      .from("downloads")
      .update({
        remaining_count: currentCount - 1,
        updated_at: getKoreanTimestamp(),
      })
      .eq("key", "wallpaper_downloads")
      .select("remaining_count")
      .single();

    if (updateError) {
      console.error("카운트 차감 에러:", updateError);
      return { success: false, remaining_count: currentCount, can_download: false };
    }

    return {
      success: true,
      remaining_count: (updateData as any).remaining_count,
      can_download: true,
    };
  } catch (error) {
    console.error("decrementDownloadCount 에러:", error);
    return { success: false, remaining_count: 0, can_download: false };
  }
}

export async function GET() {
  try {
    const remainingCount = await getRemainingDownloads();
    return jsonOk(
      {
        success: true,
        data: { remaining_count: remainingCount },
      },
      200
    );
  } catch (error) {
    console.error("Download decrement API error:", error);
    return jsonOk(
      {
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      500
    );
  }
}

export async function POST() {
  try {
    const result = await decrementDownloadCount();

    if (!result.success || !result.can_download) {
      return jsonOk(
        {
          success: false,
          message: "다운로드 한도가 초과되었습니다.",
          remaining_count: result.remaining_count,
        },
        403
      );
    }

    return jsonOk(
      {
        success: true,
        data: { remaining_count: result.remaining_count },
        message: "다운로드 카운트가 차감되었습니다.",
      },
      200
    );
  } catch (error) {
    console.error("Download decrement API error:", error);
    return jsonError("Internal server error", 500);
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

