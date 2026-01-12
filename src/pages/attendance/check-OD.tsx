import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import PageLayout from '@src/components/common/PageLayout'; // 레이아웃 활용

export default function AttendanceCheckPage() {
  const router = useRouter();
  const { token, category } = router.query;
  const { data: session, status } = useSession();
  const [message, setMessage] = useState('출석 처리 중입니다...');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    // 1. 로그인 안되어 있으면 로그인 페이지로
    if (status === 'unauthenticated') {
        router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
        return;
    }
    
    // 2. 로그인 & 토큰 있으면 출석 시도
    if (status === 'authenticated' && token && category) {
        checkIn();
    }
  }, [status, token, category]);

  const checkIn = async () => {
    try {
        const res = await fetch('/api/attendance/check-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, category })
        });
        const data = await res.json();

        if (res.ok) {
            setResult(data.result);
            if (data.alreadyChecked) {
               setMessage('이미 출석이 완료된 상태입니다.');
            } else {
               setMessage('출석이 완료되었습니다!');
            }
            // 3초 후 메인으로
            setTimeout(() => router.push('/'), 3000);
        } else {
            // 리더십 권한 에러 처리
            if (data.code === 'REQUIRE_LEADERSHIP') {
                if (confirm('OD 출석은 리더십만 가능합니다. 리더십 인증 페이지로 이동하시겠습니까?')) {
                    router.push('/attendance/verify-leadership');
                } else {
                    setMessage('출석 실패: 리더십 권한이 필요합니다.');
                }
            } else {
                setMessage(`오류: ${data.error}`);
            }
        }
    } catch (e) {
        setMessage('네트워크 오류가 발생했습니다.');
    }
  };

  return (
    <PageLayout>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>{message}</h1>
        
        {result && (
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                <p>지각비: <strong>{result.lateFee}원</strong></p>
                {result.isReportRequired && <p style={{ color: 'red' }}>⚠️ 사유서 작성이 필요합니다.</p>}
            </div>
        )}
      </div>
    </PageLayout>
  );
}