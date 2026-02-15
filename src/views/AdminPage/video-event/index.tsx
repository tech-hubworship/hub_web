import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Eye, Calendar, Video, Image as ImageIcon, X } from 'lucide-react';
import * as S from './style';

import { VideoEventPost } from "@src/lib/video-event/types";
import { VIDEO_EVENT, getVideoEventPath } from "@src/lib/video-event/constants";

export default function VideoEventPostsAdminPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<VideoEventPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<VideoEventPost | null>(null);
  const [formData, setFormData] = useState({
    post_dt: '',
    title: '',
    content: '',
    video_url: '',
    thumbnail_url: '',
  });

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/video-event/posts');
      const data = await response.json();
      if (response.ok) {
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('게시물 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSave = async () => {
    try {
      if (!formData.post_dt || formData.post_dt.length !== 8) {
        alert('날짜는 YYYYMMDD 형식으로 입력해주세요.');
        return;
      }

      if (!formData.title.trim()) {
        alert('제목을 입력해주세요.');
        return;
      }

      const url = editingPost 
        ? `/api/admin/video-event/posts/${editingPost.post_dt}`
        : '/api/admin/video-event/posts';
      
      const method = editingPost ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // 클라이언트 캐시 무효화: revalidateTag API를 호출하여 클라이언트 fetch 캐시 무효화
        try {
          await fetch('/api/video-event/revalidate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tags: [VIDEO_EVENT.CACHE_TAG_POSTS, VIDEO_EVENT.CACHE_TAG_POSTS_LIST],
            }),
          });
        } catch (cacheError) {
          console.warn('캐시 무효화 실패 (무시됨):', cacheError);
        }
        
        setShowModal(false);
        setEditingPost(null);
        setFormData({
          post_dt: '',
          title: '',
          content: '',
          video_url: '',
          thumbnail_url: '',
        });
        fetchPosts();
      } else {
        const data = await response.json();
        alert(data.error || '게시물 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('게시물 저장 오류:', error);
      alert('게시물 저장에 실패했습니다.');
    }
  };

  const handleDelete = async (postDt: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/video-event/posts/${postDt}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // ✅ 클라이언트 → 서버 API → revalidateTag() 호출 구조
        // 클라이언트에서는 revalidateTag()를 직접 호출할 수 없으므로
        // 서버 Route Handler를 통해 간접적으로 호출합니다.
        try {
          await fetch('/api/video-event/revalidate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tags: [VIDEO_EVENT.CACHE_TAG_POSTS, VIDEO_EVENT.CACHE_TAG_POSTS_LIST], // unstable_cache에서 지정한 태그
            }),
          });
        } catch (cacheError) {
          console.warn('캐시 무효화 실패 (무시됨):', cacheError);
        }
        
        fetchPosts();
      } else {
        const data = await response.json();
        alert(data.error || '게시물 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('게시물 삭제 오류:', error);
      alert('게시물 삭제에 실패했습니다.');
    }
  };

  const handleEdit = (post: VideoEventPost) => {
    setEditingPost(post);
    setFormData({
      post_dt: post.post_dt,
      title: post.title,
      content: post.content || '',
      video_url: post.video_url || '',
      thumbnail_url: post.thumbnail_url || '',
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingPost(null);
    // 한국 시간 기준 현재 날짜
    const now = new Date();
    const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const koreanDateStr = koreanTime.toISOString().slice(0, 10).replace(/-/g, '');
    setFormData({
      post_dt: koreanDateStr,
      title: '',
      content: '',
      video_url: '',
      thumbnail_url: '',
    });
    setShowModal(true);
  };

  const formatDate = (dateStr: string) => {
    if (dateStr.length !== 8) return dateStr;
    return `${dateStr.slice(0, 4)}년 ${dateStr.slice(4, 6)}월 ${dateStr.slice(6, 8)}일`;
  };

  if (loading) {
    return (
      <S.Container>
        <S.LoadingState>
          <S.Spinner />
          <S.EmptyText>로딩 중...</S.EmptyText>
        </S.LoadingState>
      </S.Container>
    );
  }

  return (
    <S.Container>
      <S.Header>
        <S.HeaderLeft>
          <S.Title>{VIDEO_EVENT.DISPLAY_NAME_POSTS}</S.Title>
          <S.Subtitle>날짜별 게시물을 관리합니다</S.Subtitle>
        </S.HeaderLeft>
        <S.Button variant="primary" onClick={handleAdd}>
          <Plus size={18} />
          게시물 추가
        </S.Button>
      </S.Header>

      {posts.length === 0 ? (
        <S.EmptyState>
          <S.EmptyIcon>📭</S.EmptyIcon>
          <S.EmptyText>등록된 게시물이 없습니다</S.EmptyText>
        </S.EmptyState>
      ) : (
        <S.TableContainer>
          <S.Table>
            <S.TableHeader>
              <tr>
                <S.TableHead>날짜</S.TableHead>
                <S.TableHead>제목</S.TableHead>
                <S.TableHead>미디어</S.TableHead>
                <S.TableHead>등록일시</S.TableHead>
                <S.TableHead>작업</S.TableHead>
              </tr>
            </S.TableHeader>
            <tbody>
              {posts.map((post) => (
                <S.TableRow key={post.post_dt}>
                  <S.TableData>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={16} color="#64748b" />
                      {formatDate(post.post_dt)}
                    </div>
                  </S.TableData>
                  <S.TableData>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                      {post.title}
                    </div>
                  </S.TableData>
                  <S.TableData>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {post.video_url && (
                        <S.Badge color="blue">
                          <Video size={12} style={{ marginRight: '4px' }} />
                          영상
                        </S.Badge>
                      )}
                      {post.thumbnail_url && (
                        <S.Badge color="green">
                          <ImageIcon size={12} style={{ marginRight: '4px' }} />
                          이미지
                        </S.Badge>
                      )}
                      {!post.video_url && !post.thumbnail_url && (
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>없음</span>
                      )}
                    </div>
                  </S.TableData>
                  <S.TableData>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>
                      {new Date(post.reg_dt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
                    </span>
                  </S.TableData>
                  <S.TableData>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <S.ActionButton onClick={() => router.push(`${getVideoEventPath()}?date=${post.post_dt}`)}>
                        <Eye size={16} style={{ marginRight: '4px' }} />
                        보기
                      </S.ActionButton>
                      <S.ActionButton onClick={() => handleEdit(post)}>
                        <Edit size={16} style={{ marginRight: '4px' }} />
                        수정
                      </S.ActionButton>
                      <S.ActionButton 
                        onClick={() => handleDelete(post.post_dt)}
                        style={{ color: '#ef4444', borderColor: '#fee2e2' }}
                      >
                        <Trash2 size={16} style={{ marginRight: '4px' }} />
                        삭제
                      </S.ActionButton>
                    </div>
                  </S.TableData>
                </S.TableRow>
              ))}
            </tbody>
          </S.Table>
        </S.TableContainer>
      )}

      {showModal && (
        <S.Modal onClick={() => setShowModal(false)}>
          <S.ModalContent onClick={(e) => e.stopPropagation()}>
            <S.ModalHeader>
              <S.ModalTitle>{editingPost ? '게시물 수정' : '게시물 추가'}</S.ModalTitle>
              <S.CloseButton onClick={() => setShowModal(false)}>
                <X size={20} />
              </S.CloseButton>
            </S.ModalHeader>
            
            <S.FormGroup>
              <S.Label>날짜 (YYYYMMDD) *</S.Label>
              <S.Input
                type="text"
                value={formData.post_dt}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 8) {
                    setFormData({ ...formData, post_dt: value });
                  }
                }}
                placeholder="20241225"
                maxLength={8}
                required
                disabled={!!editingPost}
              />
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {formData.post_dt.length === 8 && (
                  <span style={{ color: '#10b981' }}>
                    {formatDate(formData.post_dt)}
                  </span>
                )}
              </div>
            </S.FormGroup>

            <S.FormGroup>
              <S.Label>제목 *</S.Label>
              <S.Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="게시물 제목"
                maxLength={200}
                required
              />
            </S.FormGroup>

            <S.FormGroup>
              <S.Label>내용</S.Label>
              <S.TextArea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="게시물 내용"
                rows={6}
              />
            </S.FormGroup>

            <S.FormGroup>
              <S.Label>유튜브 URL</S.Label>
              <S.Input
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </S.FormGroup>

            <S.FormGroup>
              <S.Label>썸네일 이미지 URL</S.Label>
              <S.Input
                type="url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                placeholder="https://..."
              />
            </S.FormGroup>

            <S.ButtonGroup>
              <S.Button variant="secondary" onClick={() => setShowModal(false)}>
                취소
              </S.Button>
              <S.Button variant="primary" onClick={handleSave}>
                저장
              </S.Button>
            </S.ButtonGroup>
          </S.ModalContent>
        </S.Modal>
      )}
    </S.Container>
  );
}


