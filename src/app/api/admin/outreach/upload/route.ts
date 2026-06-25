import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { jsonError, jsonOk } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as { isAdmin?: boolean })?.isAdmin) return null;
  return session;
}

/**
 * 어드민: 아웃리치 이미지 Cloudinary 업로드
 * multipart/form-data: file (필수), iso_code, year, period (폴더 구분용)
 */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자만 업로드할 수 있습니다.", 403);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return jsonError("Cloudinary 설정이 필요합니다.", 500);
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  try {
    const formData  = await req.formData();
    const file      = formData.get("file");
    const isoCode   = (formData.get("iso_code") as string) || "misc";
    const year      = (formData.get("year")     as string) || "unknown";
    const period    = (formData.get("period")   as string) || "unknown";

    if (!file || !(file instanceof File)) {
      return jsonError("file 필드에 이미지 파일이 필요합니다.", 400);
    }

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const folder = `hub/outreach/${isoCode.toLowerCase()}/${year}-${period}`;

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: "image" },
          (err, res) => {
            if (err) reject(err);
            else if (res?.secure_url) resolve(res);
            else reject(new Error("Upload failed"));
          }
        );
        stream.end(buffer);
      }
    );

    return jsonOk({ url: result.secure_url, public_id: result.public_id });
  } catch (e) {
    console.error("outreach upload error:", e);
    return jsonError(e instanceof Error ? e.message : "이미지 업로드 실패", 500);
  }
}
