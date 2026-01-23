import { supabaseAdmin } from "@src/lib/supabase";
import { requireAdminSession } from "@src/lib/api/auth";
import { csvResponse, jsonError, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const convertToCSV = (data: any[]): string => {
  if (!data || data.length === 0) return "";

  const allKeys = data.reduce((keys, obj) => {
    if (obj && typeof obj === "object") {
      Object.keys(obj).forEach((key) => keys.add(key));
    }
    return keys;
  }, new Set<string>());

  const headers: string[] = Array.from(allKeys);
  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = headers.map((header: string) => {
      const value = (row as any)[header];

      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
};

export async function GET(req: Request) {
  const session = await requireAdminSession();
  if (!session) return jsonError("Forbidden: Access is denied.", 403);

  const url = new URL(req.url);
  const surveyId = url.searchParams.get("surveyId");
  const page = url.searchParams.get("page") ?? "1";

  const pageNum = parseInt(page, 10);
  const limit = 100;
  const offset = (pageNum - 1) * limit;

  if (!surveyId || Number.isNaN(pageNum)) {
    return jsonError("A valid survey ID and page number are required.", 400);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("survey_responses")
      .select(
        `
        created_at,
        response_data,
        profiles ( name, email )
      `
      )
      .eq("survey_id", surveyId)
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const formattedData = (data || []).map((item: any) => ({
      name: item?.profiles?.name,
      email: item?.profiles?.email,
      submitted_at: item?.created_at,
      ...(item?.response_data || {}),
    }));

    const csvData = convertToCSV(formattedData);
    const filename = `survey-${surveyId}-page-${pageNum}-responses.csv`;
    return csvResponse(filename, csvData);
  } catch (error: any) {
    console.error("Error exporting survey responses to CSV:", error);
    return jsonError("Failed to export survey responses", 500, {
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

