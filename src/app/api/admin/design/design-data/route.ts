import { supabaseAdmin } from "@src/lib/supabase";
import { requireAdminSession } from "@src/lib/api/auth";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return jsonError("Forbidden: You are not an admin.", 403);

  try {
    const { data, error } = await supabaseAdmin
      .from("survey_responses")
      .select(
        `
        response_data,
        profiles ( name, email )
      `
      )
      .eq("survey_id", 2)
      .order("created_at");

    if (error) throw error;

    return jsonOk((data as any[]) || [], 200);
  } catch (error: any) {
    console.error("Error fetching design data:", error);
    return jsonError("Failed to fetch design data", 500, {
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

