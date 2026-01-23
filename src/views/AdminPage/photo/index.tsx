// 파일 경로: /pages/admin/design.tsx

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PageLayout from '@src/components/common/PageLayout';
import * as S from "@src/views/AdminPage/style"; // 메인 레이아웃 스타일은 기존 것을 재활용
import * as DesignS from "@src/views/AdminPage/design/style"; // ⭐️ 새로 만든 디자인 페이지 전용 스타일 import
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

// 통계 API로부터 받을 타입
interface SurveyStats {
    totalResponses: number;
}

// 통계 정보를 가져오는 fetch 함수
const fetchSurveyStats = async (surveyId: string): Promise<SurveyStats> => {
    const response = await fetch(`/api/admin/design/survey-stats?surveyId=${surveyId}`);
    if (!response.ok) {
        throw new Error('설문조사 통계 정보를 가져오는 데 실패했습니다.');
    }
    return response.json();
};

export default function DesignAdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    const [surveyId, setSurveyId] = useState('1');
    const [page, setPage] = useState(1);

    const hasPermission = session?.user?.isAdmin && (session.user.roles?.includes('디자인팀') || session.user.roles?.includes('말씀카드'));

    const { data: stats, isLoading, error } = useQuery<SurveyStats, Error>({
        queryKey: ['surveyStats', surveyId],
        queryFn: () => fetchSurveyStats(surveyId),
        enabled: status === 'authenticated' && hasPermission && !!surveyId,
    });

    const handleDownload = () => {
        window.location.href = `/api/admin/design/download-survey-csv?surveyId=${surveyId}&page=${page}`;
    };

    if (status === 'loading') {
        return <PageLayout><S.InfoText>Loading...</S.InfoText></PageLayout>;
    }

    if (!hasPermission) {
        return (
            <PageLayout>
                <S.Wrapper>
                    <S.Title>접근 권한 없음</S.Title>
                    <S.Subtitle>'디자인팀' 역할이 있는 관리자만 이 페이지를 볼 수 있습니다.</S.Subtitle>
                    <button onClick={() => router.back()}>뒤로가기</button>
                </S.Wrapper>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <S.Wrapper>
                <S.Title>🎨 디자인 관리 (말씀카드 설문)</S.Title>
                <DesignS.DownloadContainer>
                    <S.Subtitle>설문조사 결과 다운로드</S.Subtitle>
                    
                    {isLoading && <p>총 응답 수를 불러오는 중...</p>}
                    {error && <DesignS.ErrorMessage>오류: {error.message}</DesignS.ErrorMessage>}
                    {stats && (
                        <DesignS.StatText>
                            총 <strong>{stats.totalResponses}</strong>개의 응답이 있습니다.
                            (총 {Math.ceil(stats.totalResponses / 100)} 페이지)
                        </DesignS.StatText>
                    )}

                    <DesignS.InputGroup>
                        <label>설문 ID:</label>
                        <input type="text" value={surveyId} onChange={(e) => setSurveyId(e.target.value)} />
                    </DesignS.InputGroup>
                    <DesignS.InputGroup>
                        <label>다운로드할 페이지 (100명 단위):</label>
                        <input type="number" value={page} min="1" onChange={(e) => setPage(parseInt(e.target.value, 10) || 1)} />
                    </DesignS.InputGroup>
                    <DesignS.DownloadButton onClick={handleDownload} disabled={!stats || stats.totalResponses === 0}>
                        CSV 파일 다운로드
                    </DesignS.DownloadButton>
                </DesignS.DownloadContainer>
            </S.Wrapper>
        </PageLayout>
    );
}