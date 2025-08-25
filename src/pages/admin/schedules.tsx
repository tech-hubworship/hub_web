import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, message, Space, Typography, Radio, DatePicker } from 'antd';
import { CloseOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import styled from '@emotion/styled';
import AdminLayout from '@src/components/AdminLayout';
import Head from 'next/head';
import axios from 'axios';
import { useRouter } from 'next/router';
import moment from 'moment';

// 스케줄 인터페이스 정의
interface Schedule {
  id: number;
  title: string;
  end_time: string;
  day: string;
  mainvisible: number;
  created_at: string;
}

const { Title } = Typography;
const { Option } = Select;

const AdminSchedulesPage: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const router = useRouter();

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/schedules');
      setSchedules(response.data);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      message.error('스케줄 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const showModal = (record?: Schedule) => {
    if (record) {
      setEditingId(record.id);
      
      // 날짜 형식으로 변환 (day 필드가 MM.DD 형식이라고 가정)
      let deadlineDate;
      try {
        // 기존 날짜 형식에서 moment 객체로 변환 시도
        const [month, day] = record.day.split('.').map(num => parseInt(num));
        // 현재 날짜의 년도를 가져오되, 선택된 월이 현재 월보다 작으면 내년으로 설정
        const now = new Date();
        let year = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // JavaScript의 월은 0부터 시작하므로 +1
        
        // 선택된 월이 현재 월보다 작으면 내년으로 설정
        if (month < currentMonth) {
          year += 1;
        }
        
        deadlineDate = moment(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`, 'YYYY-MM-DD');
        
        // 유효한 날짜인지 확인
        if (!deadlineDate.isValid()) {
          throw new Error('유효하지 않은 날짜');
        }
      } catch (error) {
        console.error('날짜 변환 오류', error);
        deadlineDate = moment(); // 오류 발생 시 현재 날짜로 설정
      }
      
      form.setFieldsValue({
        title: record.title,
        deadline: deadlineDate,
        mainvisible: record.mainvisible,
      });
    } else {
      setEditingId(null);
      form.resetFields();
      // 추가 시 기본값 설정
      form.setFieldsValue({
        mainvisible: 0, // 해당없음을 기본값으로 설정
      });
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 선택된 마감 날짜에서 포맷 변환
      const deadline = values.deadline;
      const formattedDeadline = deadline.format('MM.DD');
      
      // 종료 시간 계산 (마감 날짜 + 1일의 00:00:00)
      const nextDay = deadline.clone().add(1, 'days');
      const formattedEndTime = nextDay.format('YYYYMMDD');
      
      // 폼 값 재구성
      const submitValues = {
        title: values.title,
        day: formattedDeadline,  // DB에는 MM.DD 형식으로 저장
        end_time: formattedEndTime,  // DB에는 YYYYMMDD 형식으로 저장
        mainvisible: values.mainvisible
      };
      
      if (editingId) {
        // 수정 요청
        await axios.put(`/api/admin/schedules/${editingId}`, submitValues);
        message.success('스케줄이 성공적으로 수정되었습니다.');
        fetchSchedules();
      } else {
        // 추가 요청
        await axios.post('/api/admin/schedules', submitValues);
        message.success('스케줄이 성공적으로 추가되었습니다.');
        fetchSchedules();
      }
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말로 이 스케줄을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/admin/schedules/${id}`);
      message.success('스케줄이 삭제되었습니다');
      fetchSchedules();
    } catch (error) {
      console.error('스케줄 삭제 중 오류:', error);
      message.error('스케줄 삭제 중 오류가 발생했습니다');
    }
  };

  const handleMainVisibleChange = async (id: number, value: number) => {
    try {
      await axios.patch(`/api/admin/schedules/${id}/mainvisible`, { mainvisible: value });
      message.success('메인 노출 설정이 변경되었습니다.');
      fetchSchedules();
    } catch (error) {
      console.error('Failed to update mainvisible:', error);
      message.error('메인 노출 설정 변경에 실패했습니다.');
    }
  };

  // 날짜 표시 포맷 변환 함수
  const formatDisplayDate = (dateStr: string) => {
    try {
      // MM.DD 형식으로 가정
      return `${dateStr} 23:59:59`;
    } catch (error) {
      return dateStr;
    }
  };

  // 종료 시간 표시 포맷 변환 함수
  const formatDisplayEndTime = (endTimeStr: string) => {
    try {
      // YYYYMMDD 형식으로 가정
      return `${endTimeStr} 00 00 00`;
    } catch (error) {
      return endTimeStr;
    }
  };

  // 메인 노출 표시 함수
  const renderMainVisible = (value: number) => {
    switch (value) {
      case 0:
        return '해당없음';
      case 1:
        return '1';
      case 2:
        return '2';
      case 3:
        return '3';
      default:
        return value.toString();
    }
  };

  const columns: ColumnsType<Schedule> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '종료 시간',
      dataIndex: 'end_time',
      key: 'end_time',
      render: (text: string) => formatDisplayEndTime(text),
    },
    {
      title: '마감 날짜',
      dataIndex: 'day',
      key: 'day',
      render: (text: string) => formatDisplayDate(text),
    },
    {
      title: '메인 노출',
      dataIndex: 'mainvisible',
      key: 'mainvisible',
      render: (mainvisible: number, record: Schedule) => (
        <Radio.Group
          value={mainvisible}
          onChange={(e) => handleMainVisibleChange(record.id, e.target.value)}
        >
          <Radio value={0}>해당없음</Radio>
          <Radio value={1}>1</Radio>
          <Radio value={2}>2</Radio>
          <Radio value={3}>3</Radio>
        </Radio.Group>
      ),
    },
    {
      title: '생성일',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleDateString(),
    },
    {
      title: '작업',
      key: 'action',
      width: 150,
      render: (_: any, record: Schedule) => (
        <Space size="middle">
          <ActionButton onClick={() => showModal(record)}>
            <EditOutlined /> 수정
          </ActionButton>
          <ActionButton danger onClick={() => handleDelete(record.id)}>
            <CloseOutlined /> 삭제
          </ActionButton>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>스케줄 관리 | 허브 커뮤니티</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <AdminLayout title="스케줄 관리">
        <Container>
          <Header>
            <Title level={2}>스케줄 관리</Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
              스케줄 추가
            </Button>
          </Header>

          <Table
            columns={columns}
            dataSource={schedules}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />

          <Modal
            title={editingId ? '스케줄 수정' : '스케줄 추가'}
            open={isModalVisible}
            onOk={handleSubmit}
            onCancel={handleCancel}
            okText={editingId ? '수정' : '추가'}
            cancelText="취소"
          >
            <Form
              form={form}
              layout="vertical"
            >
              <Form.Item
                name="title"
                label="제목"
                rules={[{ required: true, message: '제목을 입력해주세요' }]}
              >
                <Input placeholder="스케줄 제목 입력" />
              </Form.Item>
              
              <Form.Item
                name="deadline"
                label="마감 날짜"
                rules={[{ required: true, message: '마감 날짜를 선택해주세요' }]}
                extra="마감 날짜는 23:59:59까지이며, 종료 시간은 다음 날 00:00:00으로 자동 설정됩니다."
              >
                <DatePicker 
                  format="MM.DD" 
                  placeholder="마감 날짜 선택"
                  style={{ width: '100%' }}
                />
              </Form.Item>
              
              <Form.Item
                label="종료 시간"
                extra="마감 날짜 + 1일 00:00:00으로 자동 설정됩니다."
              >
                <Input placeholder="자동 계산됨" disabled />
              </Form.Item>
              
              <Form.Item
                name="mainvisible"
                label="메인 노출"
                initialValue={0}
              >
                <Radio.Group>
                  <Radio value={0}>해당없음</Radio>
                  <Radio value={1}>1</Radio>
                  <Radio value={2}>2</Radio>
                  <Radio value={3}>3</Radio>
                </Radio.Group>
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

const ActionButton = styled(Button)`
  padding: 0 8px;
  height: 24px;
  font-size: 12px;
`;

export default AdminSchedulesPage; 