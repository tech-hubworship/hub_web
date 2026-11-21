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

/** xlsx(zip) 또는 xls(OLE) 바이너리인지 */
function isZipOrOle(buf: Buffer) {
  const zip = buf[0] === 0x50 && buf[1] === 0x4b; // "PK"
  const ole = buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0;
  return zip || ole;
}

/**
 * CSV 바이트 → 문자열
 * - UTF-8 (BOM 유무 무관): CSV 다운로드 파일, 엑셀 "CSV UTF-8" 저장
 * - CP949(EUC-KR): 엑셀에서 일반 "CSV"로 저장한 경우 (한글 Windows 기본)
 */
function decodeCsv(buf: Buffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf).replace(/^\uFEFF/, "");
  } catch {
    return new TextDecoder("euc-kr").decode(buf);
  }
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

    // xlsx/xls는 그대로, CSV(완료 관리의 CSV 다운로드 파일)는 인코딩을 맞춰 문자열로 읽는다.
    const workbook = isZipOrOle(buffer)
      ? XLSX.read(buffer, { type: "buffer" })
      : XLSX.read(decodeCsv(buffer), { type: "string" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // defval: 빈 셀도 열로 포함해야 링크가 빈 행에서도 링크 열을 찾을 수 있다
    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

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

      // 링크를 아직 채우지 않은 행은 건너뛴다 (CSV 다운로드 파일에 일부만 채워서 올리는 경우)
      if (!drive_link) return;

      excelData.push({ id, drive_link });
    });

    if (errors.length > 0) {
      return Response.json({ error: "엑셀 파일 파싱 오류", errors }, { status: 400 });
    }

    if (excelData.length === 0) {
      return Response.json(
        { error: "링크가 입력된 행이 없습니다.", errors: ["링크1(구글 드라이브 링크) 열에 링크를 입력한 뒤 업로드해주세요."] },
        { status: 400 }
      );
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

