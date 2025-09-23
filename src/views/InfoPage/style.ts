// 파일 경로: src/views/InfoPage/style.ts (최종 수정본)

import styled from "@emotion/styled";

export const Wrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 100px 20px 60px 20px;
  gap: 40px;
  background-color: #000000;
  color: #ffffff;
  box-sizing: border-box; /* 패딩이 높이에 포함되도록 설정 */
`;

export const Title = styled.h1`
  font-size: 32px;
  font-weight: 800;
  color: #ED2725;
  line-height: 1.4;
  text-align: center;
`;

export const Card = styled.div`
  background: #ffffff;
  width: 100%;
  max-width: 500px;
  padding: 40px 32px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const ProfileImage = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-bottom: 24px;
  object-fit: cover; /* 이미지가 잘리지 않도록 object-fit 추가 */
`;

export const InfoWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
`;

export const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
`;

export const Label = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

export const Value = styled.span`
  font-size: 16px;
  color: #555;
`;

export const LogoutButton = styled.button`
  width: 100%;
  padding: 14px 0;
  background-color: #ED2725;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: auto; /* 버튼이 항상 카드 하단에 위치하도록 수정 (선택사항) */

  &:hover {
    background-color: #D62321;
  }
`;

export const ErrorMessage = styled.p`
  color: #e74c3c;
  font-size: 16px;
  text-align: center;
`;

export const LoadingText = styled.p`
  color: #fff;
  font-size: 16px;
  text-align: center;
`;

export const NoDataText = styled.p`
  color: #fff;
  font-size: 16px;
  text-align: center;
`;