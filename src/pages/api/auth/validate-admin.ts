// 파일 경로: src/pages/api/auth/validate-admin.ts

import { NextApiRequest, NextApiResponse } from 'next';

// 역할과 환경 변수 이름을 매핑하는 객체
const PASSWORD_ENV_MAP: { [key: string]: string | undefined } = {
    'MC': process.env.MC_SIGNUP_PASSWORD,
    '다락방장': process.env.CELL_LEADER_SIGNUP_PASSWORD,
    '그룹장': process.env.GROUP_LEADER_SIGNUP_PASSWORD,
    '목회자': process.env.PASTOR_SIGNUP_PASSWORD,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { role, password } = req.body;

  if (!role || !password) {
    return res.status(400).json({ success: false, message: '역할과 암호를 모두 입력해주세요.' });
  }

  // 1. 요청된 역할에 해당하는 서버의 비밀번호를 가져옵니다.
  const correctPassword = PASSWORD_ENV_MAP[role];

  // 2. 서버에 해당 역할의 비밀번호가 설정되어 있는지 확인합니다.
  if (!correctPassword) {
    console.error(`${role}에 대한 비밀번호가 서버 환경 변수에 설정되지 않았습니다.`);
    return res.status(500).json({ success: false, message: '서버 설정 오류가 발생했습니다.' });
  }

  // 3. 두 암호를 비교하여 일치하는지 확인합니다.
  if (password === correctPassword) {
    res.status(200).json({ success: true, message: '인증에 성공했습니다.' });
  } else {
    res.status(401).json({ success: false, message: '암호가 올바르지 않습니다.' });
  }
}