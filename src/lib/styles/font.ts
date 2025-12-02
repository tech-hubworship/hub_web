import { css } from '@emotion/react';

// CSS @import 제거 - _document.tsx에서 link 태그로 로드하므로 중복 제거
// @import는 렌더링을 차단하므로 link 태그 사용이 더 효율적
// 빈 CSS 객체 반환 (global.ts에서 ${font}로 사용되므로 유지)
const font = css``;

export default font;
