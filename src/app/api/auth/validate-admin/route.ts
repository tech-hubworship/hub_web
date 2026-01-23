// 역할과 환경 변수 이름을 매핑하는 객체
const PASSWORD_ENV_MAP: { [key: string]: string | undefined } = {
  MC: process.env.MC_SIGNUP_PASSWORD,
  다락방장: process.env.CELL_LEADER_SIGNUP_PASSWORD,
  그룹장: process.env.GROUP_LEADER_SIGNUP_PASSWORD,
  목회자: process.env.PASTOR_SIGNUP_PASSWORD,
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const { role, password } = body ?? {};

  if (!role || !password) {
    return Response.json(
      { success: false, message: "역할과 암호를 모두 입력해주세요." },
      { status: 400 }
    );
  }

  // 1. 요청된 역할에 해당하는 서버의 비밀번호를 가져옵니다.
  const correctPassword = PASSWORD_ENV_MAP[role];

  // 2. 서버에 해당 역할의 비밀번호가 설정되어 있는지 확인합니다.
  if (!correctPassword) {
    // eslint-disable-next-line no-console
    console.error(`${role}에 대한 비밀번호가 서버 환경 변수에 설정되지 않았습니다.`);
    return Response.json(
      { success: false, message: "서버 설정 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  // 3. 두 암호를 비교하여 일치하는지 확인합니다.
  if (password === correctPassword) {
    return Response.json(
      { success: true, message: "인증에 성공했습니다." },
      { status: 200 }
    );
  }

  return Response.json(
    { success: false, message: "암호가 올바르지 않습니다." },
    { status: 401 }
  );
}

