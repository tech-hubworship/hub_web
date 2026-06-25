"use client";

import styled from "@emotion/styled";

export const BG   = "#FFFAF0";
export const TEXT = "#513400";
export const TEXT2 = "#575757";
export const SUBTLE = "#757575";

// 서비스 메인 빨강
export const PRIMARY = "#A03518";

// 지도 방문 횟수별 색상
export const VISIT_1 = "#EB927A"; // 1회
export const VISIT_2 = "#E15C37"; // 2회
export const VISIT_3 = "#B13B1B"; // 3회 이상

// 지도 베이스
export const LAND = "#FFF1D6";   // 미방문 육지
export const OCEAN = "#FAEED9";  // 바다(이미지 폴백)
export const BORDER = "#A07018"; // 국경선·골드 보더

// 중립 톤
export const LINE = "#E6E6E6";    // 테두리·구분선
export const SURFACE = "#EDE8DE"; // 따뜻한 베이지 면 (맵 영역·핸들 등)
export const CHIP = "#FFFCF5";    // 거의 흰 cream 칩 면
export const SANS = `-apple-system, BlinkMacSystemFont, 'Pretendard', 'Apple SD Gothic Neo', sans-serif`;
export const SERIF = `'Nanum Myeongjo', 'AppleMyungjo', 'Apple SD Gothic Neo', serif`;

// ─── Base ────────────────────────────────────────────────────────────────────

export const OutreachPage = styled.div`
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: ${BG};
  color: ${TEXT};
  font-family: ${SANS};
  line-height: 1.5;
  letter-spacing: -0.02em;
  max-width: 480px;
  margin: 0 auto;
  :where(h1, h2, h3, h4, h5, h6, p) { color: inherit; }
`;

export const AppHeader = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  background: transparent;
`;

export const HeaderBtn = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  font-size: 22px;
  color: ${TEXT};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const HeaderSpacer = styled.div`
  width: 40px;
  height: 40px;
`;

export const HeaderTitle = styled.div<{ role?: string }>`
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  color: ${TEXT};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: ${({ role }) => (role === "button" ? "pointer" : "default")};
`;

// ─── Loading ─────────────────────────────────────────────────────────────────

const LoadingTextEl = styled.div`
  padding: 60px 20px;
  text-align: center;
  color: ${SUBTLE};
  font-size: 14px;
`;

export function LoadingPage({ children }: { children?: React.ReactNode }) {
  return (
    <OutreachPage>
      <AppHeader>
        <HeaderSpacer />
        <HeaderTitle as="span">해외 아웃리치 아카이브</HeaderTitle>
        <HeaderSpacer />
      </AppHeader>
      <LoadingTextEl>{children ?? "불러오는 중..."}</LoadingTextEl>
    </OutreachPage>
  );
}
