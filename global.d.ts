// googleapis 모듈 선언
declare module 'googleapis' {
  export const google: any;
}

// 사용자 객체 타입 선언
interface User {
  [key: string]: any;
  phone_number: string;
} 