import React from 'react';
import styled from '@emotion/styled';
import { AdventPost } from '@src/lib/advent/types';

const SectionCard = styled.div`
  background: #724886;
  padding: 0;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
  height: 520px;
  background-image: url('/icons/intro.svg');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  background-attachment: scroll;
`;

interface IntroSectionProps {
  post: AdventPost;
}

export const IntroSection: React.FC<IntroSectionProps> = ({ post }) => {
  return <SectionCard />;
};

