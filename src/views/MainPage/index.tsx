import { useQuery } from "@tanstack/react-query";
import PageLayout from "@src/components/common/PageLayout";
import { remoteAdminAPI } from "@src/lib/api/remote/admin";
import { GetHomepageResponse } from "@src/lib/types/admin";
import dynamic from 'next/dynamic';
import { Suspense, memo, ReactNode, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import Head from 'next/head';

// 초기 로드할 컴포넌트는 preload로 설정
const Banner = dynamic(() => import('./components/Banner'), { 
  ssr: true,
  loading: () => <div style={{ minHeight: '300px', background: '#f8f9fa' }}></div>
});

// 나머지 컴포넌트는 지연 로딩
const Main = dynamic(() => import('./components/Main'), { 
  ssr: false,
  loading: () => <div style={{ minHeight: '52px', background: '#f8f9fa' }}></div>
});
const Schedule = dynamic(() => import('./components/Schedule'), { 
  ssr: false,
  loading: () => <div style={{ minHeight: '300px', background: '#f8f9fa' }}></div>
});
const Faq = dynamic(() => import('./components/Faq'), { 
  ssr: false,
  loading: () => <div style={{ minHeight: '300px', background: '#f8f9fa' }}></div>
});
const TshirtsBanner = dynamic(() => import('./components/TshirtsBanner'), { 
  ssr: false,
  loading: () => <div style={{ minHeight: '200px', background: '#f8f9fa' }}></div>
});
const ContentBanner = dynamic(() => import('./components/ContentBanner'), { 
  ssr: false,
  loading: () => <div style={{ minHeight: '200px', background: '#f8f9fa' }}></div>
});
const WallpaperDownload = dynamic(() => import('./components/WallpaperDownload'), { 
  ssr: false,
  loading: () => <div style={{ minHeight: '300px', background: '#f8f9fa' }}></div>
});

// 뷰포트 관찰 옵션
const viewportOptions = {
  triggerOnce: true,
  threshold: 0.1,
  rootMargin: '200px 0px', // 더 빠른 로딩을 위해 rootMargin 증가
};

// 뷰포트 기반 로딩 컴포넌트
interface LazyLoadSectionProps {
  children: ReactNode;
  id: string;
  priority?: boolean;
}

const LazyLoadSection = ({ children, id, priority = false }: LazyLoadSectionProps) => {
  const { ref, inView } = useInView({
    ...viewportOptions,
    // 우선순위가 높은 컴포넌트는 더 빠르게 로드
    rootMargin: priority ? '300px 0px' : '200px 0px',
  });
  const [shouldRender, setShouldRender] = useState(false);
  
  // 뷰가 들어오면 렌더링 상태 업데이트
  useEffect(() => {
    if (inView) {
      setShouldRender(true);
    }
  }, [inView]);

  return (
    <div ref={ref} id={id} style={{ 
      minHeight: '50px',
      width: '100%',
      contain: 'content',  // 레이아웃 시프트 방지
    }}>
      {(shouldRender || priority) && children}
    </div>
  );
};

// 메인 페이지 컴포넌트 메모이제이션
const MainPage = memo(function MainPage() {
  // 더 긴 staleTime으로 불필요한 리패칭 방지
  const { data: adminData } = useQuery<GetHomepageResponse>({
    queryKey: ["homepage"],
    queryFn: remoteAdminAPI.getHomepage,
    staleTime: 10 * 60 * 1000, // 10분으로 증가
    gcTime: 30 * 60 * 1000,    // 30분으로 증가
  });

  return (
    <>
      <Head>
        {/* 프리로드 및 프리커넥트 힌트 추가 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <PageLayout>
        {/* 배너는 최우선 순위로 로드 */}
        <LazyLoadSection id="banner-section" priority={true}>
          <Banner />
        </LazyLoadSection>
        
        {/* 중요 콘텐츠는 두 번째 우선순위 */}
        <LazyLoadSection id="main-section" priority={true}>
          <Main />
        </LazyLoadSection>
        
        {/* 나머지 컴포넌트는 스크롤 시 로드 */}
        {/* <LazyLoadSection id="schedule-section">
          <Schedule />
        </LazyLoadSection> */}
        
        {/* <LazyLoadSection id="tshirts-section">
          <TshirtsBanner />
        </LazyLoadSection> */}
        
        {/* <LazyLoadSection id="faq-section">
          <Faq />
        </LazyLoadSection> */}

<LazyLoadSection id="wallpaper-section">
          <WallpaperDownload />
        </LazyLoadSection>
        
        <LazyLoadSection id="content-section">
          <ContentBanner />
        </LazyLoadSection>
        

      </PageLayout>
    </>
  );
});

export default MainPage;
