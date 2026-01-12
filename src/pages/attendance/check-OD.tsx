import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import PageLayout from '@src/components/common/PageLayout';
import { Card, CardContent } from '@src/components/ui/card';

export default function AttendanceCheckODPage() {
  const router = useRouter();
  const { token, category } = router.query;
  const { data: session, status } = useSession();
  
  const [step, setStep] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('출석 확인 중...');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }
    
    // 토큰이 준비되면 단 한 번만 실행
    if (status === 'authenticated' && token && category && step === 'loading') {
      checkIn();
    } else if (status === 'authenticated' && (!token || !category)) {
      setStep('error');
      setMessage('유효하지 않은 접근입니다.');
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
        setStep('success');
        if (data.alreadyChecked) {
           setMessage('이미 출석 완료된 상태입니다.');
        } else {
           setMessage('출석체크가 완료되었습니다!');
        }
      } else {
        // 리더십 권한 에러 처리
        if (data.code === 'REQUIRE_LEADERSHIP') {
          if (confirm('리더십 권한이 필요합니다. 인증 페이지로 이동하시겠습니까?')) {
            router.push('/attendance/verify-leadership');
          } else {
            setStep('error');
            setMessage('리더십 권한이 없어 출석할 수 없습니다.');
          }
        } else {
          setStep('error');
          setMessage(data.error || '출석 처리에 실패했습니다.');
        }
      }
    } catch (e) {
      setStep('error');
      setMessage('네트워크 오류가 발생했습니다.');
    }
  };

  // 결과 화면 렌더링
  const renderContent = () => {
    if (step === 'loading') {
      return <div style={{fontSize: '18px', fontWeight: 'bold'}}>⏳ 확인 중입니다...</div>;
    }

    if (step === 'error') {
      return (
        <div style={{textAlign: 'center'}}>
          <div style={{fontSize: '48px', marginBottom: '16px'}}>🚫</div>
          <h2 style={{fontSize: '20px', fontWeight: 'bold', color: '#dc2626', marginBottom: '12px'}}>{message}</h2>
          <button 
            onClick={() => router.replace('/')}
            style={{padding: '12px 24px', background: '#4b5563', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer'}}
          >
            메인으로 돌아가기
          </button>
        </div>
      );
    }

    // 성공 화면 (정상 vs 지각)
    const isLate = result?.status !== 'present';
    const bgColor = isLate ? '#fef2f2' : '#f0fdf4'; // 연한 빨강 vs 연한 초록
    const textColor = isLate ? '#dc2626' : '#16a34a'; // 빨강 vs 초록

    return (
      <div style={{textAlign: 'center', width: '100%'}}>
        <div style={{fontSize: '64px', marginBottom: '16px'}}>{isLate ? '⚠️' : '✅'}</div>
        <h2 style={{fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px'}}>{message}</h2>
        
        <div style={{margin: '24px 0', padding: '24px', backgroundColor: bgColor, borderRadius: '12px', border: `2px solid ${textColor}`}}>
          <p style={{fontSize: '18px', fontWeight: 'bold', color: '#374151', marginBottom: '8px'}}>
            상태: <span style={{color: textColor, fontSize: '20px'}}>{isLate ? '지각' : '정상 출석'}</span>
          </p>
          
          {isLate && (
            <>
              <div style={{marginTop: '16px', borderTop: '1px solid #fee2e2', paddingTop: '16px'}}>
                <p style={{fontSize: '16px', color: '#4b5563'}}>지각비</p>
                <p style={{fontSize: '28px', fontWeight: 'bold', color: '#dc2626'}}>{result.lateFee.toLocaleString()}원</p>
              </div>
              {result.isReportRequired && (
                <div style={{marginTop: '12px', padding: '8px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #fecaca'}}>
                  <p style={{color: '#dc2626', fontSize: '14px', fontWeight: 'bold'}}>📝 사유서 작성 대상입니다</p>
                </div>
              )}
            </>
          )}
        </div>

        <button 
          onClick={() => router.replace('/')}
          style={{
            width: '100%',
            padding: '16px', 
            backgroundColor: '#2563eb', 
            color: 'white', 
            borderRadius: '12px', 
            border: 'none', 
            fontWeight: 'bold', 
            fontSize: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          확인 (메인으로)
        </button>
      </div>
    );
  };

  return (
    <PageLayout>
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <Card style={{ width: '100%', maxWidth: '400px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          <CardContent style={{ padding: '32px 24px' }}>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}