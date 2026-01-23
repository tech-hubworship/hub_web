import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyGhsXgVYxqgw9alpSBO3ugtLxRrcuMZTK8t2U8koAgfL9SwA1EmB5Oo8-nF1ACv3XA/exec";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email || !session.user.name) {
    return jsonError("Unauthorized", 401);
  }

  const body = await req.json().catch(() => ({}));

  const payload = {
    userId: session.user.id,
    name: session.user.name,
    email: session.user.email,
    ...(body as Record<string, any>),
  };

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      redirect: "follow",
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if ((result as any).status !== "success") {
      throw new Error((result as any).message || "Google Sheet에 데이터를 쓰는 데 실패했습니다.");
    }

    return jsonOk({ message: "성공적으로 제출되었습니다." }, 200);
  } catch (error: any) {
    console.error("Error submitting to Google Sheet:", error);
    return jsonError("Internal Server Error", 500, { details: error?.message });
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}

export async function PUT() {
  return methodNotAllowed(["POST"]);
}

export async function PATCH() {
  return methodNotAllowed(["POST"]);
}

export async function DELETE() {
  return methodNotAllowed(["POST"]);
}

