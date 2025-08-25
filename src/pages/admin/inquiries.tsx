import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import AdminLayout from '@src/components/AdminLayout';
import { supabase } from '@src/lib/supabase';
import Head from 'next/head';

interface InquiryItem {
  id: number;
  message: string;
  created_at: string;
  status: string;
  reply?: string;
  reply_at?: string;
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);
  
  // 문의사항 목록 불러오기
  const loadInquiries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInquiries(data || []);
    } catch (error) {
      console.error('문의사항 목록 로드 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadInquiries();
  }, []);
  
  // 문의사항 상세 정보 열기
  const handleViewInquiry = (inquiry: InquiryItem) => {
    setSelectedInquiry(inquiry);
    setReplyText(inquiry.reply || '');
    
    // 읽음 상태로 업데이트
    if (inquiry.status === 'unread') {
      updateInquiryStatus(inquiry.id, 'read');
    }
  };
  
  // 문의사항 상태 업데이트
  const updateInquiryStatus = async (id: number, status: string) => {
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      // 상태 업데이트 후 목록 새로고침
      setInquiries(prevInquiries => 
        prevInquiries.map(item => 
          item.id === id ? { ...item, status } : item
        )
      );
    } catch (error) {
      console.error('문의사항 상태 업데이트 중 오류:', error);
    }
  };
  
  // 문의사항 답변 저장
  const handleSaveReply = async () => {
    if (!selectedInquiry) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({
          reply: replyText,
          reply_at: new Date().toISOString(),
          status: 'answered'
        })
        .eq('id', selectedInquiry.id);
      
      if (error) throw error;
      
      // 답변 후 목록 새로고침
      await loadInquiries();
      setSelectedInquiry(prev => 
        prev ? { ...prev, reply: replyText, status: 'answered', reply_at: new Date().toISOString() } : null
      );
    } catch (error) {
      console.error('답변 저장 중 오류:', error);
      alert('답변 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };
  
  // 상태에 따른 색상 지정
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread':
        return '#f59e0b'; // 황색
      case 'read':
        return '#6b7280'; // 회색
      case 'answered':
        return '#10b981'; // 녹색
      default:
        return '#6b7280'; // 회색
    }
  };
  
  // 상태 텍스트 변환
  const getStatusText = (status: string) => {
    switch (status) {
      case 'unread':
        return '읽지 않음';
      case 'read':
        return '읽음';
      case 'answered':
        return '답변 완료';
      default:
        return status;
    }
  };
  
  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };
  
  return (
    <>
      <Head>
        <title>문의사항 관리 | 허브 커뮤니티</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <AdminLayout title="문의사항 관리">
        <Container>
          <InquiryListSection>
            <SectionTitle>
              문의사항 목록
              <RefreshButton onClick={loadInquiries}>새로고침</RefreshButton>
            </SectionTitle>
            
            {loading ? (
              <LoadingMessage>문의사항을 불러오는 중...</LoadingMessage>
            ) : inquiries.length === 0 ? (
              <NoInquiriesMessage>문의사항이 없습니다.</NoInquiriesMessage>
            ) : (
              <InquiryList>
                {inquiries.map((inquiry) => (
                  <InquiryItem
                    key={inquiry.id}
                    isSelected={selectedInquiry?.id === inquiry.id}
                    onClick={() => handleViewInquiry(inquiry)}
                  >
                    <InquiryItemHeader>
                      <InquiryDate>{formatDate(inquiry.created_at)}</InquiryDate>
                      <StatusBadge color={getStatusColor(inquiry.status)}>
                        {getStatusText(inquiry.status)}
                      </StatusBadge>
                    </InquiryItemHeader>
                    <InquiryPreview>
                      {inquiry.message.length > 100
                        ? `${inquiry.message.substring(0, 100)}...`
                        : inquiry.message}
                    </InquiryPreview>
                  </InquiryItem>
                ))}
              </InquiryList>
            )}
          </InquiryListSection>
          
          <InquiryDetailSection>
            {selectedInquiry ? (
              <>
                <SectionTitle>문의사항 상세</SectionTitle>
                <DetailCard>
                  <DetailHeader>
                    <DetailDate>{formatDate(selectedInquiry.created_at)}</DetailDate>
                    <StatusBadge color={getStatusColor(selectedInquiry.status)}>
                      {getStatusText(selectedInquiry.status)}
                    </StatusBadge>
                  </DetailHeader>
                  
                  <DetailContent>
                    {selectedInquiry.message}
                  </DetailContent>
                  
                  <ReplySection>
                    <ReplyTitle>답변</ReplyTitle>
                    <ReplyTextArea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="문의에 대한 답변을 입력하세요..."
                      disabled={saving}
                    />
                    
                    <ButtonContainer>
                      <SaveButton 
                        onClick={handleSaveReply}
                        disabled={saving || !replyText.trim()}
                      >
                        {saving ? '저장 중...' : '답변 저장'}
                      </SaveButton>
                    </ButtonContainer>
                    
                    {selectedInquiry.reply_at && (
                      <ReplyInfo>
                        최종 답변일: {formatDate(selectedInquiry.reply_at)}
                      </ReplyInfo>
                    )}
                  </ReplySection>
                </DetailCard>
              </>
            ) : (
              <NoSelectionMessage>
                왼쪽 목록에서 문의사항을 선택해주세요.
              </NoSelectionMessage>
            )}
          </InquiryDetailSection>
        </Container>
      </AdminLayout>
    </>
  );
}

// 스타일 컴포넌트
const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #1f2937;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const InquiryListSection = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
`;

const InquiryDetailSection = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 32px;
  color: #6b7280;
  font-weight: 500;
`;

const NoInquiriesMessage = styled.div`
  text-align: center;
  padding: 32px;
  color: #6b7280;
  font-weight: 500;
`;

const NoSelectionMessage = styled.div`
  text-align: center;
  padding: 32px;
  color: #6b7280;
  font-weight: 500;
  margin: auto 0;
`;

const InquiryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
`;

const InquiryItem = styled.div<{ isSelected: boolean }>`
  padding: 16px;
  border-radius: 8px;
  background-color: ${props => props.isSelected ? '#f3f4f6' : 'white'};
  border: 1px solid ${props => props.isSelected ? '#d1d5db' : '#e5e7eb'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
  }
`;

const InquiryItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const InquiryDate = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

const InquiryPreview = styled.div`
  font-size: 14px;
  color: #374151;
  white-space: pre-line;
  line-height: 1.5;
`;

const StatusBadge = styled.span<{ color: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: ${props => props.color};
  color: white;
  font-size: 12px;
  font-weight: 500;
`;

const DetailCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-grow: 1;
`;

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DetailDate = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const DetailContent = styled.div`
  font-size: 16px;
  line-height: 1.6;
  color: #1f2937;
  white-space: pre-line;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 16px;
`;

const ReplySection = styled.div`
  margin-top: 8px;
`;

const ReplyTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #1f2937;
`;

const ReplyTextArea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
  }
  
  &:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
`;

const SaveButton = styled.button`
  padding: 8px 16px;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background-color: #059669;
  }
  
  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const RefreshButton = styled.button`
  padding: 4px 8px;
  background-color: #f3f4f6;
  color: #4b5563;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background-color: #e5e7eb;
  }
`;

const ReplyInfo = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 8px;
  text-align: right;
`; 