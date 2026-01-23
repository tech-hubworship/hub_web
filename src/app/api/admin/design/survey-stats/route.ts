import { supabaseAdmin } from "@src/lib/supabase";
import { requireAdminSession } from "@src/lib/api/auth";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await requireAdminSession();
  if (!session) return jsonError("Forbidden: Access is denied.", 403);

  const url = new URL(req.url);
  const surveyId = url.searchParams.get("surveyId");

  if (!surveyId) return jsonError("Survey ID is required.", 400);

  try {
    const { count, error } = await supabaseAdmin
      .from("survey_responses")
      .select("*", { count: "exact", head: true })
      .eq("survey_id", surveyId);

    if (error) throw error;

    return jsonOk({ totalResponses: count }, 200);
  } catch (error: any) {
    console.error("Error fetching survey stats:", error);
    return jsonError("Failed to fetch survey stats", 500, {
      details: error?.message,
    });
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}

export async function PUT() {
  return methodNotAllowed(["GET"]);
}

export async function PATCH() {
  return methodNotAllowed(["GET"]);
}

export async function DELETE() {
  return methodNotAllowed(["GET"]);
}

