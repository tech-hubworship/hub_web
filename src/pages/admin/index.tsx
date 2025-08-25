import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import { loginAdmin } from '@src/lib/api/admin';
import { useAdminAuthStore } from '@src/store/adminAuth';
import Head from 'next/head';

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, setAdmin, checkSessionExpiry } = useAdminAuthStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 이미 로그인된 경우 주문 관리 페이지로 리다이렉트
  useEffect(() => {
    checkSessionExpiry();
    if (isAuthenticated && isAdmin) {
      router.push('/admin/tshirtsorder');
    }
  }, [isAuthenticated, isAdmin, router, checkSessionExpiry]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (!phoneNumber.trim() || !password.trim()) {
        throw new Error('전화번호와 비밀번호를 모두 입력해주세요.');
      }
      
      const result = await loginAdmin(phoneNumber.trim(), password.trim());
      
      if (result.success) {
        setAdmin(phoneNumber.trim());
        router.push('/admin/tshirtsorder');
      } else {
        throw new Error(result.error || '로그인에 실패했습니다. 인증 정보를 확인해주세요.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Head>
        <title>관리자 로그인 | 허브 커뮤니티</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <Container>
        <LoginBox>
          <Title>관리자 로그인</Title>
          
          <Form onSubmit={handleSubmit}>
            <InputGroup>
              <Label htmlFor="phoneNumber">전화번호</Label>
              <Input
                id="phoneNumber"
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="01012345678"
                disabled={loading}
              />
            </InputGroup>
            
            <InputGroup>
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                disabled={loading}
              />
            </InputGroup>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            
            <LoginButton type="submit" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </LoginButton>
          </Form>
          
          <BackLink onClick={() => router.push('/')}>
            홈으로 돌아가기
          </BackLink>
        </LoginBox>
      </Container>
    </>
  );
}

// 스타일 컴포넌트
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 16px;
`;

const LoginBox = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 32px;
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
  text-align: center;
  color: #000;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #333;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #000;
  }
  
  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: #e53e3e;
  font-size: 14px;
  margin-top: 8px;
`;

const LoginButton = styled.button`
  background-color: #000;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  
  &:hover {
    background-color: #222;
  }
  
  &:disabled {
    background-color: #999;
    cursor: not-allowed;
  }
`;

const BackLink = styled.button`
  background: none;
  border: none;
  color: #666;
  font-size: 14px;
  text-align: center;
  cursor: pointer;
  margin-top: 16px;
  width: 100%;
  
  &:hover {
    text-decoration: underline;
    color: #000;
  }
`; 