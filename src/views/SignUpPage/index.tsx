// 파일 경로: src/pages/signup/index.tsx

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import PageLayout from '@src/components/common/PageLayout';
import * as S from '@src/views/LoginPage/style';

export default function SignUpPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '', birth_date: '', phone_number: '', gender: 'M',
    cell_name: '', leader_name: '', community: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || !session?.user) {
      router.replace('/login');
      return;
    }
    const { user } = session;
    if (!user.isNewUser) {
      router.replace('/Info');
      return;
    }
    if (user.name) {
      setFormData(prev => ({ ...prev, name: user.name ?? '' }));
    }
  }, [session, status, router]);
  
  // ⭐️ [수정] 입력값 변경을 처리하는 함수
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // 'birth_date' 입력 필드일 경우에만 자동 하이픈 로직을 적용합니다.
    if (name === 'birth_date') {
      const onlyNumbers = value.replace(/[^\d]/g, ''); // 숫자 이외의 문자는 모두 제거
      let formattedDate = onlyNumbers;

      // YYYY-MM 형식으로 자동 변환
      if (onlyNumbers.length > 4) {
        formattedDate = `${onlyNumbers.slice(0, 4)}-${onlyNumbers.slice(4)}`;
      }
      // YYYY-MM-DD 형식으로 자동 변환
      if (onlyNumbers.length > 6) {
        formattedDate = `${onlyNumbers.slice(0, 4)}-${onlyNumbers.slice(4, 6)}-${onlyNumbers.slice(6, 8)}`;
      }
      
      setFormData(prev => ({ ...prev, [name]: formattedDate }));
    } else {
      // 다른 입력 필드는 기존 방식대로 처리
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { name, birth_date, phone_number, gender, cell_name, leader_name, community } = formData;
    if (!name || !birth_date || !phone_number || !gender || !cell_name || !leader_name || !community) {
      setError('모든 항목을 빠짐없이 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '오류가 발생했습니다.');
      
      alert('회원가입이 완료되었습니다!');
      router.replace('/Info');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status !== 'authenticated' || !session?.user?.isNewUser) {
    return <PageLayout><div>Loading...</div></PageLayout>;
  }

  return (
    <PageLayout>
      <Head><title>회원가입</title></Head>
      <S.Wrapper>
        <S.LoginCard as="form" onSubmit={handleSubmit}>
          <S.Title>추가 정보 입력</S.Title>
          <S.Subtitle>원활한 서비스 이용을 위해 모든 정보를 입력해주세요.</S.Subtitle>
          
          <S.InputGroup>
            <S.Label>실명 (본명)*</S.Label>
            <S.Input name="name" value={formData.name} onChange={handleChange} required />
          </S.InputGroup>
          
          {/* ⭐️ [수정] 생년월일 입력 필드 */}
          <S.InputGroup>
            <S.Label>생년월일*</S.Label>
            <S.Input 
              name="birth_date" 
              type="text" // 타입을 'text'로 변경
              placeholder="YYYYMMDD" // 사용자 안내 문구 추가
              value={formData.birth_date} 
              onChange={handleChange} 
              maxLength={10} // 'YYYY-MM-DD' 길이에 맞게 설정
              required 
            />
          </S.InputGroup>

          <S.InputGroup>
            <S.Label>전화번호* ('-' 없이)</S.Label>
            <S.Input name="phone_number" type="tel" value={formData.phone_number} onChange={handleChange} maxLength={11} required />
          </S.InputGroup>

          <S.InputGroup>
            <S.Label>성별*</S.Label>
            <S.Select name="gender" value={formData.gender} onChange={handleChange} required>
              <option value="M">남성</option>
              <option value="F">여성</option>
            </S.Select>
          </S.InputGroup>

          <S.InputGroup>
            <S.Label>다락방 이름*</S.Label>
            <S.Input name="cell_name" onChange={handleChange} required />
          </S.InputGroup>

          <S.InputGroup>
            <S.Label>순장 이름*</S.Label>
            <S.Input name="leader_name" onChange={handleChange} required />
          </S.InputGroup>
          
          <S.InputGroup>
            <S.Label>소속 공동체*</S.Label>
            <S.Select name="community" value={formData.community} onChange={handleChange} required>
              <option value="">-- 선택 --</option>
              <option value="허브">허브</option>
              <option value="타공동체">타공동체</option>
            </S.Select>
          </S.InputGroup>

          {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
          
          <S.SubmitButton type="submit" disabled={loading}>
            {loading ? '가입하는 중...' : '가입 완료'}
          </S.SubmitButton>
        </S.LoginCard>
      </S.Wrapper>
    </PageLayout>
  );
}