import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Typography, Upload, Card } from 'antd';
import { CloseOutlined, EditOutlined, PlusOutlined, DeleteOutlined, UploadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import styled from '@emotion/styled';
import AdminLayout from '@src/components/AdminLayout';
import Head from 'next/head';
import axios from 'axios';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import { InputNumber } from 'antd';

// 숙소 인터페이스 정의
interface Accommodation {
  id: number;
  building: string;
  room_number: string;
  capacity: number;
  floor: number;
  description: string;
  image_url?: string;
  created_at: string;
}

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const AdminAccommodationsPage: React.FC = () => {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // 숙소 데이터 불러오기
  const fetchAccommodations = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/accommodations');
      setAccommodations(response.data);
      message.success('숙소 정보를 불러왔습니다.');
    } catch (error) {
      console.error('숙소 정보 불러오기 실패:', error);
      message.error('숙소 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 불러오기
  useEffect(() => {
    fetchAccommodations();
  }, []);

  // 모달 표시 함수
  const showModal = (record?: Accommodation) => {
    setFileList([]);
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue({
        building: record.building,
        room_number: record.room_number,
        capacity: record.capacity,
        floor: record.floor,
        description: record.description,
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
    }
    setIsModalVisible(true);
  };

  // 모달 취소
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setFileList([]);
  };

  // 폼 제출 처리
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setUploading(true);
      
      // 이미지 업로드 처리
      let imageUrl = editingId && accommodations.find(a => a.id === editingId)?.image_url;
      
      if (fileList.length > 0 && fileList[0].originFileObj) {
        const formData = new FormData();
        formData.append('file', fileList[0].originFileObj);
        
        try {
          const uploadRes = await axios.post('/api/admin/upload', formData);
          imageUrl = uploadRes.data.url;
        } catch (error) {
          console.error('이미지 업로드 오류:', error);
          message.error('이미지 업로드 중 오류가 발생했습니다.');
          setUploading(false);
          return;
        }
      }
      
      const submissionData = {
        ...values,
        image_url: imageUrl
      };
      
      if (editingId) {
        // 수정 요청
        await axios.put(`/api/admin/accommodations/${editingId}`, submissionData);
        message.success('숙소 정보가 성공적으로 수정되었습니다.');
      } else {
        // 추가 요청
        await axios.post('/api/admin/accommodations', submissionData);
        message.success('숙소가 성공적으로 추가되었습니다.');
      }
      
      setIsModalVisible(false);
      form.resetFields();
      setFileList([]);
      fetchAccommodations(); // 데이터 다시 불러오기
    } catch (error: any) {
      console.error('폼 제출 오류:', error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('폼 작성 중 오류가 발생했습니다.');
      }
    } finally {
      setUploading(false);
    }
  };

  // 숙소 삭제 처리
  const handleDelete = async (id: number) => {
    if (!confirm('정말로 이 숙소를 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/admin/accommodations/${id}`);
      message.success('숙소가 삭제되었습니다');
      fetchAccommodations(); // 데이터 다시 불러오기
    } catch (error) {
      console.error('숙소 삭제 중 오류:', error);
      message.error('숙소 삭제 중 오류가 발생했습니다');
    }
  };

  // 검색 필터링
  const getFilteredAccommodations = () => {
    if (!searchText) {
      return accommodations;
    }
    
    const searchLower = searchText.toLowerCase();
    return accommodations.filter(
      acc => 
        acc.building.toLowerCase().includes(searchLower) || 
        acc.room_number.toLowerCase().includes(searchLower) ||
        acc.description.toLowerCase().includes(searchLower)
    );
  };

  // 업로드 전 파일 확인
  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('이미지 파일만 업로드할 수 있습니다!');
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('이미지 크기는 2MB 이하여야 합니다!');
    }
    
    return false; // 수동 업로드를 위해 자동 업로드 방지
  };

  // 업로드 파일 변경 핸들러
  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // 테이블 컬럼 정의
  const columns: ColumnsType<Accommodation> = [
    {
      title: '건물명',
      dataIndex: 'building',
      key: 'building',
      sorter: (a, b) => a.building.localeCompare(b.building),
    },
    {
      title: '호수',
      dataIndex: 'room_number',
      key: 'room_number',
      sorter: (a, b) => a.room_number.localeCompare(b.room_number),
    },
    {
      title: '층',
      dataIndex: 'floor',
      key: 'floor',
      sorter: (a, b) => a.floor - b.floor,
    },
    {
      title: '정원',
      dataIndex: 'capacity',
      key: 'capacity',
      sorter: (a, b) => a.capacity - b.capacity,
    },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <DescriptionCell>{text}</DescriptionCell>
      ),
    },
    {
      title: '이미지',
      dataIndex: 'image_url',
      key: 'image_url',
      render: (url: string) => (
        url ? <ThumbnailImage src={url} alt="숙소 이미지" /> : '이미지 없음'
      ),
    },
    {
      title: '관리',
      key: 'action',
      width: 150,
      render: (_: any, record: Accommodation) => (
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
        <title>숙소 관리 | 허브 커뮤니티 관리자</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <AdminLayout title="숙소 관리">
        <ActionBar>
          <SearchContainer>
            <Input
              prefix={<SearchOutlined />}
              placeholder="건물명, 호수, 설명으로 검색"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </SearchContainer>
          
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            숙소 추가
          </Button>
        </ActionBar>

        <Table
          columns={columns}
          dataSource={getFilteredAccommodations()}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />

        <Modal
          title={editingId ? '숙소 정보 수정' : '새 숙소 추가'}
          open={isModalVisible}
          onOk={handleSubmit}
          onCancel={handleCancel}
          okText={editingId ? '수정' : '추가'}
          cancelText="취소"
          confirmLoading={uploading}
        >
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              name="building"
              label="건물명"
              rules={[{ required: true, message: '건물명을 입력해주세요' }]}
            >
              <Input placeholder="건물명을 입력하세요" />
            </Form.Item>
            
            <Form.Item
              name="room_number"
              label="호수"
              rules={[{ required: true, message: '호수를 입력해주세요' }]}
            >
              <Input placeholder="호수를 입력하세요" />
            </Form.Item>
            
            <Form.Item
              name="floor"
              label="층"
              rules={[{ required: true, message: '층을 입력해주세요' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="층을 입력하세요" />
            </Form.Item>
            
            <Form.Item
              name="capacity"
              label="정원"
              rules={[{ required: true, message: '정원을 입력해주세요' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="정원을 입력하세요" />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="설명"
            >
              <TextArea 
                placeholder="숙소에 대한 설명을 입력하세요" 
                rows={4}
                showCount
                maxLength={300}
              />
            </Form.Item>
            
            <Form.Item
              label="숙소 이미지"
            >
              <Upload
                listType="picture"
                fileList={fileList}
                beforeUpload={beforeUpload}
                onChange={handleChange}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>이미지 업로드</Button>
              </Upload>
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                이미지는 2MB 이하의 JPG, PNG 파일만 업로드 가능합니다.
              </Text>
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

const SearchContainer = styled.div`
  width: 300px;
  
  @media (max-width: 576px) {
    width: 100%;
  }
`;

const DescriptionCell = styled.div`
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

export default AdminAccommodationsPage; 