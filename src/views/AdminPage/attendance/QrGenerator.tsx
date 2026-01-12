import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@src/components/ui/card'; // @src 사용
import { Combobox } from '@src/components/ui/combobox'; // Select 대신 Combobox 사용

export default function QrGenerator() {
  const [qrToken, setQrToken] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [category, setCategory] = useState('OD');

  const fetchQr = async () => {
    try {
      const res = await fetch('/api/attendance/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      });
      const data = await res.json();
      
      if (res.ok) {
        setQrToken(data.token);
        setTimeLeft(60); // 1분
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!qrToken) return;
    const interval = setInterval(fetchQr, 60000);
    const timer = setInterval(() => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [qrToken]);

  const qrUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/attendance/check?token=${qrToken}&category=${category}`
    : '';

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <CardHeader>
          <CardTitle>출석 QR 생성 (MC 전용)</CardTitle>
        </CardHeader>
        <CardContent style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          
          <div style={{ width: '100%', maxWidth: '320px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', display: 'block' }}>
              출석 카테고리
            </label>
            {/* 기존 Combobox 컴포넌트 활용 */}
            <Combobox
              value={category}
              onChange={(val) => setCategory(val)}
              options={[
                { value: 'OD', label: 'OD (리더십)' },
                { value: 'HUB_UP', label: '허브업' }
              ]}
              placeholder="카테고리 선택"
              searchable={false}
            />
          </div>

          {!qrToken ? (
            <button 
              onClick={fetchQr} 
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              QR 코드 생성 시작
            </button>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: 'white', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '12px', display: 'inline-block', marginBottom: '16px' }}>
                <QRCodeSVG value={qrUrl} size={300} level="H" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb', marginBottom: '8px' }}>
                {timeLeft}초 후 갱신됨
              </div>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                * 이 화면을 스크린이나 모니터에 띄워주세요.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}