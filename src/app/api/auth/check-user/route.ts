import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "인증되지 않음" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    const { data, error } = await supabaseAdmin
      .from("google_users")
      .select("uuid")
      .eq("uuid", userId)
      .maybeSingle(); // 결과 없으면 null 반환

    if (error) throw error;

    return Response.json({ exists: !!data }, { status: 200 }); // 존재 여부만 반환
  } catch (error: any) {
    return Response.json({ error: error?.message }, { status: 500 });
  }
}

export async function GET() {
  return handler();
}

export async function POST() {
  return handler();
}

