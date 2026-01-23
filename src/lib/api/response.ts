export function jsonError(
  message: string,
  status = 500,
  extra?: Record<string, unknown>
) {
  return Response.json({ error: message, ...(extra ?? {}) }, { status });
}

export function jsonOk<T>(data: T, status = 200) {
  return Response.json(data, { status });
}

export function methodNotAllowed(allowed?: string[]) {
  return Response.json(
    { error: "Method not allowed" },
    {
      status: 405,
      headers: allowed ? { Allow: allowed.join(", ") } : undefined,
    }
  );
}

export function csvResponse(filename: string, csv: string) {
  // UTF-8 BOM을 추가하면 엑셀(특히 Windows)에서 한글이 깨질 확률이 줄어듭니다.
  const bom = "\uFEFF";
  return new Response(bom + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

