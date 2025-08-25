import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Typography, DatePicker, Tabs, Card } from 'antd';
import { CloseOutlined, EditOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import styled from '@emotion/styled';
import AdminLayout from '@src/components/AdminLayout';
import Head from 'next/head';
import axios from 'axios';
import moment from 'moment';

// 식단표 인터페이스 정의
interface MealPlan {
  id: number;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  menu: string;
  created_at: string;
}

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

// 식사 유형별 한글 이름
const mealTypeNames = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁'
};

const AdminMealsPage: React.FC = () => {
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[moment.Moment, moment.Moment] | null>(null);

  // 식단표 데이터 불러오기
  const fetchMeals = async () => {
    setLoading(true);
    try {
      let url = '/api/admin/meals';
      
      // 날짜 필터 추가
      if (dateRange && dateRange[0] && dateRange[1]) {
        const startDate = dateRange[0].format('YYYY-MM-DD');
        const endDate = dateRange[1].format('YYYY-MM-DD');
        url += `?start_date=${startDate}&end_date=${endDate}`;
      }
      
      const response = await axios.get(url);
      setMeals(response.data);
      message.success('식단표를 불러왔습니다.');
    } catch (error) {
      console.error('식단표 불러오기 실패:', error);
      message.error('식단표를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 불러오기
  useEffect(() => {
    fetchMeals();
  }, [dateRange]);

  // 모달 표시 함수
  const showModal = (record?: MealPlan) => {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue({
        date: moment(record.date),
        meal_type: record.meal_type,
        menu: record.menu,
      });
    } else {
      setEditingId(null);
      form.resetFields();
      // 기본값 설정 - 오늘 날짜와 아침
      form.setFieldsValue({
        date: moment(),
        meal_type: 'breakfast'
      });
    }
    setIsModalVisible(true);
  };

  // 모달 취소
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // 폼 제출 처리
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 날짜 형식 변환
      const submissionData = {
        ...values,
        date: values.date.format('YYYY-MM-DD')
      };
      
      if (editingId) {
        // 수정 요청
        await axios.put(`/api/admin/meals/${editingId}`, submissionData);
        message.success('식단이 성공적으로 수정되었습니다.');
      } else {
        // 추가 요청
        await axios.post('/api/admin/meals', submissionData);
        message.success('식단이 성공적으로 추가되었습니다.');
      }
      
      setIsModalVisible(false);
      form.resetFields();
      fetchMeals(); // 데이터 다시 불러오기
    } catch (error: any) {
      console.error('폼 제출 오류:', error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('폼 작성 중 오류가 발생했습니다.');
      }
    }
  };

  // 식단 삭제 처리
  const handleDelete = async (id: number) => {
    if (!confirm('정말로 이 식단을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/admin/meals/${id}`);
      message.success('식단이 삭제되었습니다');
      fetchMeals(); // 데이터 다시 불러오기
    } catch (error) {
      console.error('식단 삭제 중 오류:', error);
      message.error('식단 삭제 중 오류가 발생했습니다');
    }
  };

  // 탭 변경 처리
  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  // 필터링된 식단 데이터
  const getFilteredMeals = () => {
    if (activeTab === 'all') {
      return meals;
    }
    return meals.filter(meal => meal.meal_type === activeTab);
  };

  // 테이블 컬럼 정의
  const columns: ColumnsType<MealPlan> = [
    {
      title: '날짜',
      dataIndex: 'date',
      key: 'date',
      render: (text: string) => {
        const date = new Date(text);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      },
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      defaultSortOrder: 'descend'
    },
    {
      title: '식사',
      dataIndex: 'meal_type',
      key: 'meal_type',
      render: (text: 'breakfast' | 'lunch' | 'dinner') => mealTypeNames[text],
      filters: [
        { text: '아침', value: 'breakfast' },
        { text: '점심', value: 'lunch' },
        { text: '저녁', value: 'dinner' },
      ],
      onFilter: (value, record) => record.meal_type === value,
    },
    {
      title: '메뉴',
      dataIndex: 'menu',
      key: 'menu',
      width: '40%',
      render: (text: string) => (
        <MenuContent>{text}</MenuContent>
      )
    },
    {
      title: '등록일',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleDateString(),
    },
    {
      title: '관리',
      key: 'action',
      width: 150,
      render: (_: any, record: MealPlan) => (
        <Space size="small">
          <ActionButton onClick={() => showModal(record)}>
            <EditOutlined /> 수정
          </ActionButton>
          <ActionButton danger onClick={() => handleDelete(record.id)}>
            <DeleteOutlined /> 삭제
          </ActionButton>
        </Space>
      ),
    },
  ];

  // 달력 뷰 - 날짜별로 식단 표시
  const renderCalendarView = () => {
    // 모든 날짜를 가져와서 중복 제거
    const uniqueDatesSet = new Set(meals.map(meal => meal.date));
    const uniqueDates = Array.from(uniqueDatesSet).sort().reverse();
    
    return (
      <CalendarContainer>
        {uniqueDates.map(date => (
          <DayCard key={date}>
            <DayHeader>
              <Text strong>{moment(date).format('YYYY년 MM월 DD일')} ({moment(date).format('ddd')})</Text>
            </DayHeader>
            <MealList>
              {['breakfast', 'lunch', 'dinner'].map(mealType => {
                const mealForType = meals.find(
                  meal => meal.date === date && meal.meal_type === mealType
                );
                
                return (
                  <MealItem key={mealType}>
                    <MealTypeLabel>{mealTypeNames[mealType as keyof typeof mealTypeNames]}</MealTypeLabel>
                    {mealForType ? (
                      <MealContent>
                        <div>{mealForType.menu}</div>
                        <MealActions>
                          <Button 
                            type="text" 
                            size="small" 
                            icon={<EditOutlined />} 
                            onClick={() => showModal(mealForType)} 
                          />
                          <Button 
                            type="text" 
                            size="small" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={() => handleDelete(mealForType.id)} 
                          />
                        </MealActions>
                      </MealContent>
                    ) : (
                      <EmptyMeal>
                        <Button 
                          size="small" 
                          type="dashed" 
                          onClick={() => {
                            form.resetFields();
                            form.setFieldsValue({
                              date: moment(date),
                              meal_type: mealType
                            });
                            setEditingId(null);
                            setIsModalVisible(true);
                          }}
                        >
                          <PlusOutlined /> 식단 추가
                        </Button>
                      </EmptyMeal>
                    )}
                  </MealItem>
                );
              })}
            </MealList>
          </DayCard>
        ))}
      </CalendarContainer>
    );
  };

  return (
    <>
      <Head>
        <title>식단표 관리 | 허브 커뮤니티</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <AdminLayout title="식단표 관리">
        <Container>
          <Header>
            <Title level={2}>식단표 관리</Title>
            <Space>
              <DatePicker.RangePicker 
                onChange={(dates) => setDateRange(dates as [moment.Moment, moment.Moment] | null)} 
                allowClear
                placeholder={['시작일', '종료일']}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
                식단 추가
              </Button>
            </Space>
          </Header>

          <Tabs activeKey={activeTab} onChange={handleTabChange}>
            <TabPane tab="전체 식단" key="all" />
            <TabPane tab="아침" key="breakfast" />
            <TabPane tab="점심" key="lunch" />
            <TabPane tab="저녁" key="dinner" />
            <TabPane tab="달력 보기" key="calendar" />
          </Tabs>

          {activeTab === 'calendar' ? (
            renderCalendarView()
          ) : (
            <Table
              columns={columns}
              dataSource={getFilteredMeals()}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          )}

          <Modal
            title={editingId ? '식단 수정' : '식단 추가'}
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
                name="date"
                label="날짜"
                rules={[{ required: true, message: '날짜를 선택해주세요' }]}
              >
                <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="meal_type"
                label="식사 종류"
                rules={[{ required: true, message: '식사 종류를 선택해주세요' }]}
              >
                <Select placeholder="식사 종류 선택">
                  <Option value="breakfast">아침</Option>
                  <Option value="lunch">점심</Option>
                  <Option value="dinner">저녁</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="menu"
                label="메뉴"
                rules={[{ required: true, message: '메뉴를 입력해주세요' }]}
              >
                <TextArea 
                  placeholder="식단 메뉴를 입력하세요. 여러 메뉴는 쉼표로 구분해주세요." 
                  rows={4}
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Form>
          </Modal>
        </Container>
      </AdminLayout>
    </>
  );
};

// 스타일 컴포넌트
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

const MenuContent = styled.div`
  white-space: pre-line;
  line-height: 1.5;
`;

// 달력 뷰 스타일
const CalendarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DayCard = styled(Card)`
  margin-bottom: 8px;
`;

const DayHeader = styled.div`
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 8px;
`;

const MealList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MealItem = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
`;

const MealTypeLabel = styled.div`
  min-width: 60px;
  font-weight: 500;
  color: #555;
`;

const MealContent = styled.div`
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const MealActions = styled.div`
  display: flex;
  gap: 4px;
  opacity: 0.5;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 1;
  }
`;

const EmptyMeal = styled.div`
  color: #999;
  font-style: italic;
`;

export default AdminMealsPage;
