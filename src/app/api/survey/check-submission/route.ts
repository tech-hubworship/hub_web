import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyGhsXgVYxqgw9alpSBO3ugtLxRrcuMZTK8t2U8koAgfL9SwA1EmB5Oo8-nF1ACv3XA/exec";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  try {
    const fetchUrl = `${GOOGLE_SCRIPT_URL}?userId=${session.user.id}`;
    const response = await fetch(fetchUrl, { method: "GET", redirect: "follow" });

    const rawText = await response.text();
    const result = JSON.parse(rawText);

    if (result.error) throw new Error(result.error);

    return jsonOk({ exists: result.exists }, 200);
  } catch (error: any) {
    console.error("Failed to check submission:", error?.message);
    return jsonError("Internal Server Error", 500, { details: error?.message });
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

