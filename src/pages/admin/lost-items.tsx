import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Typography, Upload, DatePicker, Badge } from 'antd';
import { CloseOutlined, EditOutlined, PlusOutlined, DeleteOutlined, UploadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import styled from '@emotion/styled';
import AdminLayout from '@src/components/AdminLayout';
import Head from 'next/head';
import axios from 'axios';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import moment from 'moment';
import { getLostItems, createLostItem, updateLostItem, deleteLostItem, uploadImage } from '@src/lib/api/admin';
import { supabase } from '@src/lib/supabase';

// 분실물 인터페이스 정의
interface LostItem {
  id: number;
  name: string;
  description: string;
  location: string;
  found_date: string;
  status: string;
  image_url?: string;
  contact_info?: string;
  created_at: string;
  updated_at: string;
}

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const AdminLostItemsPage: React.FC = () => {
  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // 분실물 데이터 불러오기
  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await getLostItems();
      setItems(data);
    } catch (error) {
      console.error('분실물 목록 로드 중 오류:', error);
      message.error('분실물 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 불러오기
  useEffect(() => {
    loadItems();
  }, []);

  // 모달 표시 함수
  const showModal = (record?: LostItem) => {
    setFileList([]);
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue({
        name: record.name,
        description: record.description,
        location: record.location,
        found_date: moment(record.found_date),
        status: record.status,
        contact_info: record.contact_info,
      });
      
      if (record.image_url) {
        setFileList([{
          uid: '-1',
          name: '현재 이미지',
          status: 'done',
          url: record.image_url,
        }]);
      }
    } else {
      setEditingId(null);
      form.resetFields();
      form.setFieldsValue({
        found_date: moment(),
        status: 'found'
      });
    }
    setIsModalVisible(true);
  };

  // 모달 취소
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setFileList([]);
  };

  // 업로드 전 파일 확인
  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('이미지 파일만 업로드할 수 있습니다!');
      return Upload.LIST_IGNORE;
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('이미지 크기는 2MB 이하여야 합니다!');
      return Upload.LIST_IGNORE;
    }
    
    return false; // 수동 업로드를 위해 자동 업로드 방지
  };

  // 업로드 파일 변경 핸들러
  const handleUploadChange = async ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    try {
      // 새로 추가된 파일이 있는 경우
      const newFile = newFileList.find(file => file.status === 'uploading');
      if (newFile?.originFileObj) {
        setUploading(true);
        console.log('새 파일 업로드 시작:', newFile.name);
        
        try {
          const imageUrl = await uploadImage(newFile.originFileObj);
          console.log('업로드된 이미지 URL:', imageUrl);
          
          if (!imageUrl) {
            throw new Error('이미지 URL을 받지 못했습니다.');
          }

          // 파일 리스트 업데이트
          const updatedFileList: UploadFile[] = [{
            uid: '-1',
            name: newFile.name,
            status: 'done' as const,
            url: imageUrl,
          }];
          
          setFileList(updatedFileList);
          message.success('이미지가 업로드되었습니다.');
        } catch (uploadError: any) {
          console.error('이미지 업로드 실패:', uploadError);
          message.error(uploadError.message || '이미지 업로드에 실패했습니다.');
          setFileList([]);
        }
      } else {
        // 파일이 제거된 경우
        setFileList(newFileList);
      }
    } catch (error: any) {
      console.error('이미지 업로드 중 오류:', error);
      message.error(error.message || '이미지 업로드에 실패했습니다.');
      setFileList([]);
    } finally {
      setUploading(false);
    }
  };

  // 폼 제출 처리
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      console.log('폼 제출 시작');
      console.log('제출된 값:', values);
      console.log('현재 파일 리스트:', fileList);

      // 날짜 형식 검증
      if (!values.found_date || !moment.isMoment(values.found_date)) {
        throw new Error('유효하지 않은 날짜입니다.');
      }

      // 이미지 URL 처리
      let imageUrl = null;
      if (fileList.length > 0 && fileList[0].originFileObj) {
        try {
          imageUrl = await uploadImage(fileList[0].originFileObj);
          console.log('업로드된 이미지 URL:', imageUrl);
        } catch (uploadError: any) {
          console.error('이미지 업로드 실패:', uploadError);
          message.error(uploadError.message || '이미지 업로드에 실패했습니다.');
          return;
        }
      }

      const formData = {
        name: values.name?.trim(),
        description: values.description?.trim(),
        location: values.location?.trim(),
        found_date: values.found_date.toISOString(),
        image_url: imageUrl,
        contact_info: values.contact_info?.trim() || null,
        status: values.status || '보관중'
      };

      console.log('전송할 데이터:', formData);

      // 필수 필드 검증
      if (!formData.name || !formData.description || !formData.location) {
        throw new Error('필수 정보가 누락되었습니다.');
      }

      let response;
      if (editingId) {
        // 수정 모드
        response = await updateLostItem(editingId, formData);
        message.success('분실물이 수정되었습니다.');
      } else {
        // 새로 추가 모드
        response = await createLostItem(formData);
        message.success('분실물이 등록되었습니다.');
      }

      console.log('API 응답:', response);
      setIsModalVisible(false);
      form.resetFields();
      setFileList([]);
      loadItems();
    } catch (error: any) {
      console.error('분실물 등록/수정 중 오류:', error);
      message.error(error.message || '분실물 등록/수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 분실물 삭제 처리
  const handleDelete = async (id: number) => {
    if (!confirm('정말로 이 분실물을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      await deleteLostItem(id);
      message.success('분실물이 삭제되었습니다');
      loadItems();
    } catch (error) {
      console.error('분실물 삭제 중 오류:', error);
      message.error('분실물 삭제에 실패했습니다');
    }
  };

  // 검색 및 필터링
  const getFilteredItems = () => {
    let filtered = items;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        item => 
          item.name.toLowerCase().includes(searchLower) || 
          item.description.toLowerCase().includes(searchLower) ||
          item.location.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  };

  // 상태 배지 표시
  const renderStatusBadge = (status: string) => {
    let color = 'default';
    let text = status;
    
    switch (status) {
      case 'found':
        color = 'success';
        text = '보관중';
        break;
      case 'returned':
        color = 'default';
        text = '찾아감';
        break;
      default:
        color = 'processing';
        text = status;
    }
    
    return <Badge status={color as any} text={text} />;
  };

  // 테이블 컬럼 정의
  const columns: ColumnsType<LostItem> = [
    {
      title: '분실물명',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '발견 장소',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '발견 일자',
      dataIndex: 'found_date',
      key: 'found_date',
      render: (date: string) => moment(date).format('YYYY-MM-DD'),
      sorter: (a, b) => moment(a.found_date).unix() - moment(b.found_date).unix(),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => renderStatusBadge(status),
      filters: [
        { text: '보관중', value: 'found' },
        { text: '찾아감', value: 'returned' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '이미지',
      dataIndex: 'image_url',
      key: 'image_url',
      render: (url: string) => (
        url ? <ThumbnailImage src={url} alt="분실물 이미지" /> : '이미지 없음'
      ),
    },
    {
      title: '관리',
      key: 'action',
      width: 150,
      render: (_: any, record: LostItem) => (
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

  return (
    <>
      <Head>
        <title>분실물 관리 | 허브 커뮤니티 관리자</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <AdminLayout title="분실물 관리">
        <ActionBar>
          <FiltersContainer>
            <SearchContainer>
              <Input
                prefix={<SearchOutlined />}
                placeholder="분실물명, 위치로 검색"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
              />
            </SearchContainer>
            
            <StatusFilter>
              <Select
                value={statusFilter}
                onChange={value => setStatusFilter(value)}
                style={{ width: 120 }}
              >
                <Option value="all">전체</Option>
                <Option value="found">보관중</Option>
                <Option value="returned">찾아감</Option>
              </Select>
            </StatusFilter>
          </FiltersContainer>
          
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            분실물 추가
          </Button>
        </ActionBar>

        <Table
          columns={columns}
          dataSource={getFilteredItems()}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record) => (
              <ExpandedDescription>
                <DescriptionTitle>상세 설명:</DescriptionTitle>
                <DescriptionContent>{record.description || '설명 없음'}</DescriptionContent>
                
                <DescriptionTitle>문의 정보:</DescriptionTitle>
                <DescriptionContent>{record.contact_info || '정보 없음'}</DescriptionContent>
              </ExpandedDescription>
            ),
          }}
        />

        <Modal
          title={editingId ? '분실물 정보 수정' : '새 분실물 추가'}
          open={isModalVisible}
          onCancel={handleCancel}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              found_date: moment(),
              status: '보관중'
            }}
          >
            <Form.Item
              name="name"
              label="분실물명"
              rules={[{ required: true, message: '분실물명을 입력해주세요' }]}
            >
              <Input placeholder="분실물명을 입력하세요" />
            </Form.Item>
            
            <Form.Item
              name="location"
              label="발견 장소"
              rules={[{ required: true, message: '발견 장소를 입력해주세요' }]}
            >
              <Input placeholder="발견 장소를 입력하세요" />
            </Form.Item>
            
            <Form.Item
              name="found_date"
              label="발견 일자"
              rules={[{ required: true, message: '발견 일자를 선택해주세요' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="status"
              label="상태"
              rules={[{ required: true, message: '상태를 선택해주세요' }]}
            >
              <Select>
                <Option value="보관중">보관중</Option>
                <Option value="반환완료">반환완료</Option>
                <Option value="폐기">폐기</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="description"
              label="상세 설명"
              rules={[{ required: true, message: '상세 설명을 입력해주세요' }]}
            >
              <TextArea 
                placeholder="분실물에 대한 상세 설명을 입력하세요" 
                rows={4}
                showCount
                maxLength={500}
              />
            </Form.Item>
            
            <Form.Item
              name="contact_info"
              label="문의 정보"
            >
              <Input placeholder="문의 정보를 입력하세요" />
            </Form.Item>
            
            <Form.Item
              label="분실물 이미지"
            >
              <Upload
                listType="picture"
                fileList={fileList}
                beforeUpload={beforeUpload}
                onChange={handleUploadChange}
                maxCount={1}
                disabled={uploading}
                onRemove={() => {
                  setFileList([]);
                  return true;
                }}
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  {uploading ? '업로드 중...' : '이미지 업로드'}
                </Button>
              </Upload>
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                이미지는 2MB 이하의 JPG, PNG 파일만 업로드 가능합니다.
              </Text>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingId ? '수정' : '등록'}
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </AdminLayout>
    </>
  );
};

// 스타일 컴포넌트
const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  
  @media (max-width: 576px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }
`;

const SearchContainer = styled.div`
  width: 300px;
  
  @media (max-width: 576px) {
    width: 100%;
  }
`;

const StatusFilter = styled.div`
  @media (max-width: 576px) {
    width: 100%;
  }
`;

const ThumbnailImage = styled.img`
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
`;

const ActionButton = styled(Button)`
  padding: 0 8px;
`;

const ExpandedDescription = styled.div`
  padding: 0 16px;
`;

const DescriptionTitle = styled.div`
  font-weight: 600;
  margin-top: 8px;
  margin-bottom: 4px;
`;

const DescriptionContent = styled.div`
  white-space: pre-wrap;
  margin-bottom: 12px;
`;

export default AdminLostItemsPage; 