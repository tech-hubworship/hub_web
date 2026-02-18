/**
 * Footer 컴포넌트
 * 
 * HUB Worship 웹사이트의 하단 푸터입니다.
 * - 문의사항 폼 제공
 * - 소셜 미디어 링크
 * - 저작권 정보 표시
 * - 메이커스 정보
 * 
 * @author HUB Development Team
 * @version 1.0.0
 */

import OriginFooter from "./OriginFooter";

/**
 * Footer 컴포넌트
 *
 * @param variant "dark"면 페이지와 동일한 어두운 배경(#121212). 기도시간 등 앱 화면에서 사용.
 */
export default function Footer({ variant }: { variant?: "default" | "dark" }) {
  return <OriginFooter variant={variant} />;
}
