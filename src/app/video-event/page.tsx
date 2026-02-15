import { redirect } from "next/navigation";
import { getVideoEventPath } from "@src/lib/video-event/constants";

/** 기존 /video-event 링크는 현재 이벤트 슬러그 경로로 리다이렉트 */
export default function Page() {
  redirect(getVideoEventPath());
}
