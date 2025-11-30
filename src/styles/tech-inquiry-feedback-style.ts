import styled from '@emotion/styled';

export const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  
  @media (max-width: 768px) {
    padding: 20px 16px;
  }
`;

export const Header = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

export const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

export const Subtitle = styled.p`
  font-size: 16px;
  color: #64748b;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

export const Card = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 32px;
  
  @media (max-width: 768px) {
    padding: 24px;
    border-radius: 12px;
  }
`;

export const Section = styled.div`
  margin-bottom: 32px;
  
  &:last-of-type {
    margin-bottom: 0;
  }
`;

export const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

export const ResponseDate = styled.span`
  font-size: 14px;
  font-weight: 400;
  color: #64748b;
  margin-left: 8px;
`;

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
`;

export const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const InfoLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
`;

export const InfoValue = styled.span`
  font-size: 14px;
  color: #1e293b;
`;

export const Badge = styled.span<{ status?: string }>`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  background: ${props => {
    switch (props.status) {
      case 'new': return '#dbeafe';
      case 'in_progress': return '#fef3c7';
      case 'resolved': return '#d1fae5';
      case 'closed': return '#fee2e2';
      default: return '#f1f5f9';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'new': return '#1e40af';
      case 'in_progress': return '#92400e';
      case 'resolved': return '#065f46';
      case 'closed': return '#991b1b';
      default: return '#475569';
    }
  }};
`;

export const MessageBox = styled.div`
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 15px;
  line-height: 1.8;
  color: #1e293b;
  white-space: pre-wrap;
  word-break: break-word;
`;

export const ResponseBox = styled.div`
  padding: 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  border: 2px solid #3b82f6;
  font-size: 15px;
  line-height: 1.8;
  color: #1e293b;
  white-space: pre-wrap;
  word-break: break-word;
`;

export const WaitingBox = styled.div`
  padding: 40px 20px;
  text-align: center;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
`;

export const WaitingIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

export const WaitingText = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
`;

export const WaitingSubtext = styled.div`
  font-size: 14px;
  color: #64748b;
`;

export const InfoText = styled.div`
  margin-top: 12px;
  font-size: 14px;
  color: #64748b;
  
  strong {
    color: #475569;
  }
`;

export const Footer = styled.div`
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
`;

export const BackButton = styled.button`
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
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

export const ErrorState = styled.div`
  padding: 60px 20px;
  text-align: center;
`;

export const ErrorIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
`;

export const ErrorTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
`;

export const ErrorMessage = styled.p`
  font-size: 16px;
  color: #64748b;
  margin: 0 0 24px 0;
`;

export const InquiryList = styled.div`
  margin-bottom: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

export const ListTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px 0;
`;

export const InquiryItem = styled.div<{ active?: boolean }>`
  padding: 16px;
  border: 2px solid ${props => props.active ? '#3b82f6' : '#e2e8f0'};
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.active ? '#f0f9ff' : 'white'};
  
  &:hover {
    border-color: #3b82f6;
    background: #f0f9ff;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

export const InquiryItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`;

export const InquiryItemType = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #5b21b6;
  background: #ede9fe;
  padding: 4px 10px;
  border-radius: 6px;
`;

export const InquiryItemStatus = styled.span<{ status?: string }>`
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 6px;
  background: ${props => {
    switch (props.status) {
      case 'new': return '#dbeafe';
      case 'in_progress': return '#fef3c7';
      case 'resolved': return '#d1fae5';
      case 'closed': return '#fee2e2';
      default: return '#f1f5f9';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'new': return '#1e40af';
      case 'in_progress': return '#92400e';
      case 'resolved': return '#065f46';
      case 'closed': return '#991b1b';
      default: return '#475569';
    }
  }};
`;

export const InquiryItemMessage = styled.div`
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 8px;
`;

export const InquiryItemDate = styled.div`
  font-size: 12px;
  color: #94a3b8;
`;

export const EmptyState = styled.div`
  padding: 60px 20px;
  text-align: center;
`;

export const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
`;

export const EmptyTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
`;

export const EmptyText = styled.p`
  font-size: 16px;
  color: #64748b;
  margin: 0 0 24px 0;
`;

