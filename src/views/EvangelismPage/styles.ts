import styled from "@emotion/styled";

// 원본 프로토타입의 디자인 토큰
export const C = {
  green: "#183a31",
  green2: "#31594b",
  cream: "#f7f5ef",
  ink: "#202923",
  muted: "#68736b",
  line: "#e5e7df",
  sage: "#e7eee7",
  panel: "#ffffff",
  darkPanel: "#e9eee6",
};

export const Page = styled.main`
  background: ${C.cream};
  color: ${C.ink};
  font-family: "Nanum Myeongjo", system-ui, -apple-system, "Apple SD Gothic Neo",
    "Noto Sans KR", sans-serif;
  line-height: 1.6;
  min-height: 100vh;
  overflow-x: hidden;
`;

export const Wrap = styled.div`
  width: min(1080px, calc(100% - 36px));
  margin: auto;
`;

export const Section = styled.section`
  padding: 40px 0;
  scroll-margin-top: 18px;

  @media (max-width: 768px) {
    padding: 26px 0;
  }
`;

export const Kicker = styled.div`
  font-size: 11px;
  letter-spacing: 0.16em;
  font-weight: 800;
  color: ${C.green2};
`;

export const H2 = styled.h2`
  font-size: clamp(25px, 4vw, 36px);
  line-height: 1.25;
  letter-spacing: -0.045em;
  margin: 7px 0;
  color: ${C.ink};
`;

export const SectionHead = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: end;
  margin-bottom: 24px;

  p {
    color: ${C.muted};
    font-size: 14px;
    margin: 0;
  }

  @media (max-width: 768px) {
    display: block;
    margin-bottom: 18px;

    p {
      margin-top: 6px;
    }
  }
`;

export const Panel = styled.div<{ dark?: boolean }>`
  background: ${(p) => (p.dark ? C.darkPanel : C.panel)};
  border: 1px solid ${(p) => (p.dark ? C.darkPanel : C.line)};
  border-radius: 20px;
  padding: clamp(22px, 4vw, 36px);

  h3 {
    font-size: 23px;
    line-height: 1.3;
    letter-spacing: -0.04em;
    margin: 8px 0 12px;
    color: ${C.ink};
  }
  p {
    color: #56645b;
    font-size: 14px;
  }
`;

export const Tag = styled.span`
  display: inline-block;
  background: #eaf0e9;
  color: #345444;
  padding: 5px 10px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 750;
`;

export const Small = styled.p`
  font-size: 12px;
  color: ${C.muted};
`;

export const Btn = styled.a<{ variant?: "dark" | "outline" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 17px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 750;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;

  ${(p) =>
    p.variant === "dark"
      ? `background:${C.green};color:#fff;`
      : p.variant === "outline"
        ? `background:transparent;color:inherit;border-color:currentColor;`
        : `background:#e3eddf;color:#193b30;`}
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;
