import { useRouter } from 'next/router';
import { PropsWithChildren, useState } from 'react';
import * as S from './style';

interface BannerColor {
  rout: string; // 이동할 경로 추가
}

export default function MenuButton({ children, rout }: PropsWithChildren<BannerColor>) {
  const router = useRouter();
  const [blurPosition, setBlurPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setBlurPosition({ x, y });
  };

  return (
    <S.RecruitButtonWrapper href="/">
      <S.MouseTrackerWrapper onMouseMove={handleMouseMove} x={blurPosition.x} y={blurPosition.y}>
        <div>{children}</div>
      </S.MouseTrackerWrapper>
    </S.RecruitButtonWrapper>
  );
}
