import { css } from '@emotion/react';

// 부크크명조(BookkMyungjo) - 아웃리치 명조 표기용. public/fonts/ 에 OTF 배치.
// Light(300) / Bold(700) 두 굵기만 사용. display:swap 으로 렌더 차단 방지.
const font = css`
  @font-face {
    font-family: 'BookkMyungjo';
    font-style: normal;
    font-weight: 300;
    font-display: swap;
    src: url('/fonts/BookkMyungjo-Light.otf') format('opentype');
  }
  @font-face {
    font-family: 'BookkMyungjo';
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url('/fonts/BookkMyungjo-Bold.otf') format('opentype');
  }
`;

export default font;
