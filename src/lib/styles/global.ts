import { colors } from '@sopt-makers/colors';
import { css } from '@emotion/react';
import font from './font';

export const global = css`
  ${font}

  :root {
    --font-wanted: "Wanted Sans Variable", "Wanted Sans", -apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: var(--font-wanted);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    letter-spacing: -0.01em;
  }

  html {
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    font-size: 6.25%;
    scroll-behavior: smooth;
  }

  body {
    background-color: ${colors.background};
    line-height: 1.5;
  }

  h1, h2, h3, h4, h5, h6, p {
    color: #fcfcfc;
  }

  button {
    outline: 0;
    border: none;
    background: none;
    padding: 0;
    cursor: pointer;
  }

  input, textarea, select {
    outline: none;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  ::-webkit-scrollbar {
    display: none;
  }

  article, aside, details, figcaption, figure, 
  footer, header, hgroup, menu, nav, section {
    display: block;
  }

  ol, ul {
    list-style: none;
  }

  blockquote, q {
    quotes: none;
    &:before, &:after {
      content: '';
      content: none;
    }
  }

  table {
    border-collapse: collapse;
    border-spacing: 0;
  }
`;
