import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";
import * as XLSX from "xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 엑셀 행 - 이름 또는 이메일 컬럼 지원 */
function findNameColumn(row: Record<string, unknown>): string | null {
  const keys = Object.keys(row);
  for (const k of keys) {
    const lower = k.toLowerCase().trim();
    if (
      lower.includes("이름") ||
      lower.includes("name") ||
      lower === "name"
    ) {
      return k;
    }
  }
  return keys[0] || null;
}

function findEmailColumn(row: Record<string, unknown>): string | null {
  const keys = Object.keys(row);
  for (const k of keys) {
    const lower = k.toLowerCase().trim();
    if (lower.includes("이메일") || lower.includes("email") || lower === "email") {
      return k;
    }
  }
  return null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    const { fileData, weekDate, category = "OD" } = body ?? {};

    if (!fileData) {
      return Response.json({ error: "엑셀 파일 데이터가 필요합니다." }, { status: 400 });
    }
    if (!weekDate || typeof weekDate !== "string") {
      return Response.json({ error: "출석 날짜(weekDate)가 필요합니다." }, { status: 400 });
    }

    const base64Data = String(fileData).split(",")[1] || String(fileData);
    const buffer = Buffer.from(base64Data, "base64");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet);

    if (rows.length === 0) {
      return Response.json({ error: "엑셀에 데이터가 없습니다." }, { status: 400 });
    }

    const nameCol = findNameColumn(rows[0]);
    const emailCol = findEmailColumn(rows[0]);
    if (!nameCol) {
      return Response.json({ error: "이름 컬럼을 찾을 수 없습니다. '이름' 또는 'name' 컬럼을 포함해주세요." }, { status: 400 });
    }

    const names: string[] = [];
    const emails: (string | null)[] = [];
    for (const row of rows) {
      const name = String(row[nameCol] ?? "").trim();
      if (!name) continue;
      names.push(name);
      const email = emailCol ? String(row[emailCol] ?? "").trim() || null : null;
      emails.push(email);
    }

    const uniquePairs = new Map<string, string | null>();
    names.forEach((n, i) => uniquePairs.set(n, emails[i] ?? null));

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, name, email");

    const matched: { user_id: string; name: string }[] = [];
    const unmatched: string[] = [];

    for (const [excelName, excelEmail] of Array.from(uniquePairs.entries())) {
      const profile = (profiles as any[])?.find((p) => {
        const nameMatch = (p.name || "").trim() === excelName;
        const emailMatch = excelEmail && (p.email || "").trim().toLowerCase() === excelEmail.toLowerCase();
        return nameMatch || emailMatch;
      });
      if (profile) {
        matched.push({ user_id: profile.user_id, name: profile.name || excelName });
      } else {
        unmatched.push(excelName);
      }
    }

    if (matched.length === 0) {
      return Response.json({
        error: "매칭되는 회원이 없습니다.",
        unmatched: Array.from(uniquePairs.keys()),
      }, { status: 400 });
    }

    const toInsert = matched.map((m) => ({
      week_date: weekDate,
      category,
      user_id: m.user_id,
      name: m.name,
      created_by: (session?.user as any)?.id,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("attendance_od_targets")
      .upsert(toInsert, {
        onConflict: "week_date,category,user_id",
        ignoreDuplicates: false,
      });

    if (insertError) {
      console.error(insertError);
      return Response.json({ error: "저장 중 오류가 발생했습니다." }, { status: 500 });
    }

    return Response.json({
      success: true,
      matched: matched.length,
      unmatched,
      totalInExcel: uniquePairs.size,
    }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error?.message || "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}
