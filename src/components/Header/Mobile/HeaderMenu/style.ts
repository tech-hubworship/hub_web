import styled from '@emotion/styled';
import { colors } from '@sopt-makers/colors';
import Link from 'next/link';
import { css } from '@emotion/react';
import { FadeIn, FadeInDown, FadeOut, FadeOutUp } from '@src/lib/styles/animation';
import { MenuTapType } from '../../types';

type MenuType = 'idle' | 'open' | 'close';

interface CloseButtonProps extends RootProps {
  src: string;
}

interface MenuTitleProps {
  isSelected?: boolean;
  menuColor: MenuTapType;
}

interface RootProps {
  isMenuShown: MenuType;
}

export const Root = styled.div<RootProps>`
  position: fixed;
  top: 60px;

  right: 0;

  z-index: 9;
  box-shadow: 0px 5px 0px rgba(0, 0, 0, 0.5);

  width: 100%;
  height: 100vh;

  ${({ isMenuShown }) => {
    switch (isMenuShown) {
      case 'open':
        return css`
          ${FadeInDown()}
          animation: fadeindown 0.6s;
          -moz-animation: fadeindown 0.6s; /* Firefox */
          -webkit-animation: fadeindown 0.6s; /* Safari and Chrome */
          -o-animation: fadeindown 0.6s; /* Opera */
        `;
      case 'close':
        return css`
          ${FadeOutUp}
          animation: fadeoutup 0.6s;
          -moz-animation: fadeoutup 0.6s; /* Firefox */
          -webkit-animation: fadeoutup 0.6s; /* Safari and Chrome */
          -o-animation: fadeoutup 0.6s; /* Opera */
          animation-fill-mode: forwards;
        `;
      default:
        return css`
          display: none;
        `;
    }
  }}
`;

export const MenuWrap = styled.div`
  /* padding: 0 30px; */
  height: 100%;
`;

export const Background = styled.div`
  height: 100vh;
  background: #ffffff;
  opacity: 0.8;
`;

export const CloseButton = styled.button<CloseButtonProps>`
  position: relative;
  top: 12px;
  left: 272px;

  background: url(${(props: CloseButtonProps) => props.src}) no-repeat;
  background-size: cover;
  cursor: pointer;

  width: 28px;
  height: 28px;

  ${({ isMenuShown }) => {
    switch (isMenuShown) {
      case 'open':
        return css`
          ${FadeIn}
          animation: fadein 0.2s;
          -moz-animation: fadein 0.2s; /* Firefox */
          -webkit-animation: fadein 0.2s; /* Safari and Chrome */
          -o-animation: fadein 0.2s; /* Opera */
        `;
      case 'close':
        return css`
          ${FadeOut}
          animation: fadeout 0.2s;
          -moz-animation: fadeout 0.2s; /* Firefox */
          -webkit-animation: fadeout 0.2s; /* Safari and Chrome */
          -o-animation: fadeout 0.2s; /* Opera */
          animation-fill-mode: forwards;
        `;
      default:
        return css`
          display: none;
        `;
    }
  }}
`;

export const ContentsWrap = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: #ffffff;

  padding-top: 10px;
  margin-bottom: 0px;

  height: 268px;
`;

export const MenuTitlesWrap = styled.div`
  display: grid;
  grid-template-columns: repeat(1);
  row-gap: 12px;

  padding-bottom: 30px;
`;

export const MenuTitleAnchor = styled(Link)`
  display: block;

  color: inherit;
  text-decoration: none;
`;

export const MenuTitle = styled.div<MenuTitleProps>`
  font-size: 18px;
  line-height: 37px;
  font-family: var(--font-wanted);

  font-weight: ${({ isSelected }) => (isSelected ? '700' : '700')};

  color: ${({ isSelected }) => (isSelected ? '#ED2725' : '#000000')};
  cursor: pointer;
  width: fit-content;

  & * {
    font-size: 100%;
  }

  &:not(:last-child) {
    margin-left: 30px;
  }

`;




