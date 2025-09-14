/**
 * MainPage 컴포넌트
 * 
 * HUB Worship 웹사이트의 메인 페이지입니다.
 * - 지연 로딩(Lazy Loading)을 통한 성능 최적화
 * - 뷰포트 기반 컴포넌트 로딩으로 초기 로딩 시간 단축
 * - 동적 import를 통한 코드 분할
 * 
 * @author HUB Development Team
 * @version 1.0.0
 */

import PageLayout from "@src/components/common/PageLayout";
import dynamic from 'next/dynamic';
import { memo, ReactNode, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import Head from 'next/head';

/**
 * 동적 컴포넌트 로딩 설정
 * 성능 최적화를 위해 컴포넌트를 필요할 때만 로드합니다.
 */

// 초기 로드할 컴포넌트는 preload로 설정 (SSR 활성화)
const Banner = dynamic(() => import('./components/Banner'), { 
  ssr: true, // 서버사이드 렌더링 활성화
  loading: () => <div style={{ minHeight: '300px', background: '#f8f9fa' }}></div>
});

// 나머지 컴포넌트는 지연 로딩 (클라이언트 사이드에서만 로드)
const Main = dynamic(() => import('./components/Main'), { 
  ssr: false,
  loading: () => <div style={{ minHeight: '52px', background: '#f8f9fa' }}></div>
});
const ContentBanner = dynamic(() => import('./components/ContentBanner'), { 
  ssr: false,
  loading: () => <div style={{ minHeight: '200px', background: '#f8f9fa' }}></div>
});
const WallpaperDownload = dynamic(() => import('./components/WallpaperDownload'), { 
  ssr: false,
  loading: () => <div style={{ minHeight: '300px', background: '#f8f9fa' }}></div>
});

/**
 * 뷰포트 관찰 옵션
 * Intersection Observer API를 사용하여 스크롤 기반 컴포넌트 로딩
 */
const viewportOptions = {
  triggerOnce: true, // 한 번만 트리거
  threshold: 0.1, // 10% 보일 때 트리거
  rootMargin: '200px 0px', // 더 빠른 로딩을 위해 rootMargin 증가
};

/**
 * LazyLoadSection 컴포넌트 Props
 */
interface LazyLoadSectionProps {
  children: ReactNode; // 렌더링할 자식 컴포넌트
  id: string; // 섹션 식별자
  priority?: boolean; // 우선순위 로딩 여부
}

/**
 * LazyLoadSection 컴포넌트
 * 
 * 뷰포트 기반 지연 로딩을 구현합니다.
 * 사용자가 스크롤하여 해당 영역이 보이기 시작할 때 컴포넌트를 로드합니다.
 * 
 * @param children 렌더링할 자식 컴포넌트
 * @param id 섹션 식별자 (디버깅 및 스타일링용)
 * @param priority 우선순위 로딩 여부 (더 빠른 rootMargin 적용)
 */
const LazyLoadSection = ({ children, id, priority = false }: LazyLoadSectionProps) => {
  // Intersection Observer를 통한 뷰포트 감지
  const { ref, inView } = useInView({
    ...viewportOptions,
    // 우선순위가 높은 컴포넌트는 더 빠르게 로드 (더 큰 rootMargin)
    rootMargin: priority ? '300px 0px' : '200px 0px',
  });
  
  // 렌더링 상태 관리
  const [shouldRender, setShouldRender] = useState(false);
  
  // 뷰가 들어오면 렌더링 상태 업데이트
  useEffect(() => {
    if (inView) {
      setShouldRender(true);
    }
  }, [inView]);

  return (
    <div 
      ref={ref} 
      id={id} 
      style={{ 
        minHeight: '50px',
        width: '100%',
        contain: 'content',  // 레이아웃 시프트 방지
      }}
    >
      {/* 뷰포트에 들어왔거나 우선순위가 높으면 렌더링 */}
      {(shouldRender || priority) && children}
    </div>
  );
};

/**
 * MainPage 컴포넌트
 * 
 * HUB Worship 웹사이트의 메인 페이지를 렌더링합니다.
 * React.memo를 사용하여 불필요한 리렌더링을 방지합니다.
 */
const MainPage = memo(function MainPage() {

  return (
    <>
      {/* SEO 및 성능 최적화를 위한 메타 태그 */}
      <Head>
        {/* Google Fonts 프리로드 및 프리커넥트 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      
      <PageLayout>
        {/* 배너 섹션 - 최우선 순위로 로드 */}
        <LazyLoadSection id="banner-section" priority={true}>
          <Banner />
        </LazyLoadSection>
        
        {/* 메인 콘텐츠 섹션 - 두 번째 우선순위 */}
        <LazyLoadSection id="main-section" priority={true}>
          <Main />
        </LazyLoadSection>
    
        {/* 배경화면 다운로드 섹션 */}
        <LazyLoadSection id="wallpaper-section">
          <WallpaperDownload />
        </LazyLoadSection>
        
        {/* 콘텐츠 배너 섹션 */}
        <LazyLoadSection id="content-section">
          <ContentBanner />
        </LazyLoadSection>
      </PageLayout>
    </>
  );
});

export default MainPage;
