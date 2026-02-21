import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import crypto from "crypto";
dayjs.extend(utc);
dayjs.extend(timezone);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const category = body?.category;
  const startHour = body?.startHour != null ? Math.min(23, Math.max(0, parseInt(String(body.startHour), 10) || 0)) : 10;
  const startMinute = body?.startMinute != null ? Math.min(59, Math.max(0, parseInt(String(body.startMinute), 10) || 0)) : 40;
  const now = dayjs().tz("Asia/Seoul");

  if (!category) {
    return Response.json({ error: "category가 필요합니다." }, { status: 400 });
  }

  const lateAt = now.startOf("day").add(startHour, "hour").add(startMinute, "minute");

  const token = crypto.randomBytes(16).toString("hex");
  const expiresAt = now.add(1, "minute").toISOString();

  const { error } = await supabaseAdmin.from("qr_tokens").insert({
    token,
    category,
    created_by: (session?.user as any)?.id,
    expires_at: expiresAt,
    late_at: lateAt.toISOString(),
  });

  if (error) {
    console.error(error);
    return Response.json({ error: "QR 생성 실패" }, { status: 500 });
  }

  return Response.json({ token, expiresAt }, { status: 200 });
}

/** 현재 유효한 QR 토큰이 있으면 반환 (입장 시 기존 QR 표시용) */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const url = new URL(req.url);
  const category = url.searchParams.get("category") || "OD";
  const now = dayjs().tz("Asia/Seoul").toISOString();

  const { data: row } = await supabaseAdmin
    .from("qr_tokens")
    .select("token, expires_at")
    .eq("category", category)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) {
    return Response.json({ token: null, expiresAt: null }, { status: 200 });
  }
  return Response.json({ token: row.token, expiresAt: row.expires_at }, { status: 200 });
}

