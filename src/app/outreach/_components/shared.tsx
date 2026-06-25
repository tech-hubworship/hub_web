"use client";

import styled from "@emotion/styled";

export const BG   = "#FFFFFF";
export const TEXT = "#1A1A1A";
export const TEXT2 = "#575757";
export const TEXT3 = "#383838";
export const MUTED  = "#9A9A9A";
export const SUBTLE = "#B5B5B5";
export const SANS = `-apple-system, BlinkMacSystemFont, 'Pretendard', 'Apple SD Gothic Neo', sans-serif`;

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
  background: ${BG};
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
  color: ${MUTED};
  font-size: 14px;
`;

export function LoadingPage({ children }: { children?: React.ReactNode }) {
  return (
    <OutreachPage>
      <AppHeader>
        <HeaderSpacer />
        <HeaderTitle as="span">아웃리치</HeaderTitle>
        <HeaderSpacer />
      </AppHeader>
      <LoadingTextEl>{children ?? "불러오는 중..."}</LoadingTextEl>
    </OutreachPage>
  );
}
