import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";
import * as XLSX from "xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ExcelRow {
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
    const { fileData } = body ?? {};

    if (!fileData) {
      return Response.json({ error: "엑셀 파일 데이터가 필요합니다." }, { status: 400 });
    }

    const base64Data = String(fileData).split(",")[1] || String(fileData);
    const buffer = Buffer.from(base64Data, "base64");

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    const excelData: ExcelRow[] = [];
    const errors: string[] = [];

    data.forEach((row: any, index: number) => {
      const rowNum = index + 2;

      const idKey = Object.keys(row).find(
        (key) =>
          key.toLowerCase().includes("id") ||
          key.toLowerCase().includes("신청") ||
          key.toLowerCase().includes("번호")
      );
      const linkKey = Object.keys(row).find(
        (key) =>
          key.toLowerCase().includes("link") ||
          key.toLowerCase().includes("링크") ||
          key.toLowerCase().includes("구글") ||
          key.toLowerCase().includes("드라이브")
      );

      if (!idKey) {
        errors.push(`행 ${rowNum}: ID 컬럼을 찾을 수 없습니다.`);
        return;
      }

      if (!linkKey) {
        errors.push(`행 ${rowNum}: 링크 컬럼을 찾을 수 없습니다.`);
        return;
      }

      const id = parseInt(row[idKey], 10);
      const drive_link = String(row[linkKey] || "").trim();

      if (isNaN(id) || id <= 0) {
        errors.push(`행 ${rowNum}: 올바른 ID가 아닙니다 (${row[idKey]}).`);
        return;
      }

      if (!drive_link) {
        errors.push(`행 ${rowNum}: 링크가 비어있습니다.`);
        return;
      }

      excelData.push({ id, drive_link });
    });

    if (errors.length > 0) {
      return Response.json({ error: "엑셀 파일 파싱 오류", errors }, { status: 400 });
    }

    const ids = excelData.map((row) => row.id);
    const { data: existingApps, error: fetchError } = await supabaseAdmin
      .from("bible_card_applications")
      .select("id, name, drive_link_1")
      .in("id", ids);

    if (fetchError) {
      console.error("Error fetching applications:", fetchError);
      return Response.json({ error: "신청 정보 조회 실패" }, { status: 500 });
    }

    const existingIds = new Set((existingApps as any[])?.map((app) => app.id) || []);
    const notFoundIds = ids.filter((id) => !existingIds.has(id));

    if (notFoundIds.length > 0) {
      return Response.json({ error: "존재하지 않는 신청 ID가 있습니다.", notFoundIds }, { status: 400 });
    }

    const preview = excelData.map((row) => {
      const app = (existingApps as any[])?.find((a) => a.id === row.id);
      return {
        id: row.id,
        name: app?.name || "-",
        current_link: app?.drive_link_1 || null,
        new_link: row.drive_link,
      };
    });

    return Response.json({ success: true, preview, totalCount: preview.length }, { status: 200 });
  } catch (error: any) {
    console.error("Error in upload-excel API:", error);
    return Response.json({ error: error?.message || "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}

