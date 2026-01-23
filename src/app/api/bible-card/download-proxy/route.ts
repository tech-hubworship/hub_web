import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const urlObj = new URL(req.url);
  const url = urlObj.searchParams.get("url");
  const filename = urlObj.searchParams.get("filename");
  const isViewMode = urlObj.searchParams.get("view") === "true";

  if (!url) {
    return Response.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    let fileId: string | null = null;

    const googleDriveIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (googleDriveIdMatch && googleDriveIdMatch[1]) {
      fileId = googleDriveIdMatch[1];
    }

    const urlAttempts: string[] = [];
    if (fileId) {
      urlAttempts.push(`https://drive.google.com/uc?export=download&id=${fileId}`);
      urlAttempts.push(`https://drive.google.com/uc?export=view&id=${fileId}`);
      urlAttempts.push(`https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`);
    } else {
      urlAttempts.push(url);
    }

    let imageResponse: Response | null = null;
    let lastError: Error | null = null;

    for (const attemptUrl of urlAttempts) {
      try {
        imageResponse = await fetch(attemptUrl, {
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            Referer: "https://drive.google.com/",
          },
        });

        if (
          imageResponse.ok &&
          imageResponse.headers.get("content-type")?.startsWith("image/")
        ) {
          break;
        } else {
          imageResponse = null;
        }
      } catch (error) {
        lastError = error as Error;
        imageResponse = null;
      }
    }

    if (!imageResponse || !imageResponse.ok) {
      console.error("[Download Proxy] All attempts failed. Last error:", lastError);
      return Response.json({ error: "다운로드에 실패했습니다." }, { status: 500 });
    }

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

    let extension = ".jpg";
    if (contentType.includes("png")) extension = ".png";
    else if (contentType.includes("webp")) extension = ".webp";
    else if (contentType.includes("gif")) extension = ".gif";

    let finalFilename: string;
    if (filename && filename.trim()) {
      const nameWithoutExt = filename.replace(/\.[^.]*$/, "");
      finalFilename = nameWithoutExt + extension;
    } else {
      finalFilename = `download${extension}`;
    }

    const headers = new Headers();
    headers.set("Content-Type", contentType);

    if (!isViewMode) {
      const encodedFilename = encodeURIComponent(finalFilename).replace(/['()]/g, escape as any);
      headers.set(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${encodedFilename}`
      );
    } else {
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    return new Response(arrayBuffer, { status: 200, headers });
  } catch (error) {
    console.error("[Download Proxy] Error:", error);
    return Response.json({ error: "다운로드에 실패했습니다." }, { status: 500 });
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}

