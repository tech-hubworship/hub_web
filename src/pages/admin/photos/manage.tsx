/**
 * 사진 관리 페이지
 * 
 * 사진을 업로드하고 기존 사진들을 미리보기, 수정, 삭제할 수 있는 통합 관리 페이지
 * 
 * @author HUB Development Team
 * @version 1.0.0
 */

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import * as S from "@src/views/AdminPage/style";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import React from 'react';
import styled from '@emotion/styled';

// 스타일드 컴포넌트

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
`;

const UploadForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
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
          background: #dc2626;
          color: white;
          &:hover { background: #b91c1c; }
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
          &:hover { background: #e5e7eb; }
        `;
    }
  }}
`;

const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
`;

const PhotoItem = styled.div<{ isSelected?: boolean }>`
  border: 2px solid ${props => props.isSelected ? '#3b82f6' : '#e5e7eb'};
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: ${props => props.isSelected ? '0 4px 12px rgba(59, 130, 246, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'};
  transition: all 0.2s;
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const CheckboxLabel = styled.label`
  position: absolute;
  top: 8px;
  left: 8px;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid #d1d5db;
  border-radius: 50%;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  input:checked + span {
    opacity: 1;
  }
`;

const Checkmark = styled.span`
  color: white;
  font-size: 16px;
  opacity: 0;
  transition: opacity 0.2s;
`;

const SelectionActionsBar = styled.div`
  background: #1f2937;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const PhotoImage = styled.img`
  width: 100%;
  height: 150px;
  object-fit: cover;
`;

const PhotoInfo = styled.div`
  padding: 12px;
`;

const PhotoTitle = styled.div`
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
  font-size: 14px;
  line-height: 1.4;
`;

const PhotoMeta = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
`;

const PhotoActions = styled.div`
  display: flex;
  gap: 6px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const Modal = styled.div<{ show: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.show ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
  
  &:hover {
    color: #374151;
  }
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
  justify-content: flex-end;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
`;

interface Folder {
  id: number;
  name: string;
  description?: string;
  is_public: boolean;
  order_index: number;
  parent_id?: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  photo_count?: number;
  subfolder_count?: number;
}

interface Photo {
  id: number;
  title?: string;
  description?: string;
  image_url: string;
  thumbnail_url?: string;
  file_size?: number;
  width?: number;
  height?: number;
  file_format?: string;
  is_active: boolean;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  photo_folders?: {
    id: number;
    name: string;
  };
}

interface FolderForm {
  name: string;
  description: string;
  is_public: boolean;
}

interface PhotoForm {
  folder_id: number;
  title: string;
  description: string;
  image_url: string;
  thumbnail_url: string;
  file_size: number;
  width: number;
  height: number;
  file_format: string;
}

