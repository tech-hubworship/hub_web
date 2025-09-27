// 파일 경로: src/views/AdminPage/style.ts

import styled from "@emotion/styled";

// --- 페이지 전체 레이아웃 ---
export const Wrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 100px 20px 60px 20px;
  gap: 20px;
  background-color: #f8f9fa; // 밝은 회색 배경
  box-sizing: border-box;
`;

// --- 페이지 제목 ---
export const Title = styled.h1`
  font-size: 32px;
  font-weight: 800;
  color: #212529; // 어두운 글자색
  line-height: 1.4;
  text-align: center;
  margin-bottom: 10px;
`;

// --- 부제목 (권한 설명 등) ---
export const Subtitle = styled.p`
  font-size: 16px;
  color: #6c757d; // 회색 글자
  margin-bottom: 30px;
  text-align: center;
`;

// --- 메뉴 버튼들을 감싸는 그리드 ---
export const MenuGrid = styled.div`
  width: 100%;
  max-width: 900px;
  display: grid;
  // 화면 크기에 따라 1개, 2개, 3개의 열로 자동 변경
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin: 0 auto;
`;

// --- 개별 메뉴 버튼 ---
export const MenuButton = styled.button`
    
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 28px;
  font-size: 20rem;
  font-weight: 700;
  color: #343a40;
  border-radius: 12px;
  border: 1px solid #dee2e6;
  cursor: pointer;
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    color: #007bff;
  }

  & > span {
    font-size: 40rem;
  }
`;

// --- 로딩 또는 권한 없음 텍스트 ---
export const InfoText = styled.p`
  font-size: 18px;
  color: #6c757d;
  margin-top: 50px;
`;