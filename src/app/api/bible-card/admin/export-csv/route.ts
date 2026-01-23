import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { csvResponse, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvEscape(value: unknown) {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""').replace(/\n/g, " ")}"`;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.isAdmin) {
      return Response.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const pastor_id = url.searchParams.get("pastor_id");
    const search = url.searchParams.get("search");

    let query = supabaseAdmin
      .from("bible_card_applications")
      .select(
        `
        id,
        name,
        community,
        prayer_request,
        bible_verse,
        bible_verse_reference,
        pastor_message,
        status,
        drive_link_1,
        drive_link_2,
        created_at,
        completed_at,
        hub_groups:group_id(name),
        hub_cells:cell_id(name),
        pastor:assigned_pastor_id(name)
      `
      )
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (pastor_id) query = query.eq("assigned_pastor_id", pastor_id);
    if (search) query = query.ilike("name", `%${search}%`);

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching data for CSV:", error);
      return Response.json({ error: "데이터 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    const headers = [
      "ID",
      "이름",
      "공동체",
      "그룹",
      "다락방",
      "기도제목",
      "성경구절",
      "말씀본문",
      "목회자메시지",
      "담당목회자",
      "상태",
      "링크1",
      "링크2",
      "신청일",
      "완료일",
    ];

    const rows: string[] = [];
    rows.push(headers.join(","));

    (data || []).forEach((row: any) => {
      const values = [
        row.id,
        csvEscape(row.name),
        csvEscape(row.community),
        csvEscape(row.hub_groups?.name),
        csvEscape(row.hub_cells?.name),
        csvEscape(row.prayer_request),
        csvEscape(row.bible_verse_reference),
        csvEscape(row.bible_verse),
        csvEscape(row.pastor_message),
        csvEscape(row.pastor?.name),
        row.status ?? "",
        row.drive_link_1 || "",
        row.drive_link_2 || "",
        row.created_at ? new Date(row.created_at).toLocaleDateString("ko-KR") : "",
        row.completed_at ? new Date(row.completed_at).toLocaleDateString("ko-KR") : "",
      ];
      rows.push(values.join(","));
    });

    const csv = rows.join("\n");
    const filename = `bible-cards-${new Date().toISOString().split("T")[0]}.csv`;
    return csvResponse(filename, csv);
  } catch (error) {
    console.error("Error in export-csv API:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}