export default function PhotoManagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  // 상태 관리
  const [folders, setFolders] = useState<Folder[]>([]); // 루트 폴더들
  const [subfolders, setSubfolders] = useState<Folder[]>([]); // 선택된 폴더의 하위 폴더들
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({ photoCount: 0, folderCount: 0 });
  
  // 모달 상태
  const [showFolderCreateModal, setShowFolderCreateModal] = useState(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  
  const [folderForm, setFolderForm] = useState<FolderForm>({
    name: '',
    description: '',
    is_public: true
  });
  
  const [photoForm, setPhotoForm] = useState<PhotoForm>({
    folder_id: 0,
    title: '',
    description: '',
    image_url: '',
    thumbnail_url: '',
    file_size: 0,
    width: 0,
    height: 0,
    file_format: ''
  });

  useEffect(() => {
    // 인증 및 권한 확인
    if (status === 'authenticated' && !session?.user?.isAdmin) {
      alert("관리자만 접근할 수 있는 페이지입니다.");
      router.replace('/');
    }
    if (status === 'authenticated' && !session?.user?.roles?.includes('사진팀')) {
      alert("사진팀 권한이 필요합니다.");
      router.replace('/admin');
    }
    if (status === 'unauthenticated') {
      router.replace('/');
    }
  }, [status, session, router]);

  // 폴더 로드
  useEffect(() => {
    loadFolders();
  }, []);

  // 선택된 폴더 변경 시 사진과 하위 폴더 로드
  useEffect(() => {
    if (selectedFolder) {
      loadPhotos(selectedFolder.id);
      loadSubfolders(selectedFolder.id);
      setPhotoForm(prev => ({ ...prev, folder_id: selectedFolder.id }));
    } else {
      setSubfolders([]);
    }
  }, [selectedFolder]);

  // 통계 로드
  useEffect(() => {
    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/photos/stats');
            const data = await response.json();
            if (response.ok) {
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };
    fetchStats();
  }, []);

  const loadFolders = async (parentId: number | null = null) => {
    setLoading(true);
    try {
      const url = parentId 
        ? `/api/admin/photos/folders?parent_id=${parentId}`
        : '/api/admin/photos/folders?parent_id=null';
      
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setFolders(data.folders || []);
      } else {
        alert('폴더 로드 실패: ' + data.error);
      }
    } catch (error) {
      console.error('폴더 로드 오류:', error);
      alert('폴더를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async (folderId: number) => {
    setSelectedPhotos([]);
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/photos?folder_id=${folderId}`);
      const data = await response.json();
      if (response.ok) {
        setPhotos(data.photos || []);
      } else {
        alert('사진 로드 실패: ' + data.error);
      }
    } catch (error) {
      console.error('사진 로드 오류:', error);
      alert('사진을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 하위 폴더 로드
  const loadSubfolders = async (folderId: number) => {
    try {
      const response = await fetch(`/api/admin/photos/folders?parent_id=${folderId}`);
      const data = await response.json();
      if (response.ok) {
        setSubfolders(data.folders || []);
      } else {
        console.error('하위 폴더 로드 실패:', data.error);
        setSubfolders([]);
      }
    } catch (error) {
      console.error('하위 폴더 로드 오류:', error);
      setSubfolders([]);
    }
  };

  const handlePhotoSelect = (photoId: number) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId) 
        : [...prev, photoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPhotos.length === photos.length) {
      setSelectedPhotos([]); // 모두 선택된 상태면 전체 해제
    } else {
      setSelectedPhotos(photos.map(p => p.id)); // 그렇지 않으면 전체 선택
    }
  };

  const deleteSelectedPhotos = async () => {
    if (!confirm(`정말로 선택된 ${selectedPhotos.length}개의 사진을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/photos`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedPhotos }), // ID 배열을 body로 전송
      });

      const data = await response.json();
      if (response.ok) {
        // 성공 시 선택 상태 초기화 및 목록 새로고침
        setSelectedPhotos([]);
        loadPhotos(selectedFolder!.id);
        loadFolders();
        alert(data.message || '사진이 삭제되었습니다.');
      } else {
        alert('사진 삭제 실패: ' + data.error);
      }
    } catch (error) {
      console.error('사진 삭제 오류:', error);
      alert('사진 삭제 중 오류가 발생했습니다.');
    }
  };

  const createFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!folderForm.name.trim()) {
      alert('폴더 이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // 하위 폴더 생성 시 parent_id 포함
      const folderData = {
        ...folderForm,
        parent_id: selectedFolder ? selectedFolder.id : null
      };

      const response = await fetch('/api/admin/photos/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(folderData),
      });

      const data = await response.json();
      if (response.ok) {
        setFolderForm({ name: '', description: '', is_public: true });
        loadFolders();
        setShowFolderCreateModal(false);
        
        if (selectedFolder) {
          alert('하위 폴더가 생성되었습니다.');
        } else {
          alert('폴더가 생성되었습니다.');
        }
      } else {
        alert('폴더 생성 실패: ' + data.error);
      }
    } catch (error) {
      console.error('폴더 생성 오류:', error);
      alert('폴더 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const convertGoogleDriveUrl = (url: string) => {
    console.log('🔗 변환 전 URL:', url);
    
    // Google Drive 공유 링크를 직접 다운로드 링크로 변환
    const patterns = [
      // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
      // https://docs.google.com/document/d/FILE_ID/edit
      /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
      // https://drive.google.com/open?id=FILE_ID
      /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const fileId = match[1];
        console.log('📁 추출된 파일 ID:', fileId);
        // 여러 Google Drive 이미지 링크 형식 시도
        const convertedUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
        console.log('🔄 변환 후 URL:', convertedUrl);
        return convertedUrl;
      }
    }

    console.log('❌ 변환 실패, 원본 URL 반환:', url);
    return url; // 변환할 수 없는 경우 원본 URL 반환
  };

  // Google Drive 이미지 URL 생성 (여러 방법 시도)
  const getGoogleDriveImageUrl = (fileId: string) => {
    const urls = [
      `https://lh3.googleusercontent.com/d/${fileId}`,
      `https://drive.google.com/uc?export=view&id=${fileId}`,
      `https://docs.google.com/uc?export=view&id=${fileId}`,
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`
    ];
    console.log('🔄 Google Drive 대안 URL들:', urls);
    return urls;
  };

  const uploadPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!photoForm.image_url.trim()) {
      alert('사진 링크를 입력해주세요.');
      return;
    }

    if (!photoForm.folder_id) {
      alert('폴더를 선택해주세요.');
      return;
    }

    setUploading(true);
    try {
      // Google Drive 링크 변환
      const convertedUrl = convertGoogleDriveUrl(photoForm.image_url);
      
      const response = await fetch('/api/admin/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...photoForm,
          image_url: convertedUrl,
          thumbnail_url: convertedUrl // 썸네일도 같은 링크 사용
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setPhotoForm({
          folder_id: selectedFolder?.id || 0,
          title: '',
          description: '',
          image_url: '',
          thumbnail_url: '',
          file_size: 0,
          width: 0,
          height: 0,
          file_format: ''
        });
        loadPhotos(selectedFolder?.id || 0);
        loadFolders(); // 폴더 목록도 다시 로드 (사진 개수 업데이트)
        setShowPhotoUploadModal(false);
        alert('사진이 업로드되었습니다.');
      } else {
        alert('사진 업로드 실패: ' + data.error);
      }
    } catch (error) {
      console.error('사진 업로드 오류:', error);
      alert('사진 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const updatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingPhoto) return;

    setUploading(true);
    try {
      // Google Drive 링크 변환
      const convertedUrl = convertGoogleDriveUrl(photoForm.image_url);
      
      const response = await fetch('/api/admin/photos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingPhoto.id,
          title: photoForm.title,
          description: photoForm.description,
          image_url: convertedUrl,
          thumbnail_url: convertedUrl, // 썸네일도 같은 링크 사용
          file_size: photoForm.file_size,
          width: photoForm.width,
          height: photoForm.height,
          file_format: photoForm.file_format
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setShowEditModal(false);
        setEditingPhoto(null);
        loadPhotos(selectedFolder?.id || 0);
        alert('사진이 수정되었습니다.');
      } else {
        alert('사진 수정 실패: ' + data.error);
      }
    } catch (error) {
      console.error('사진 수정 오류:', error);
      alert('사진 수정 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const openEditModal = (photo: Photo) => {
    setEditingPhoto(photo);
    setPhotoForm({
      folder_id: photo.id,
      title: photo.title || '',
      description: photo.description || '',
      image_url: photo.image_url,
      thumbnail_url: photo.thumbnail_url || '',
      file_size: photo.file_size || 0,
      width: photo.width || 0,
      height: photo.height || 0,
      file_format: photo.file_format || ''
    });
    setShowEditModal(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isGoogleDriveUrl = (url: string) => {
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  };

  const getCurrentLocation = () => {
    return selectedFolder ? selectedFolder.name : '폴더 목록';
  };

  // 로딩 중이거나 권한이 없는 경우
  if (status === 'loading' || !session?.user?.isAdmin || !session?.user?.roles?.includes('사진팀')) {
    return (
      <S.AdminLayout>
        <S.ContentArea>
          <EmptyState>
            <LoadingSpinner />
            <div>Loading...</div>
          </EmptyState>
        </S.ContentArea>
      </S.AdminLayout>
    );
  }

  const deleteFolder = async (folderId: number) => {
  if (!window.confirm('정말로 이 폴더를 삭제하시겠습니까?')) return;
  setLoading(true);
  try {
    const response = await fetch(`/api/admin/photos/folders?id=${folderId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (response.ok) {
      alert('폴더가 삭제되었습니다.');
      setSelectedFolder(null);
      setPhotos([]);
      await loadFolders();
    } else {
      alert(data.error || '폴더 삭제에 실패했습니다.');
    }
  } catch (error) {
    console.error('폴더 삭제 오류:', error);
    alert('폴더 삭제 중 오류가 발생했습니다.');
  } finally {
    setLoading(false);
  }
};

  const roles = session.user.roles || [];

  const isAllSelected = photos.length > 0 && selectedPhotos.length === photos.length;

  return (
    <S.AdminLayout>
      <S.Sidebar collapsed={sidebarCollapsed}>
        <S.SidebarHeader>
          <S.Logo>
            {!sidebarCollapsed && <S.LogoText>HUB Admin</S.LogoText>}
            <S.ToggleButton onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              {sidebarCollapsed ? '→' : '←'}
            </S.ToggleButton>
          </S.Logo>
        </S.SidebarHeader>
        
        <S.NavMenu>
          <Link href="/admin" passHref>
            <S.NavItem as="a">
              <S.NavIcon>🏠</S.NavIcon>
              {!sidebarCollapsed && <S.NavText>대시보드</S.NavText>}
            </S.NavItem>
          </Link>

          <S.NavItem as="a" onClick={() => router.push('/admin/photos')}>
            <S.NavIcon>📷</S.NavIcon>
            {!sidebarCollapsed && <S.NavText>사진팀 관리</S.NavText>}
          </S.NavItem>
          
          <S.NavItem active>
            <S.NavIcon>📸</S.NavIcon>
            {!sidebarCollapsed && <S.NavText>사진 관리</S.NavText>}
          </S.NavItem>
          
          {(roles.includes('디자인팀') || roles.includes('양육MC')) && (
            <Link href="/admin/design" passHref>
              <S.NavItem as="a">
                <S.NavIcon>🎨</S.NavIcon>
                {!sidebarCollapsed && <S.NavText>디자인 관리</S.NavText>}
              </S.NavItem>
            </Link>
          )}
          
          {roles.includes('서기') && (
            <Link href="/admin/secretary" passHref>
              <S.NavItem as="a">
                <S.NavIcon>✍️</S.NavIcon>
                {!sidebarCollapsed && <S.NavText>서기 관리</S.NavText>}
              </S.NavItem>
            </Link>
          )}
        </S.NavMenu>
      </S.Sidebar>

      <S.MainContent>
        <S.TopBar>
          <S.TopBarLeft>
            <S.PageTitle>사진 관리</S.PageTitle>
            <S.Breadcrumb>관리자 페이지 &gt; 사진팀 관리 &gt; 사진 관리</S.Breadcrumb>
          </S.TopBarLeft>
          <S.TopBarRight>
            <S.UserInfo>
              <S.UserAvatar>
                {session.user.name?.charAt(0) || 'U'}
              </S.UserAvatar>
              <S.UserDetails>
                <S.UserName>{session.user.name || '관리자'}</S.UserName>
                <S.UserRole>{roles.join(', ') || '관리자'}</S.UserRole>
              </S.UserDetails>
            </S.UserInfo>
          </S.TopBarRight>
        </S.TopBar>

        <S.ContentArea>
          {!selectedFolder && (
            <StatsGrid>
                <StatCard>
                    <StatValue>{stats.photoCount}</StatValue>
                    <StatLabel>총 사진 수</StatLabel>
                </StatCard>
                <StatCard>
                    <StatValue>{stats.folderCount}</StatValue>
                    <StatLabel>총 폴더 수</StatLabel>
                </StatCard>
            </StatsGrid>
          )}

          <div style={{ width: '100%' }}>
              {/* --- 헤더 영역 --- */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '16px',
                padding: '16px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selectedFolder && (
                    <Button 
                      variant="secondary"
                      onClick={() => setSelectedFolder(null)}
                      style={{ 
                        fontSize: '12px', 
                        padding: '6px 12px',
                        border: '1px solid #d1d5db',
                        background: 'white',
                        color: '#6b7280'
                      }}
                    >
                      ← 목록
                    </Button>
                  )}
                  <h2 style={{ 
                    margin: 0, 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#1f2937' 
                  }}>
                    {getCurrentLocation()}
                  </h2>
                </div>
                {selectedFolder ? (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Button 
                      variant="secondary" 
                      onClick={() => {
                        setFolderForm({ name: '', description: '', is_public: true });
                        setShowFolderCreateModal(true);
                      }}
                      style={{ fontSize: '14px', padding: '8px 16px' }}
                    >
                      📁 폴더 만들기
                    </Button>
                    <Button 
                      variant="danger" 
                      onClick={() => deleteFolder(selectedFolder.id)}
                      style={{ fontSize: '14px', padding: '8px 16px' }}
                    >
                      폴더 삭제
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={() => setShowPhotoUploadModal(true)}
                      style={{ fontSize: '14px', padding: '8px 16px' }}
                    >
                      사진 업로드
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="primary" 
                    onClick={() => setShowFolderCreateModal(true)}
                    style={{ fontSize: '14px', padding: '8px 16px' }}
                  >
                    📁 폴더 만들기
                  </Button>
                )}
              </div>
              
              {selectedFolder && selectedPhotos.length > 0 && (
                <SelectionActionsBar>
                  <div style={{ fontSize: '14px',display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <label style={{ fontSize: '14px',display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                      />
                      {isAllSelected ? '전체 해제' : '전체 선택'}
                    </label>
                    <span>{selectedPhotos.length}개 항목 선택됨</span>
                  </div>
                  <Button
                    variant="danger"
                    onClick={deleteSelectedPhotos}
                  >
                    선택 삭제
                  </Button>
                </SelectionActionsBar>
              )}

              {/* --- 사진 및 폴더 그리드 영역 --- */}
              {loading ? (
                <EmptyState>
                  <LoadingSpinner />
                  <div>로딩 중...</div>
                </EmptyState>
              ) : selectedFolder ? (
                <>
                  {/* 폴더 표시 */}
                  {subfolders.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#1f2937', 
                        marginBottom: '12px',
                        paddingBottom: '8px',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        📁 폴더
                      </h4>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                        gap: '16px',
                        padding: '16px',
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}>
                        {subfolders.map((subfolder) => (
                          <div
                            key={subfolder.id}
                            onClick={() => setSelectedFolder(subfolder)}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              padding: '20px 16px',
                              background: '#f8fafc',
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              position: 'relative',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#3b82f6';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.background = '#f0f9ff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.style.boxShadow = 'none';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.background = '#f8fafc';
                            }}
                          >
                            <div style={{ fontSize: '36px', marginBottom: '12px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
                              📁
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', textAlign: 'center', lineHeight: '1.3', marginBottom: '6px' }}>
                              {subfolder.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#6b7280', background: '#e5e7eb', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' }}>
                              📷 {subfolder.photo_count || 0}개 사진
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 사진 표시 */}
                  {photos.length === 0 && subfolders.length === 0 ? (
                    <EmptyState>
                      <div style={{ fontSize: '14px', marginTop: '8px' }}>
                        이 폴더에 사진과 하위 폴더가 없습니다.
                      </div>
                    </EmptyState>
                  ) : photos.length > 0 ? (
                    <>
                      <h4 style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#1f2937', 
                        marginBottom: '12px',
                        paddingBottom: '8px',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        📷 사진
                      </h4>
                      <PhotoGrid>
                    {photos.map((photo) => {
                      const isSelected = selectedPhotos.includes(photo.id);
                      return (
                        <PhotoItem key={photo.id} isSelected={isSelected}>
                          <CheckboxLabel style={{ background: isSelected ? '#3b82f6' : 'rgba(255,255,255,0.8)', borderColor: isSelected ? '#3b82f6' : '#d1d5db' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handlePhotoSelect(photo.id)}
                            />
                            <Checkmark>✔</Checkmark>
                          </CheckboxLabel>
                          <PhotoImage
                            src={photo.thumbnail_url || photo.image_url}
                            alt={photo.title || '사진'}
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.src = 'data:image/svg+xml;base64,...'; // Placeholder
                            }}
                          />
                          <PhotoInfo>
                            <PhotoTitle>{photo.title || '제목 없음'}</PhotoTitle>
                            <PhotoMeta>
                              {photo.width && photo.height ? `${photo.width}×${photo.height}` : ''}
                            </PhotoMeta>
                            <PhotoActions>
                              <Button
                                variant="secondary"
                                onClick={() => openEditModal(photo)}
                              >
                                수정
                              </Button>
                            </PhotoActions>
                          </PhotoInfo>
                        </PhotoItem>
                      )
                    })}
                      </PhotoGrid>
                    </>
                  ) : null}
                </>
              ) : (
                folders.length === 0 ? (
                  <EmptyState>
                    <div>폴더가 없습니다.</div>
                    <div style={{ fontSize: '14px', marginTop: '8px' }}>
                      "폴더 만들기" 버튼을 클릭하여 새 폴더를 만들어보세요.
                    </div>
                  </EmptyState>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                    gap: '16px',
                    padding: '16px',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}>
                    {folders.map((folder) => (
                      <div
                        key={folder.id}
                        onClick={() => setSelectedFolder(folder)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '20px 16px',
                          background: '#f8fafc',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.background = '#f0f9ff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.background = '#f8fafc';
                        }}
                      >
                        <div style={{ fontSize: '36px', marginBottom: '12px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
                          📁
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', textAlign: 'center', lineHeight: '1.3', marginBottom: '6px' }}>
                          {folder.name}
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          gap: '6px', 
                          fontSize: '11px', 
                          color: '#6b7280' 
                        }}>
                          <div style={{ background: '#e5e7eb', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' }}>
                            📷 {folder.photo_count || 0}
                          </div>
                          {(folder.subfolder_count || 0) > 0 && (
                            <div style={{ background: '#dbeafe', padding: '2px 8px', borderRadius: '12px', fontWeight: '500', color: '#1e40af' }}>
                              📁 {folder.subfolder_count}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
          </div>

          <Modal show={showPhotoUploadModal}>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>사진 업로드</ModalTitle>
                <CloseButton onClick={() => setShowPhotoUploadModal(false)}>×</CloseButton>
              </ModalHeader>
              <UploadForm onSubmit={uploadPhoto}>
                <FormGroup>
                  <Label>사진 링크</Label>
                  <Input
                    type="url"
                    value={photoForm.image_url}
                    onChange={(e) => setPhotoForm(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="https://example.com/photo.jpg"
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label>사진 제목</Label>
                  <Input
                    type="text"
                    value={photoForm.title}
                    onChange={(e) => setPhotoForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="사진 제목을 입력하세요"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>설명</Label>
                  <TextArea
                    value={photoForm.description}
                    onChange={(e) => setPhotoForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="사진 설명을 입력하세요"
                  />
                </FormGroup>
                <ModalButtons>
                  <Button type="button" onClick={() => setShowPhotoUploadModal(false)}>
                    취소
                  </Button>
                  <Button type="submit" variant="primary" disabled={uploading}>
                    {uploading ? <LoadingSpinner /> : '업로드'}
                  </Button>
                </ModalButtons>
              </UploadForm>
            </ModalContent>
          </Modal>

          <Modal show={showFolderCreateModal}>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>
                  {selectedFolder ? `📁 "${selectedFolder.name}"에 폴더 만들기` : '📁 새 폴더 만들기'}
                </ModalTitle>
                <CloseButton onClick={() => setShowFolderCreateModal(false)}>×</CloseButton>
              </ModalHeader>
              <UploadForm onSubmit={createFolder}>
                <FormGroup>
                  <Label>폴더 이름</Label>
                  <Input
                    type="text"
                    value={folderForm.name}
                    onChange={(e) => setFolderForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="폴더 이름을 입력하세요"
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label>설명</Label>
                  <TextArea
                    value={folderForm.description}
                    onChange={(e) => setFolderForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="폴더 설명을 입력하세요"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>
                    <input
                      type="checkbox"
                      checked={folderForm.is_public}
                      onChange={(e) => setFolderForm(prev => ({ ...prev, is_public: e.target.checked }))}
                    />
                    공개 폴더
                  </Label>
                </FormGroup>
                <ModalButtons>
                  <Button type="button" onClick={() => setShowFolderCreateModal(false)}>
                    취소
                  </Button>
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? <LoadingSpinner /> : '생성'}
                  </Button>
                </ModalButtons>
              </UploadForm>
            </ModalContent>
          </Modal>

          <Modal show={showEditModal}>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>사진 수정</ModalTitle>
                <CloseButton onClick={() => setShowEditModal(false)}>×</CloseButton>
              </ModalHeader>
              <UploadForm onSubmit={updatePhoto}>
                <FormGroup>
                  <Label>사진 링크</Label>
                  <Input
                    type="url"
                    value={photoForm.image_url}
                    onChange={(e) => setPhotoForm(prev => ({ ...prev, image_url: e.target.value }))}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label>제목</Label>
                  <Input
                    type="text"
                    value={photoForm.title}
                    onChange={(e) => setPhotoForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>설명</Label>
                  <TextArea
                    value={photoForm.description}
                    onChange={(e) => setPhotoForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </FormGroup>
                <ModalButtons>
                  <Button type="button" onClick={() => setShowEditModal(false)}>
                    취소
                  </Button>
                  <Button type="submit" variant="primary" disabled={uploading}>
                    {uploading ? <LoadingSpinner /> : '수정'}
                  </Button>
                </ModalButtons>
              </UploadForm>
            </ModalContent>
          </Modal>
        </S.ContentArea>
      </S.MainContent>
    </S.AdminLayout>
  );
}
