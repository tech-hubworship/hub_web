import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import * as S from '@src/views/AdminPage/style';
import { Plus, Edit, Trash2, Eye, EyeOff, Sparkles } from 'lucide-react';

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Button = styled.button<{ variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: #10b981;
          color: white;
          &:hover {
            background: #059669;
          }
        `;
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          &:hover {
            background: #dc2626;
          }
        `;
      case 'secondary':
        return `
          background: #f3f4f6;
          color: #374151;
          &:hover {
            background: #e5e7eb;
          }
        `;
      default:
        return `
          background: #3b82f6;
          color: white;
          &:hover {
            background: #2563eb;
          }
        `;
    }
  }}
`;

const QuestionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
`;

const QuestionCard = styled.div<{ isActive: boolean }>`
  background: white;
  border: 2px solid ${props => props.isActive ? '#10b981' : '#e5e7eb'};
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const QuestionText = styled.div`
  font-size: 16px;
  color: #1f2937;
  margin-bottom: 12px;
  line-height: 1.6;
`;

const QuestionMeta = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
`;

const Badge = styled.span<{ type?: string }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;

  ${props => {
    switch (props.type) {
      case 'category':
        return `
          background: #dbeafe;
          color: #1e40af;
        `;
      case 'difficulty':
        return `
          background: #fef3c7;
          color: #92400e;
        `;
      case 'status':
        return `
          background: ${props.children === '활성' ? '#d1fae5' : '#f3f4f6'};
          color: ${props.children === '활성' ? '#065f46' : '#6b7280'};
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
        `;
    }
  }}
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button<{ variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: 8px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: #dbeafe;
          color: #1e40af;
          &:hover {
            background: #bfdbfe;
          }
        `;
      case 'danger':
        return `
          background: #fee2e2;
          color: #dc2626;
          &:hover {
            background: #fecaca;
          }
        `;
      case 'secondary':
        return `
          background: #f3f4f6;
          color: #6b7280;
          &:hover {
            background: #e5e7eb;
          }
        `;
      default:
        return `
          background: #f3f4f6;
          color: #6b7280;
          &:hover {
            background: #e5e7eb;
          }
        `;
    }
  }}
`;

const ModalOverlay = styled.div`
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
`;

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #10b981;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  min-height: 120px;
  resize: vertical;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #10b981;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #10b981;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

interface Question {
  id: number;
  question: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

const IceBreakingAdminPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    is_active: true,
    order_index: 0
  });

  // 권한 체크
  useEffect(() => {
    if (status === 'authenticated' && !session?.user?.isAdmin) {
      alert('관리자만 접근할 수 있는 페이지입니다.');
      router.push('/');
    }
  }, [status, session, router]);

  // 질문 목록 가져오기
  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/admin/ice-breaking/questions');
      const data = await response.json();
      if (response.ok) {
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('질문 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.isAdmin) {
      fetchQuestions();
    }
  }, [status, session]);

  // 질문 추가/수정
  const handleSave = async () => {
    try {
      const url = editingQuestion 
        ? `/api/admin/ice-breaking/questions/${editingQuestion.id}`
        : '/api/admin/ice-breaking/questions';
      
      const method = editingQuestion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingQuestion(null);
        setFormData({
          question: '',
          is_active: true,
          order_index: 0
        });
        fetchQuestions();
      }
    } catch (error) {
      console.error('질문 저장 오류:', error);
      alert('질문 저장에 실패했습니다.');
    }
  };

  // 질문 삭제
  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/ice-breaking/questions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchQuestions();
      }
    } catch (error) {
      console.error('질문 삭제 오류:', error);
      alert('질문 삭제에 실패했습니다.');
    }
  };

  // 상태 토글
  const handleToggleStatus = async (question: Question) => {
    try {
      const response = await fetch(`/api/admin/ice-breaking/questions/${question.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...question,
          is_active: !question.is_active
        }),
      });

      if (response.ok) {
        fetchQuestions();
      }
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  // 수정 모달 열기
  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      question: question.question,
      is_active: question.is_active,
      order_index: question.order_index
    });
    setShowModal(true);
  };

  // 새 질문 추가 모달 열기
  const handleAdd = () => {
    setEditingQuestion(null);
    setFormData({
      question: '',
      is_active: true,
      order_index: 0
    });
    setShowModal(true);
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated' || !session?.user?.isAdmin) {
    return null;
  }

  return (
    <Container>
      <Header>
        <Title>
          <Sparkles size={32} />
          아이스브레이킹 질문 관리
        </Title>
        <Button variant="primary" onClick={handleAdd}>
          <Plus size={20} />
          질문 추가
        </Button>
      </Header>

      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <QuestionsGrid>
          {questions.map((question) => (
            <QuestionCard key={question.id} isActive={question.is_active}>
              <QuestionText>{question.question}</QuestionText>
              <QuestionMeta>
                <Badge type="status">{question.is_active ? '활성' : '비활성'}</Badge>
              </QuestionMeta>
              <Actions>
                <IconButton onClick={() => handleEdit(question)}>
                  <Edit size={16} />
                </IconButton>
                <IconButton variant="secondary" onClick={() => handleToggleStatus(question)}>
                  {question.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                </IconButton>
                <IconButton variant="danger" onClick={() => handleDelete(question.id)}>
                  <Trash2 size={16} />
                </IconButton>
              </Actions>
            </QuestionCard>
          ))}
        </QuestionsGrid>
      )}

      {showModal && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{editingQuestion ? '질문 수정' : '질문 추가'}</ModalTitle>
              <IconButton onClick={() => setShowModal(false)}>✕</IconButton>
            </ModalHeader>
            
            <FormGroup>
              <Label>질문 내용</Label>
              <TextArea
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="질문을 입력하세요"
              />
            </FormGroup>

            <FormGroup>
              <Label>순서</Label>
              <Input
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
              />
            </FormGroup>

            <ModalActions>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                취소
              </Button>
              <Button variant="primary" onClick={handleSave}>
                저장
              </Button>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default IceBreakingAdminPage;

