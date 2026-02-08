import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react'; 
import { Card, CardContent, CardHeader, CardTitle } from '@src/components/ui/card';
import { Combobox } from '@src/components/ui/combobox';

export default function QrGenerator() {
  const [qrToken, setQrToken] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [category, setCategory] = useState('OD');
  const [startHour, setStartHour] = useState(10);
  const [startMinute, setStartMinute] = useState(0);

  const fetchQr = async () => {
    try {
      const res = await fetch('/api/attendance/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, startHour, startMinute })
      });
      const data = await res.json();
      
      if (res.ok) {
        setQrToken(data.token);
        setTimeLeft(60); 
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
    ? `${window.location.origin}/attendance/check-OD?token=${qrToken}&category=${category}`
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
            <Combobox
              value={category}
              onChange={(val) => setCategory(val)}
              options={[
                { value: 'OD', label: 'OD' },
                { value: 'HUB_UP', label: '허브업' }
              ]}
              placeholder="카테고리 선택"
              searchable={false} 
            />
          </div>

          <div style={{ width: '100%', maxWidth: '320px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', display: 'block' }}>
              지각 기준 시각 (이 시각 이후 출석 시 지각)
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="number"
                min={0}
                max={23}
                value={startHour}
                onChange={(e) => setStartHour(Math.min(23, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                style={{ width: '60px', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '16px', textAlign: 'center' }}
              />
              <span style={{ fontSize: '18px', fontWeight: 600, color: '#374151' }}>:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={String(startMinute).padStart(2, '0')}
                onChange={(e) => setStartMinute(Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                style={{ width: '60px', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '16px', textAlign: 'center' }}
              />
              <span style={{ fontSize: '14px', color: '#6b7280' }}>시부터 지각</span>
            </div>
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
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
            >
              QR 코드 생성 시작
            </button>
          ) : (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'white', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '12px', display: 'inline-block' }}>
                <QRCodeSVG value={qrUrl} size={300} level="H" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
                {timeLeft}초 후 갱신됨
              </div>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                * 이 화면을 스크린이나 모니터에 띄워주세요.
              </p>
              <button
                type="button"
                onClick={() => setQrToken('')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ef4444'; }}
              >
                QR 종료
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}