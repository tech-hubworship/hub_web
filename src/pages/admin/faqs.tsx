import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import AdminLayout from '@src/components/AdminLayout';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Button, Table, Modal, Form, Input, InputNumber, Switch, message, Popconfirm, Space, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import { FaqItem, getAllFaqs } from '@src/lib/api/faq';
import { createClient } from '@supabase/supabase-js';

const { Title } = Typography;

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// FAQ 태그 옵션
const TAG_OPTIONS = ['일반', '배송', '주문', '결제', '교환/환불', '기타'];

const FAQsPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [form] = Form.useForm();
  const [tags, setTags] = useState<string[]>(TAG_OPTIONS);
  const router = useRouter();

  useEffect(() => {
    fetchFaqs();
    fetchTags();
  }, []);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      // 모든 FAQ 가져오기
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      // 데이터가 배열인지 확인
      if (Array.isArray(data)) {
        setFaqs(data);
      } else {
        // 배열이 아니면 빈 배열 설정
        console.warn('FAQ 데이터가 배열이 아닙니다:', data);
        setFaqs([]);
      }
    } catch (error) {
      console.error('FAQ 불러오기 실패:', error);
      message.error('FAQ를 불러오는 데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      // 모든 고유한 태그 가져오기
      const { data, error } = await supabase
        .from('faqs')
        .select('tag');
      
      if (error) {
        throw error;
      }
      
      if (Array.isArray(data)) {
        // 고유한 태그 목록 생성
        const uniqueTags = Array.from(new Set(data.map(item => item.tag).filter(Boolean)));
        setTags(uniqueTags.length > 0 ? uniqueTags : TAG_OPTIONS);
      }
    } catch (error) {
      console.error('태그 불러오기 실패:', error);
      message.error('태그를 불러오는 데 실패했습니다');
      // API 호출 실패시 기본 태그 옵션 사용
      setTags(TAG_OPTIONS);
    }
  };

  const showAddModal = () => {
    setEditingFaq(null);
    form.resetFields();
    // 기본값 설정
    const maxOrder = faqs.length > 0 ? Math.max(...faqs.map(faq => faq.display_order)) : 0;
    form.setFieldsValue({
      display_order: maxOrder + 1,
      is_visible: true
    });
    setModalVisible(true);
  };

  const showEditModal = (record: FaqItem) => {
    setEditingFaq(record);
    form.setFieldsValue({
      tag: record.tag,
      title: record.title,
      contents: record.contents,
      display_order: record.display_order,
      is_visible: record.is_visible
    });
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingFaq) {
        // FAQ 수정 - API 엔드포인트 대신 Supabase 직접 호출
        const { error } = await supabase
          .from('faqs')
          .update(values)
          .eq('id', editingFaq.id);
        
        if (error) {
          console.error('FAQ 수정 오류:', error);
          throw new Error('FAQ 수정 실패');
        }
        
        message.success('FAQ가 수정되었습니다');
      } else {
        // 새 FAQ 추가 - API 엔드포인트 대신 Supabase 직접 호출
        const { error } = await supabase
          .from('faqs')
          .insert([values]);
        
        if (error) {
          console.error('FAQ 추가 오류:', error);
          throw new Error('FAQ 추가 실패');
        }
        
        message.success('새 FAQ가 추가되었습니다');
      }
      
      setModalVisible(false);
      fetchFaqs();
    } catch (error) {
      console.error('제출 오류:', error);
      message.error('제출 중 오류가 발생했습니다');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      // FAQ 삭제 - API 엔드포인트 대신 Supabase 직접 호출
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('FAQ 삭제 오류:', error);
        throw new Error('FAQ 삭제 실패');
      }
      
      message.success('FAQ가 삭제되었습니다');
      fetchFaqs();
    } catch (error) {
      console.error('삭제 오류:', error);
      message.error('삭제 중 오류가 발생했습니다');
    }
  };

  const handleMoveUp = async (record: FaqItem) => {
    const currentIndex = faqs.findIndex(f => f.id === record.id);
    if (currentIndex <= 0) return;
    
    const prevFaq = faqs[currentIndex - 1];
    
    try {
      console.log('순서 변경 시도:', {
        current: record.id,
        new_order: prevFaq.display_order,
        prev: prevFaq.id,
        new_order_prev: record.display_order
      });
      
      // API 엔드포인트를 통해 순서 변경 (서버 측에서 서비스 역할 키 사용)
      const response = await fetch('/api/admin/update-faq-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faq1: {
            id: record.id,
            display_order: prevFaq.display_order
          },
          faq2: {
            id: prevFaq.id,
            display_order: record.display_order
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('순서 변경 오류:', errorData);
        throw new Error('순서 변경 실패');
      }
      
      message.success('순서가 변경되었습니다');
      fetchFaqs();
    } catch (error) {
      console.error('순서 변경 오류:', error);
      message.error('순서 변경 중 오류가 발생했습니다');
    }
  };

  const handleMoveDown = async (record: FaqItem) => {
    const currentIndex = faqs.findIndex(f => f.id === record.id);
    if (currentIndex >= faqs.length - 1) return;
    
    const nextFaq = faqs[currentIndex + 1];
    
    try {
      console.log('순서 변경 시도:', {
        current: record.id,
        new_order: nextFaq.display_order,
        next: nextFaq.id,
        new_order_next: record.display_order
      });
      
      // API 엔드포인트를 통해 순서 변경 (서버 측에서 서비스 역할 키 사용)
      const response = await fetch('/api/admin/update-faq-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faq1: {
            id: record.id,
            display_order: nextFaq.display_order
          },
          faq2: {
            id: nextFaq.id,
            display_order: record.display_order
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('순서 변경 오류:', errorData);
        throw new Error('순서 변경 실패');
      }
      
      message.success('순서가 변경되었습니다');
      fetchFaqs();
    } catch (error) {
      console.error('순서 변경 오류:', error);
      message.error('순서 변경 중 오류가 발생했습니다');
    }
  };

  const handleVisibilityChange = async (id: number, value: boolean) => {
    try {
      // 표시 여부 변경 - API 엔드포인트 대신 Supabase 직접 호출
      const { error } = await supabase
        .from('faqs')
        .update({ is_visible: value })
        .eq('id', id);
      
      if (error) {
        console.error('표시 상태 변경 오류:', error);
        throw new Error('표시 상태 변경 실패');
      }
      
      message.success(`FAQ가 ${value ? '표시' : '숨김'} 처리되었습니다`);
      fetchFaqs();
    } catch (error) {
      console.error('표시 상태 변경 오류:', error);
      message.error('표시 상태 변경 중 오류가 발생했습니다');
    }
  };

  const columns = [
    {
      title: '순서',
      dataIndex: 'display_order',
      key: 'display_order',
      width: 80,
    },
    {
      title: '태그',
      dataIndex: 'tag',
      key: 'tag',
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</div>,
    },
    {
      title: '내용',
      dataIndex: 'contents',
      key: 'contents',
      render: (text: string) => <div style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</div>,
    },
    {
      title: '표시 여부',
      dataIndex: 'is_visible',
      key: 'is_visible',
      render: (visible: boolean, record: FaqItem) => (
        <Switch
          checked={visible}
          onChange={(checked: boolean) => handleVisibilityChange(record.id, checked)}
        />
      ),
    },
    {
      title: '생성일',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => text ? new Date(text).toLocaleString('ko-KR') : '',
    },
    {
      title: '관리',
      key: 'action',
      render: (_: any, record: FaqItem) => (
        <Space>
          <Button
            icon={<UpOutlined />}
            onClick={() => handleMoveUp(record)}
            size="small"
            disabled={faqs.indexOf(record) === 0}
          />
          <Button
            icon={<DownOutlined />}
            onClick={() => handleMoveDown(record)}
            size="small"
            disabled={faqs.indexOf(record) === faqs.length - 1}
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
            type="primary"
            size="small"
          />
          <Popconfirm
            title="이 FAQ를 삭제하시겠습니까?"
            onConfirm={() => handleDelete(record.id)}
            okText="예"
            cancelText="아니오"
          >
            <Button
              icon={<DeleteOutlined />}
              danger
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>FAQ 관리 | 허브 커뮤니티</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <AdminLayout title="FAQ 관리">
        <Container>
          <Header>
            <Title level={2}>FAQ 관리</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showAddModal}
            >
              FAQ 추가
            </Button>
          </Header>

          <Table
            columns={columns}
            dataSource={faqs}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />

          <Modal
            title={editingFaq ? 'FAQ 수정' : '새 FAQ 추가'}
            open={modalVisible}
            onCancel={handleCancel}
            onOk={handleSubmit}
            okText={editingFaq ? '수정' : '추가'}
            cancelText="취소"
            width={800}
          >
            <Form form={form} layout="vertical">
              <Form.Item
                name="tag"
                label="태그"
                rules={[{ required: true, message: '태그를 입력해주세요' }]}
              >
                <Input placeholder="태그 입력 (예: 일반, 배송, 주문, 결제, 교환/환불, 기타)" />
              </Form.Item>
              <Form.Item
                name="title"
                label="제목"
                rules={[{ required: true, message: '제목을 입력해주세요' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="contents"
                label="내용"
                rules={[{ required: true, message: '내용을 입력해주세요' }]}
              >
                <Input.TextArea rows={6} />
              </Form.Item>
              <Form.Item
                name="display_order"
                label="표시 순서"
                rules={[{ required: true, message: '표시 순서를 입력해주세요' }]}
              >
                <InputNumber min={1} />
              </Form.Item>
              <Form.Item
                name="is_visible"
                label="표시 여부"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Form>
          </Modal>
        </Container>
      </AdminLayout>
    </>
  );
};

const Container = styled.div`
  padding: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

export default FAQsPage; 