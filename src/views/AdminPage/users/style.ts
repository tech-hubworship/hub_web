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

export const SearchBar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex: 1;
  max-width: 500px;

  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
  }
`;

export const SearchInput = styled.input`
  flex: 1;
  min-width: 300px;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  @media (max-width: 768px) {
    min-width: 100%;
  }
`;

// 통계 그리드
export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
  padding: 0 24px;
  
  @media (max-width: 768px) {
    padding: 0 16px;
    grid-template-columns: 1fr;
  }
`;

export const StatCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

export const StatIcon = styled.div`
  font-size: 40px;
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const StatContent = styled.div`
  display: flex;
  flex-direction: column;
`;

export const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
`;

export const StatLabel = styled.div`
  font-size: 14px;
  color: #64748b;
`;

export const Tabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e2e8f0;
  padding: 0 24px;
  
  @media (max-width: 768px) {
    padding: 0 16px;
  }
`;

export const Tab = styled.button<{ active: boolean }>`
  padding: 14px 28px;
  background: ${props => props.active ? '#f8fafc' : 'transparent'};
  border: none;
  border-bottom: 3px solid ${props => props.active ? '#3b82f6' : 'transparent'};
  color: ${props => props.active ? '#3b82f6' : '#64748b'};
  font-size: 15px;
  font-weight: ${props => props.active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: -2px;

  &:hover {
    color: #3b82f6;
    background: #f8fafc;
  }
  
  @media (max-width: 768px) {
    padding: 12px 20px;
    font-size: 14px;
  }
`;

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
  transition: all 0.2s ease;

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
  letter-spacing: 0.05em;

  @media (max-width: 768px) {
    padding: 12px 8px;
    font-size: 11px;
  }
`;

export const TableData = styled.td`
  padding: 16px;
  color: #1e293b;
  font-size: 14px;

  @media (max-width: 768px) {
    padding: 12px 8px;
    font-size: 13px;
  }
`;

export const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
`;

export const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

export const UserName = styled.div`
  font-weight: 600;
  color: #1e293b;
`;

export const UserEmail = styled.div`
  font-size: 13px;
  color: #64748b;

  @media (max-width: 768px) {
    display: none;
  }
`;

export const Badge = styled.span<{ color?: string }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch (props.color) {
      case 'blue': return '#dbeafe';
      case 'green': return '#d1fae5';
      case 'red': return '#fee2e2';
      case 'yellow': return '#fef3c7';
      default: return '#f1f5f9';
    }
  }};
  color: ${props => {
    switch (props.color) {
      case 'blue': return '#1e40af';
      case 'green': return '#065f46';
      case 'red': return '#991b1b';
      case 'yellow': return '#92400e';
      default: return '#475569';
    }
  }};
`;

export const ActionButton = styled.button`
  padding: 8px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e2e8f0;
    color: #1e293b;
    border-color: #cbd5e1;
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 12px;
  }
`;

export const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
`;

export const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 24px;
    max-height: 85vh;
  }
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

export const ModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #64748b;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
    color: #1e293b;
  }
`;

export const FormGroup = styled.div`
  margin-bottom: 20px;
`;

export const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
`;

export const Input = styled.input`
  width: 100%;
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

  &:disabled {
    background: #f8fafc;
    color: #94a3b8;
    cursor: not-allowed;
  }
`;

export const Select = styled.select`
  width: 100%;
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

export const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

export const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e2e8f0;
    border-color: #cbd5e1;
  }

  input {
    cursor: pointer;
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

export const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; }
        `;
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          &:hover { background: #dc2626; }
        `;
      default:
        return `
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
          &:hover { background: #e2e8f0; color: #1e293b; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }
`;

export const EmptyState = styled.div`
  padding: 60px 20px;
  text-align: center;
  color: #64748b;
`;

export const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

export const EmptyText = styled.p`
  font-size: 16px;
  margin: 0;
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
  margin: 0 auto 16px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 24px;
  border-top: 1px solid #e2e8f0;
`;

export const PageButton = styled.button<{ active?: boolean }>`
  padding: 8px 12px;
  background: ${props => props.active ? '#3b82f6' : 'white'};
  color: ${props => props.active ? 'white' : '#64748b'};
  border: 1px solid ${props => props.active ? '#3b82f6' : '#e2e8f0'};
  border-radius: 6px;
  font-size: 14px;
  font-weight: ${props => props.active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.active ? '#2563eb' : '#f8fafc'};
    border-color: ${props => props.active ? '#2563eb' : '#cbd5e1'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

