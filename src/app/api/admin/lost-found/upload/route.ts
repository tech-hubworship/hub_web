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

/** 관리자: Cloudinary에 분실물 이미지 업로드. multipart/form-data file 필드. */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자만 업로드할 수 있습니다.", 403);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return jsonError("Cloudinary 설정(CLOUDINARY_*)이 필요합니다.", 500);
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  // 사진부스와 분리: 분실물 전용 폴더 (기본값 hub/lost-found)
  const folder =
    process.env.CLOUDINARY_LOST_FOUND_FOLDER || "hub/lost-found";

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return jsonError("file 필드에 이미지 파일이 필요합니다.", 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "image",
          },
          (err, res) => {
            if (err) reject(err);
            else if (res && res.secure_url) resolve(res);
            else reject(new Error("Upload failed"));
          }
        );
        uploadStream.end(buffer);
      }
    );

    return jsonOk({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (e) {
    console.error("lost-found upload Error:", e);
    return jsonError(
      e instanceof Error ? e.message : "이미지 업로드에 실패했습니다.",
      500
    );
  }
}
