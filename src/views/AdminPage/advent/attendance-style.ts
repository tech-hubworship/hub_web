import styled from '@emotion/styled';

export const Container = styled.div`
  padding: 0;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 24px;
  flex-wrap: wrap;
  padding: 0 24px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 0 16px;
  }
`;

export const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const Title = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

export const Subtitle = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 0;
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  padding-bottom: 0 20px
`;

export const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
`;

export const Input = styled.input`
  width: 200px;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

/* 통계 카드 */
export const WelcomeCard = styled.div`
  background: #ffffff;
  padding: 24px;
  margin: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);

  @media (max-width: 768px) {
    margin: 0 16px 24px;
  }
`;

export const WelcomeTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 6px;
  color: #1e293b;
`;

export const WelcomeSubtitle = styled.p`
  font-size: 14px;
  color: #64748b;
`;

/* 테이블 */
export const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin: 0 24px;

  @media (max-width: 768px) {
    margin: 0 16px;
    border-radius: 8px;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

export const TableHeader = styled.thead`
  background: #f8fafc;
`;

export const TableRow = styled.tr`
  border-bottom: 1px solid #e2e8f0;

  &:hover {
    background: #f8fafc;
  }

  &:last-child {
    border-bottom: none;
  }
`;

export const TableHead = styled.th`
  padding: 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;

  @media (max-width: 768px) {
    padding: 12px 8px;
    font-size: 11px;
  }
`;

export const TableData = styled.td`
  padding: 16px;
  font-size: 14px;
  color: #1e293b;

  @media (max-width: 768px) {
    padding: 12px 8px;
    font-size: 13px;
  }
`;

export const Badge = styled.span<{ color?: string }>`
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 12px;
  font-weight: 600;

  background: ${({ color }) => {
    switch (color) {
      case 'green': return '#d1fae5';
      case 'red': return '#fee2e2';
      default: return '#f1f5f9';
    }
  }};
  
  color: ${({ color }) => {
    switch (color) {
      case 'green': return '#047857';
      case 'red': return '#b91c1c';
      default: return '#475569';
    }
  }};
`;

/* 로딩/빈 상태 */
export const EmptyState = styled.div`
  padding: 40px;
  text-align: center;
  color: #64748b;
`;

export const EmptyText = styled.p`
  margin-top: 12px;
  font-size: 15px;
`;

export const LoadingState = styled.div`
  padding: 60px 20px;
  text-align: center;
`;

export const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const Select = styled.select`
  width: 200px;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

// 필터 전체를 가로로 묶을 Row
export const FilterRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 20px;
  padding: 0 24px;
  flex-wrap: wrap; /* 가로 공간 부족하면 자동 줄바꿈 */

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 0 16px;
  }
`;

export const SearchButton = styled.button`
  padding: 10px 20px;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  height: fit-content;
  white-space: nowrap;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;
