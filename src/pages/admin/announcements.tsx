import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import AdminLayout from '@src/components/AdminLayout';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Button, Table, Modal, Form, Input, InputNumber, Switch, message, Popconfirm, Space, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
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

interface AnnouncementItem {
  id: number;
  title: string;
  contents: string;
  is_visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementItem | null>(null);
  const [form] = Form.useForm();
  const router = useRouter();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      if (Array.isArray(data)) {
        setAnnouncements(data);
      } else {
        console.warn('공지사항 데이터가 배열이 아닙니다:', data);
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('공지사항 불러오기 실패:', error);
      message.error('공지사항을 불러오는 데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const showAddModal = () => {
    setEditingAnnouncement(null);
    form.resetFields();
    const maxOrder = announcements.length > 0 ? Math.max(...announcements.map(item => item.display_order)) : 0;
    form.setFieldsValue({
      display_order: maxOrder + 1,
      is_visible: true
    });
    setModalVisible(true);
  };

  const showEditModal = (record: AnnouncementItem) => {
    setEditingAnnouncement(record);
    form.setFieldsValue({
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
      
      if (editingAnnouncement) {
        const { error } = await supabase
          .from('announcements')
          .update({
            ...values,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAnnouncement.id);
        
        if (error) throw error;
        message.success('공지사항이 수정되었습니다');
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert([values]);
        
        if (error) throw error;
        message.success('새 공지사항이 추가되었습니다');
      }
      
      setModalVisible(false);
      fetchAnnouncements();
    } catch (error) {
      console.error('제출 오류:', error);
      message.error('제출 중 오류가 발생했습니다');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      message.success('공지사항이 삭제되었습니다');
      fetchAnnouncements();
    } catch (error) {
      console.error('삭제 오류:', error);
      message.error('삭제 중 오류가 발생했습니다');
    }
  };

  const handleMoveUp = async (record: AnnouncementItem) => {
    const currentIndex = announcements.findIndex(a => a.id === record.id);
    if (currentIndex <= 0) return;
    
    const prevAnnouncement = announcements[currentIndex - 1];
    
    try {
      const response = await fetch('/api/admin/update-announcement-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcement1: {
            id: record.id,
            display_order: prevAnnouncement.display_order
          },
          announcement2: {
            id: prevAnnouncement.id,
            display_order: record.display_order
          }
        }),
      });
      
      if (!response.ok) throw new Error('순서 변경 실패');
      
      message.success('순서가 변경되었습니다');
      fetchAnnouncements();
    } catch (error) {
      console.error('순서 변경 오류:', error);
      message.error('순서 변경 중 오류가 발생했습니다');
    }
  };

  const handleMoveDown = async (record: AnnouncementItem) => {
    const currentIndex = announcements.findIndex(a => a.id === record.id);
    if (currentIndex >= announcements.length - 1) return;
    
    const nextAnnouncement = announcements[currentIndex + 1];
    
    try {
      const response = await fetch('/api/admin/update-announcement-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcement1: {
            id: record.id,
            display_order: nextAnnouncement.display_order
          },
          announcement2: {
            id: nextAnnouncement.id,
            display_order: record.display_order
          }
        }),
      });
      
      if (!response.ok) throw new Error('순서 변경 실패');
      
      message.success('순서가 변경되었습니다');
      fetchAnnouncements();
    } catch (error) {
      console.error('순서 변경 오류:', error);
      message.error('순서 변경 중 오류가 발생했습니다');
    }
  };

  const handleVisibilityChange = async (id: number, value: boolean) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ 
          is_visible: value,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      message.success(`공지사항이 ${value ? '표시' : '숨김'} 처리되었습니다`);
      fetchAnnouncements();
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
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => (
        <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {text}
        </div>
      ),
    },
    {
      title: '내용',
      dataIndex: 'contents',
      key: 'contents',
      render: (text: string) => (
        <div style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {text}
        </div>
      ),
    },
    {
      title: '표시 여부',
      dataIndex: 'is_visible',
      key: 'is_visible',
      render: (visible: boolean, record: AnnouncementItem) => (
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
      render: (_: any, record: AnnouncementItem) => (
        <Space>
          <Button
            icon={<UpOutlined />}
            onClick={() => handleMoveUp(record)}
            size="small"
            disabled={announcements.indexOf(record) === 0}
          />
          <Button
            icon={<DownOutlined />}
            onClick={() => handleMoveDown(record)}
            size="small"
            disabled={announcements.indexOf(record) === announcements.length - 1}
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
            type="primary"
            size="small"
          />
          <Popconfirm
            title="이 공지사항을 삭제하시겠습니까?"
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
        <title>공지사항 관리 | 허브 커뮤니티</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <AdminLayout title="공지사항 관리">
        <Container>
          <Header>
            <Title level={2}>공지사항 관리</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showAddModal}
            >
              공지사항 추가
            </Button>
          </Header>

          <Table
            columns={columns}
            dataSource={announcements}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />

          <Modal
            title={editingAnnouncement ? '공지사항 수정' : '새 공지사항 추가'}
            open={modalVisible}
            onCancel={handleCancel}
            onOk={handleSubmit}
            okText={editingAnnouncement ? '수정' : '추가'}
            cancelText="취소"
            width={800}
          >
            <Form form={form} layout="vertical">
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

export default AnnouncementsPage; 