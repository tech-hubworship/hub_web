import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@src/lib/supabase';
import PageLayout from '@src/components/common/PageLayout';
import * as S from './style';

export default function TshirtSignupPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [group_name, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 11) {
      let formattedNumber = '';
      if (value.length <= 3) {
        formattedNumber = value;
      } else if (value.length <= 7) {
        formattedNumber = `${value.slice(0, 3)}-${value.slice(3)}`;
      } else {
        formattedNumber = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
      }
      setPhoneNumber(formattedNumber);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 4) {
      setPassword(value);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 4) {
      setConfirmPassword(value);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGroupName(e.target.value);
  };

  const validateForm = () => {
    if (!phoneNumber || !password || !confirmPassword || !name) {
      setError('모든 필수 정보를 입력해주세요.');
      return false;
    }

    if (phoneNumber.replace(/-/g, '').length !== 11) {
      setError('휴대폰 번호를 정확히 입력해주세요.');
      return false;
    }

    if (password.length !== 4) {
      setError('비밀번호는 4자리 숫자로 입력해주세요.');
      return false;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }

    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // 전화번호 중복 확인
      const { data: existingUser, error: checkError } = await supabase
        .from('tshirt_users')
        .select('phone_number')
        .eq('phone_number', phoneNumber)
        .single();

      if (existingUser) {
        setError('이미 등록된 전화번호입니다.');
        setIsLoading(false);
        return;
      }

      // 회원 등록
      const { data, error } = await supabase
        .from('tshirt_users')
        .insert([
          {
            phone_number: phoneNumber,
            password: password,
            name: name,
            group_name: group_name
          }
        ]);

      if (error) {
        throw error;
      }

      // 회원가입 성공
      alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
      router.push('/login');
      
    } catch (err) {
      console.error('회원가입 오류:', err);
      setError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout>
      <S.Container>
        <S.Title>티셔츠 구매 회원가입</S.Title>
        <S.Subtitle>신규 회원 정보를 입력해주세요</S.Subtitle>
        
        <S.Form onSubmit={handleSignup}>
          <S.Label>
            휴대폰 번호 <S.Required>*</S.Required>
          </S.Label>
          <S.Input
            type="tel"
            placeholder="010-0000-0000"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            required
          />
          
          <S.Label>
            비밀번호 <S.Required>*</S.Required>
          </S.Label>
          <S.Input
            type="password"
            placeholder="4자리 숫자"
            value={password}
            onChange={handlePasswordChange}
            required
          />
          <S.PasswordHint>4자리 숫자로 입력해주세요</S.PasswordHint>
          
          <S.Label>
            비밀번호 확인 <S.Required>*</S.Required>
          </S.Label>
          <S.Input
            type="password"
            placeholder="비밀번호 확인"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            required
          />
          
          <S.Label>
            이름 <S.Required>*</S.Required>
          </S.Label>
          <S.Input
            type="text"
            placeholder="이름"
            value={name}
            onChange={handleNameChange}
            required
          />
          
          <S.Label>
            소속 공동체
          </S.Label>
          <S.Input
            type="text"
            placeholder="소속 공동체 (선택사항)"
            value={group_name}
            onChange={handleGroupNameChange}
          />
          
          {error && (
            <S.ErrorMessage>
              {error}
            </S.ErrorMessage>
          )}
          
          <S.ButtonGroup>
            <S.Button type="submit" disabled={isLoading}>
              {isLoading ? '처리 중...' : '회원가입'}
            </S.Button>
            <S.LinkButton type="button" onClick={() => router.push('/login')}>
              이미 계정이 있으신가요? 로그인
            </S.LinkButton>
          </S.ButtonGroup>
        </S.Form>
      </S.Container>
    </PageLayout>
  );
} 