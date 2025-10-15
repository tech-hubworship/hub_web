/**
 * 사진 업로드 페이지
 * 
 * 사진팀 권한을 가진 관리자를 위한 사진 업로드 전용 페이지
 * 
 * @author HUB Development Team
 * @version 1.0.0
 */

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import * as S from "@src/views/AdminPage/style";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import styled from '@emotion/styled';

// Styled Components for Photo Upload
const UploadContainer = styled.div`
    display: flex;
    gap: 24px;
    margin-top: 24px;
`;

const FolderSection = styled.div`
    flex: 1;
    background: #ffffff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const UploadSection = styled.div`
    flex: 2;
    background: #ffffff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h3`
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 16px 0;
    display: flex;
    align-items: center;
    gap: 8px;
`;

const FolderList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
    max-height: 300px;
    overflow-y: auto;
`;

const FolderItem = styled.div<{ active?: boolean }>`
    padding: 12px 16px;
    border-radius: 8px;
    background: ${props => props.active ? '#eff6ff' : '#f9fafb'};
    border: 1px solid ${props => props.active ? '#3b82f6' : '#e5e7eb'};
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
        background: #eff6ff;
        border-color: #3b82f6;
    }
`;

const FolderName = styled.div`
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 4px;
`;

const FolderInfo = styled.div`
    font-size: 12px;
    color: #6b7280;
`;

const AddButton = styled.button`
    width: 100%;
    padding: 12px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease;
    margin-bottom: 16px;
    
    &:hover {
        background: #2563eb;
    }
`;

const UploadForm = styled.div`
    background: #f9fafb;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
`;

const FormGroup = styled.div`
    margin-bottom: 16px;
`;

const Label = styled.label`
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
`;

const Input = styled.input`
    width: 100%;
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
    width: 100%;
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

const Button = styled.button`
    padding: 10px 20px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease;
    
    &:hover {
        background: #2563eb;
    }
    
    &:disabled {
        background: #9ca3af;
        cursor: not-allowed;
    }
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 40px 20px;
    color: #6b7280;
`;

const LoadingSpinner = styled.div`
    width: 20px;
    height: 20px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

interface PhotoFolder {
    id: number;
    name: string;
    description?: string;
    is_public: boolean;
    order_index: number;
    created_at: string;
    photo_count: number;
}

interface UploadForm {
    folder_id: number;
    title: string;
    description: string;
    image_url: string;
    thumbnail_url: string;
}

