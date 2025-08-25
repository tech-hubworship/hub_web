import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Auth() {
  const [name, setName] = useState<string>(''); // 문자열 타입 지정
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      router.push('/myinfo'); // 로그인 상태면 바로 이동
    }
  }, [router]);

  const handleLogin = () => {
    if (name.trim()) {
      localStorage.setItem('user', name);
      Cookies.set('user', name, { expires: 7 }); // 쿠키 저장 (7일 유지)
      router.push('/myinfo');
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>로그인 / 회원가입</h1>
      <input
        type="text"
        placeholder="이름 입력"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ margin: '10px', padding: '5px' }}
      />
      <button onClick={handleLogin} style={{ padding: '5px 10px', marginLeft: '5px' }}>
        로그인 / 회원가입
      </button>
    </div>
  );
}
