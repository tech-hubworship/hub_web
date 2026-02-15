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

export const AutoRefreshButton = styled.button<{ active: boolean }>`
  padding: 10px 16px;
  background: ${props => props.active ? '#10b981' : 'white'};
  border: 1px solid ${props => props.active ? '#10b981' : '#e2e8f0'};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.active ? 'white' : '#64748b'};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  height: fit-content;

  &:hover {
    background: ${props => props.active ? '#059669' : '#f1f5f9'};
    border-color: ${props => props.active ? '#059669' : '#cbd5e1'};
    color: ${props => props.active ? 'white' : '#1e293b'};
  }

  @media (max-width: 768px) {
    font-size: 12px;
    padding: 8px 12px;
  }
`;

export const AttendanceButton = styled.button`
  padding: 6px 12px;
  background: #10b981;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

/* 탭 스타일 */
export const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 0 24px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e2e8f0;

  @media (max-width: 768px) {
    padding: 0 16px;
  }
`;

export const TabButton = styled.button<{ active: boolean }>`
  padding: 12px 24px;
  background: ${props => props.active ? '#3b82f6' : 'transparent'};
  color: ${props => props.active ? 'white' : '#64748b'};
  border: none;
  border-bottom: ${props => props.active ? '2px solid #3b82f6' : '2px solid transparent'};
  border-radius: 8px 8px 0 0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: -2px;

  &:hover {
    background: ${props => props.active ? '#2563eb' : '#f1f5f9'};
    color: ${props => props.active ? 'white' : '#1e293b'};
  }

  @media (max-width: 768px) {
    padding: 10px 16px;
    font-size: 13px;
  }
`;

/* 상세보기 버튼 */
export const DetailButton = styled.button`
  padding: 6px 16px;
  background: #3b82f6;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

/* 모달 스타일 */
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

export const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 1200px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 768px) {
    max-width: 100%;
    max-height: 95vh;
  }
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

export const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

export const ModalSubtitle = styled.span`
  font-size: 14px;
  font-weight: 400;
  color: #64748b;
`;

export const ModalCloseButton = styled.button`
  padding: 8px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 20px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f1f5f9;
    color: #1e293b;
  }
`;

export const ModalBody = styled.div`
  padding: 24px;
  overflow-y: auto;
  flex: 1;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

export const DetailTableContainer = styled.div`
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
`;

export const DetailTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;

  @media (max-width: 768px) {
    font-size: 12px;
    min-width: 600px;
  }
`;