export default function PhotoUploadPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    );
    
    // State for photo upload
    const [folders, setFolders] = useState<PhotoFolder[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
    
    // Form states
    const [showFolderForm, setShowFolderForm] = useState(false);
    const [folderForm, setFolderForm] = useState({ name: '', description: '', is_public: true });
    const [photoForm, setPhotoForm] = useState<UploadForm>({
        folder_id: 0,
        title: '',
        description: '',
        image_url: '',
        thumbnail_url: ''
    });

    // Load folders on mount
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.isAdmin && session?.user?.roles?.includes('사진팀')) {
            loadFolders();
        }
    }, [status, session]);

    // Update photo form when folder is selected
    useEffect(() => {
        if (selectedFolder) {
            setPhotoForm(prev => ({ ...prev, folder_id: selectedFolder }));
        }
    }, [selectedFolder]);

    const loadFolders = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/photos/folders');
            const data = await response.json();
            if (response.ok) {
                setFolders(data.folders || []);
                // 첫 번째 폴더를 기본 선택
                if (data.folders && data.folders.length > 0) {
                    setSelectedFolder(data.folders[0].id);
                    setPhotoForm(prev => ({ ...prev, folder_id: data.folders[0].id }));
                }
            } else {
                alert('폴더를 불러오는 데 실패했습니다.');
            }
        } catch (error) {
            console.error('Error loading folders:', error);
            alert('폴더를 불러오는 데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const createFolder = async () => {
        if (!folderForm.name.trim()) {
            alert('폴더명을 입력해주세요.');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/admin/photos/folders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(folderForm),
            });

            const data = await response.json();
            if (response.ok) {
                setFolderForm({ name: '', description: '', is_public: true });
                setShowFolderForm(false);
                await loadFolders();
                alert('폴더가 생성되었습니다.');
            } else {
                alert(data.error || '폴더 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error creating folder:', error);
            alert('폴더 생성에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const uploadPhoto = async () => {
        if (!photoForm.image_url.trim()) {
            alert('사진 링크를 입력해주세요.');
            return;
        }

        if (!photoForm.folder_id) {
            alert('폴더를 선택해주세요.');
            return;
        }

        try {
            setUploading(true);
            const response = await fetch('/api/admin/photos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(photoForm),
            });

            const data = await response.json();
            if (response.ok) {
                setPhotoForm({ 
                    folder_id: selectedFolder || 0, 
                    title: '', 
                    description: '', 
                    image_url: '', 
                    thumbnail_url: ''
                });
                alert('사진이 업로드되었습니다.');
            } else {
                alert(data.error || '사진 업로드에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('사진 업로드에 실패했습니다.');
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        // 인증되지 않았거나, 사진팀 권한이 없는 경우 메인 페이지로 리디렉션
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

    // 로딩 중이거나 권한이 없는 경우
    if (status === 'loading' || !session?.user?.isAdmin || !session?.user?.roles?.includes('사진팀')) {
        return (
            <S.AdminLayout>
                <S.LoadingContainer>
                    <S.LoadingSpinner />
                    <S.LoadingText>Loading...</S.LoadingText>
                </S.LoadingContainer>
            </S.AdminLayout>
        );
    }
    
    const roles = session.user.roles || [];

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
                  <S.NavItem as="a" onClick={() => router.push('/admin')}>
                    <S.NavIcon>🏠</S.NavIcon>
                    {!sidebarCollapsed && <S.NavText>대시보드</S.NavText>}
                  </S.NavItem>
                    
                  <S.NavItem as="a" onClick={() => router.push('/admin/photos')}>
                    <S.NavIcon>📷</S.NavIcon>
                    {!sidebarCollapsed && <S.NavText>사진팀 관리</S.NavText>}
                  </S.NavItem>
                  
                  <S.NavItem active>
                    <S.NavIcon>📸</S.NavIcon>
                    {!sidebarCollapsed && <S.NavText>사진 관리</S.NavText>}
                  </S.NavItem>
                    
                  {(roles.includes('디자인팀') || roles.includes('양육MC')) && (
                    <S.NavItem as="a" onClick={() => router.push('/admin/design')}>
                      <S.NavIcon>🎨</S.NavIcon>
                      {!sidebarCollapsed && <S.NavText>디자인 관리</S.NavText>}
                    </S.NavItem>
                  )}
                  
                  {roles.includes('서기') && (
                    <S.NavItem as="a" onClick={() => router.push('/admin/secretary')}>
                      <S.NavIcon>✍️</S.NavIcon>
                      {!sidebarCollapsed && <S.NavText>서기 관리</S.NavText>}
                    </S.NavItem>
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
                    <S.WelcomeCard>
                        <S.WelcomeTitle>사진 업로드</S.WelcomeTitle>
                        <S.WelcomeSubtitle>
                            폴더를 선택하고 외부 링크로 사진을 업로드하세요.
                        </S.WelcomeSubtitle>
                    </S.WelcomeCard>

                    <UploadContainer>
                        {/* 폴더 관리 섹션 */}
                        <FolderSection>
                            <SectionTitle>
                                📁 사진 폴더
                                {loading && <LoadingSpinner />}
                            </SectionTitle>
                            
                            <AddButton onClick={() => setShowFolderForm(!showFolderForm)}>
                                + 새 폴더 만들기
                            </AddButton>
                            
                            {showFolderForm && (
                                <UploadForm>
                                    <FormGroup>
                                        <Label>폴더명 *</Label>
                                        <Input
                                            type="text"
                                            value={folderForm.name}
                                            onChange={(e) => setFolderForm({...folderForm, name: e.target.value})}
                                            placeholder="폴더명을 입력하세요"
                                        />
                                    </FormGroup>
                                    
                                    <FormGroup>
                                        <Label>설명</Label>
                                        <TextArea
                                            value={folderForm.description}
                                            onChange={(e) => setFolderForm({...folderForm, description: e.target.value})}
                                            placeholder="폴더 설명을 입력하세요"
                                        />
                                    </FormGroup>
                                    
                                    <FormGroup>
                                        <Label>
                                            <input
                                                type="checkbox"
                                                checked={folderForm.is_public}
                                                onChange={(e) => setFolderForm({...folderForm, is_public: e.target.checked})}
                                            />
                                            공개 폴더
                                        </Label>
                                    </FormGroup>
                                    
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                        <Button onClick={createFolder} disabled={loading}>
                                            {loading ? <LoadingSpinner /> : '생성'}
                                        </Button>
                                        <Button 
                                            onClick={() => setShowFolderForm(false)}
                                            style={{ background: '#6b7280' }}
                                        >
                                            취소
                                        </Button>
                                    </div>
                                </UploadForm>
                            )}

                            <FolderList>
                                {folders.map((folder) => (
                                    <FolderItem
                                        key={folder.id}
                                        active={selectedFolder === folder.id}
                                        onClick={() => setSelectedFolder(folder.id)}
                                    >
                                        <FolderName>{folder.name}</FolderName>
                                        <FolderInfo>
                                            {folder.photo_count}개 사진 • {folder.is_public ? '공개' : '비공개'}
                                        </FolderInfo>
                                        <FolderInfo style={{ marginTop: '4px', fontSize: '11px' }}>
                                            {new Date(folder.created_at).toLocaleDateString()}
                                        </FolderInfo>
                                    </FolderItem>
                                ))}
                                
                                {folders.length === 0 && !loading && (
                                    <EmptyState>
                                        <div>📁</div>
                                        <div>폴더가 없습니다</div>
                                    </EmptyState>
                                )}
                            </FolderList>
                        </FolderSection>

                        {/* 사진 업로드 섹션 */}
                        <UploadSection>
                            <SectionTitle>
                                📤 사진 업로드
                                {selectedFolder && (
                                    <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#6b7280' }}>
                                        - {folders.find(f => f.id === selectedFolder)?.name}
                                    </span>
                                )}
                            </SectionTitle>
                            
                            {!selectedFolder ? (
                                <EmptyState>
                                    <div>📁</div>
                                    <div>왼쪽에서 폴더를 선택해주세요</div>
                                </EmptyState>
                            ) : (
                                <UploadForm>
                                    <FormGroup>
                                        <Label>사진 링크 *</Label>
                                        <Input
                                            type="url"
                                            value={photoForm.image_url}
                                            onChange={(e) => setPhotoForm({...photoForm, image_url: e.target.value})}
                                            placeholder="https://example.com/photo.jpg"
                                        />
                                    </FormGroup>
                                    
                                    <FormGroup>
                                        <Label>제목</Label>
                                        <Input
                                            type="text"
                                            value={photoForm.title}
                                            onChange={(e) => setPhotoForm({...photoForm, title: e.target.value})}
                                            placeholder="사진 제목"
                                        />
                                    </FormGroup>
                                    
                                    <FormGroup>
                                        <Label>설명</Label>
                                        <TextArea
                                            value={photoForm.description}
                                            onChange={(e) => setPhotoForm({...photoForm, description: e.target.value})}
                                            placeholder="사진 설명"
                                        />
                                    </FormGroup>

                                    <FormGroup>
                                        <Label>썸네일 링크</Label>
                                        <Input
                                            type="url"
                                            value={photoForm.thumbnail_url}
                                            onChange={(e) => setPhotoForm({...photoForm, thumbnail_url: e.target.value})}
                                            placeholder="https://example.com/thumbnail.jpg"
                                        />
                                    </FormGroup>
                                    
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                        <Button onClick={() => router.push('/admin/photos')} style={{ background: '#6b7280' }}>
                                            취소
                                        </Button>
                                        <Button onClick={uploadPhoto} disabled={uploading}>
                                            {uploading ? <LoadingSpinner /> : '업로드'}
                                        </Button>
                                    </div>
                                </UploadForm>
                            )}
                        </UploadSection>
                    </UploadContainer>
                </S.ContentArea>
            </S.MainContent>
        </S.AdminLayout>
    );
}
