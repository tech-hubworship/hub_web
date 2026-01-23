import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface UpdateLink {
  id: number;
  drive_link: string;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.isAdmin) {
      return Response.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const data: UpdateLink[] = body?.data;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return Response.json({ error: "업데이트할 데이터가 없습니다." }, { status: 400 });
    }

    const updatePromises = data.map(async (item) => {
      const { error } = await supabaseAdmin
        .from("bible_card_applications")
        .update({
          drive_link_1: item.drive_link.trim(),
          links_added_at: new Date().toISOString(),
          status: "delivered",
        })
        .eq("id", item.id);

      if (error) {
        console.error(`Error updating application ${item.id}:`, error);
        return { id: item.id, success: false, error: (error as any).message };
      }

      return { id: item.id, success: true };
    });

    const results = await Promise.all(updatePromises);
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;
    const failures = results.filter((r) => !r.success);

    return Response.json(
      { success: true, total: data.length, successCount, failureCount, failures },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in update-links-from-excel API:", error);
    return Response.json({ error: error?.message || "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}

