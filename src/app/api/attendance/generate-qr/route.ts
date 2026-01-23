import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import crypto from "crypto";
import { methodNotAllowed } from "@src/lib/api/response";

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
  const now = dayjs().tz("Asia/Seoul");

  if (!category) {
    return Response.json({ error: "category가 필요합니다." }, { status: 400 });
  }

  await supabaseAdmin.from("qr_tokens").delete().lt("expires_at", now.toISOString());

  const token = crypto.randomBytes(16).toString("hex");
  const expiresAt = now.add(1, "minute").toISOString();

  const { error } = await supabaseAdmin.from("qr_tokens").insert({
    token,
    category,
    created_by: (session?.user as any)?.id,
    expires_at: expiresAt,
  });

  if (error) {
    console.error(error);
    return Response.json({ error: "QR 생성 실패" }, { status: 500 });
  }

  return Response.json({ token, expiresAt }, { status: 200 });
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}

