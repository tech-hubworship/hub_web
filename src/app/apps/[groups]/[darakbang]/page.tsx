/** @jsxImportSource @emotion/react */
'use client';

import React, { useEffect, useState } from 'react';
import { css } from '@emotion/react';
import { createClient } from '@supabase/supabase-js';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Header } from '@src/components/Header';

const Footer = dynamic(() => import('@src/components/Footer'), { ssr: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const getKstDate = (date: Date = new Date()) => {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (9 * 3600000));
};

const getKstString = (dateString: string) => {
  const d = new Date(dateString);
  const kst = new Date(d.getTime() + (9 * 3600000));
  return kst.toISOString();
};

type Comment = {
  id: string;
  author: string;
  text: string;
  created_at: string;
};

type Prayer = {
  id: string;
  created_at: string;
  user_id: string;
  member_name: string;
  category: string;
  prayer_topic: string;
  is_answered: boolean;
  answer_text: string | null;
  intercessors: string[];
  comments: Comment[];
};

type Sharing = {
  id: string;
  created_at: string;
  user_id: string;
  member_name: string;
  category: string;
  content: string;
  likes: string[];
  comments: Comment[];
};

const mapPrayerData = (data: any[]): Prayer[] => data.map(p => ({
  ...p,
  intercessors: p.darakbang_prayer_intercessors ? p.darakbang_prayer_intercessors.map((i: any) => i.intercessor_name) : [],
  comments: p.darakbang_prayer_comments ? p.darakbang_prayer_comments.map((c: any) => ({ ...c, author: c.author_name })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) : []
}));

const mapSharingData = (data: any[]): Sharing[] => data.map(s => ({
  ...s,
  likes: s.darakbang_sharing_likes ? s.darakbang_sharing_likes.map((l: any) => l.liker_name) : [],
  comments: s.darakbang_sharing_comments ? s.darakbang_sharing_comments.map((c: any) => ({ ...c, author: c.author_name })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) : []
}));

const CATEGORIES = ['중보기도', '오늘의 기도', '이번주 기도', '이번달 기도'];
const SHARING_CATEGORIES = ['주일말씀', '큐티나눔', '감사일기', '일상나눔'];
const PAGE_SIZE = 6;

export default function DarakbangPage({ params }: { params: Promise<{ groups: string; darakbang: string }> }) {
  const unwrappedParams = React.use(params);
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  type UserProfile = {
    cell_id: number;
    group_id: number;
    name: string;
    cell_name: string;
    responsible_group_id: number | null;
    responsible_cell_id: number | null;
    is_sunjang?: boolean;
  };

  // 권한(Role) 판별용 프로필 상태
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [darakbangMembers, setDarakbangMembers] = useState<{ name: string; birth_date: string | null }[]>([]);
  const [sunjangs, setSunjangs] = useState<{ name: string; is_cell_leader: boolean; is_group_leader: boolean }[]>([]);

  const [prayers, setPrayers] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [newTopic, setNewTopic] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false); // 익명 기도 상태
  const [filter, setFilter] = useState('전체');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // UI 상태 추가 (최적화)
  const [isWritingPrayer, setIsWritingPrayer] = useState(false);
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isWritingSharing, setIsWritingSharing] = useState(false);

  // 나눔 상태
  const [sharings, setSharings] = useState<Sharing[]>([]);
  const [newSharingCategory, setNewSharingCategory] = useState(SHARING_CATEGORIES[0]);
  const [newSharingContent, setNewSharingContent] = useState('');
  const [sharingFilter, setSharingFilter] = useState('전체');
  const [sharingPage, setSharingPage] = useState(1);
  const [sharingTotalCount, setSharingTotalCount] = useState(0);
  const [isSharingLoading, setIsSharingLoading] = useState(false);

  // 탭 상태 (main: 기도나누기, recap: 월별모아보기, person: 식구별 보기, sharing: 나눔공간)
  const [activeTab, setActiveTab] = useState<'main' | 'recap' | 'person' | 'sharing'>('main');
  const [recapMonth, setRecapMonth] = useState('');
  const [selectedRecapDate, setSelectedRecapDate] = useState<string | null>(null);
  const [recapPage, setRecapPage] = useState(1);

  // 순장님별 보기 전용 상태
  const [selectedPerson, setSelectedPerson] = useState('');
  const [personMonth, setPersonMonth] = useState('');
  const [personPage, setPersonPage] = useState(1);
  const profileFetchedRef = React.useRef(false);

  // 1-2. 페이지네이션 등 데이터 캐싱 (5분 TTL)
  const prayersCacheRef = React.useRef<Record<string, { data: Prayer[], count: number, ts: number }>>({});
  const sharingsCacheRef = React.useRef<Record<string, { data: Sharing[], count: number, ts: number }>>({});
  const allContentCacheRef = React.useRef<{ data: any[], ts: number } | null>(null);
  const CACHE_TTL = 5 * 60 * 1000;

  const invalidateCache = () => {
    prayersCacheRef.current = {};
    sharingsCacheRef.current = {};
    allContentCacheRef.current = null;
  };

  // 프로필 + 멤버 sessionStorage 캐시 (15분 TTL)
  const PROFILE_CACHE_KEY = `darakbang_profile_${unwrappedParams.groups}_${unwrappedParams.darakbang}`;
  const PROFILE_CACHE_TTL = 15 * 60 * 1000;

  // 현재 유저의 프로필(셀, 그룹) 정보 가져오기
  const fetchUserProfile = async () => {
    try {
      // 1) sessionStorage 캐시 확인
      if (typeof window !== 'undefined') {
        const raw = sessionStorage.getItem(PROFILE_CACHE_KEY);
        if (raw) {
          const { data, ts } = JSON.parse(raw);
          if (Date.now() - ts < PROFILE_CACHE_TTL) {
            // 캐시 적중: API 호출 없이 바로 상태 복원
            const { profile, members, sunjangs: cachedSunjangs } = data;
            setUserProfile(profile);
            setDarakbangMembers(members);
            if (cachedSunjangs && cachedSunjangs.length > 0) {
              setSunjangs(cachedSunjangs);
              setSelectedPerson(cachedSunjangs[0].name);
            } else if (members.length > 0) {
              setSelectedPerson(members[0].name);
            }
            return;
          }
        }
      }

      // 2) 캐시 미스: API 호출
      const res = await fetch("/api/user/profile");
      const result = await res.json();

      if (!res.ok || !result) return;

      const { group_id, cell_id, name, group_name, cell_name, is_sunjang } = result;

      // 1) 권한 검사: 새가족 그룹(group_id === 5)이면서 리더십(순장, 다락방장)이 아니면 무조건 접근 차단 후 홈으로 리다이렉트
      const isLeadership = result?.responsible_cell_id !== null || result?.responsible_group_id !== null || is_sunjang === true;
      const isSaebonManager = name === '김수진';

      if (!isSaebonManager && (group_id !== 5 || !isLeadership)) {
        router.replace('/');
        return;
      }

      // 2) 파라미터 유효성 검사 (사용자가 자기 자신 소속 다락방이 아닌 곳 접근 시 자기 다락방으로 리다이렉트)
      const urlGroupName = decodeURIComponent(unwrappedParams.groups);
      const urlCellName = decodeURIComponent(unwrappedParams.darakbang);

      if (isSaebonManager && urlGroupName === '새가족' && urlCellName === '새본') {
        // 새본 담당자 프리패스
      } else if (group_name !== urlGroupName || cell_name !== urlCellName) {
        if (group_name && cell_name && group_id !== 7 && cell_id !== 26 && cell_id !== 99) {
          router.replace(`/apps/${encodeURIComponent(group_name)}/${encodeURIComponent(cell_name)}`);
        } else {
          router.replace('/');
        }
        return;
      }

      const { responsible_group_id, responsible_cell_id } = result;
      const profile = {
        cell_id: (isSaebonManager && urlGroupName === '새가족' && urlCellName === '새본') ? 25 : cell_id,
        group_id: (isSaebonManager && urlGroupName === '새가족' && urlCellName === '새본') ? 5 : group_id,
        name,
        cell_name: (isSaebonManager && urlGroupName === '새가족' && urlCellName === '새본') ? '새본' : (cell_name || ''),
        responsible_group_id: responsible_group_id || null,
        responsible_cell_id: responsible_cell_id || null,
        is_sunjang: is_sunjang || false
      };

      setUserProfile(profile);

      // 멤버 목록 조회 (생일 배너용)
      const targetCellId = profile.cell_id;
      const { data: membersData, error: membersError } = await supabase
        .from('profiles')
        .select('name, birth_date')
        .eq('cell_id', targetCellId);

      const members = (!membersError && membersData) ? membersData : [];
      setDarakbangMembers(members);

      // 순장 목록 조회: /api/darakbang/sunjangs (supabaseAdmin, RLS 우회)
      const sunjangsRes = await fetch(`/api/darakbang/sunjangs?cell_id=${targetCellId}`);
      const sunjangsJson = sunjangsRes.ok ? await sunjangsRes.json() : { sunjangs: [] };
      const filteredSunjangs: { name: string; is_cell_leader: boolean; is_group_leader: boolean }[] = sunjangsJson.sunjangs || [];
      setSunjangs(filteredSunjangs);
      if (filteredSunjangs.length > 0) setSelectedPerson(filteredSunjangs[0].name);
      else if (members.length > 0) setSelectedPerson(members[0].name);

      // 3) 결과 캐싱
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
          data: { profile, members, sunjangs: filteredSunjangs },
          ts: Date.now(),
        }));
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login?redirect=/apps");
      return;
    }

    if (sessionStatus === "authenticated" && session?.user && !profileFetchedRef.current) {
      profileFetchedRef.current = true;
      fetchUserProfile();
    }
  }, [sessionStatus, session]);

  useEffect(() => {
    if (session && userProfile) {
      if (activeTab === 'main') {
        fetchPrayers(1);
      } else if (activeTab === 'sharing') {
        fetchSharings(1);
      } else {
        fetchAllContent(false);
      }
    }
  }, [session, userProfile, activeTab, filter, sharingFilter]);

  useEffect(() => {
    if (session && userProfile && activeTab === 'main') {
      fetchPrayers(currentPage);
    }
  }, [currentPage]);

  useEffect(() => {
    if (session && userProfile && activeTab === 'sharing') {
      fetchSharings(sharingPage);
    }
  }, [sharingPage]);

  const fetchAllContent = async (force: boolean = false) => {
    if (!userProfile) return;

    if (!force && allContentCacheRef.current && (Date.now() - allContentCacheRef.current.ts < CACHE_TTL)) {
      const data = allContentCacheRef.current.data;
      setPrayers(data);
      if (data.length > 0) {
        const latestMonth = getKstString(data[0].created_at).substring(0, 7);
        if (!recapMonth) setRecapMonth(latestMonth);
        if (!personMonth) setPersonMonth(latestMonth);
      }
      return;
    }

    const [prayersRes, sharingsRes] = await Promise.all([
      supabase
        .from('darakbang_prayers')
        .select('*, darakbang_prayer_intercessors(intercessor_name), darakbang_prayer_comments(id, author_name, text, created_at)')
        .eq('cell_id', userProfile.cell_id),
      supabase
        .from('darakbang_sharings')
        .select('*, darakbang_sharing_likes(liker_name), darakbang_sharing_comments(id, author_name, text, created_at)')
        .eq('cell_id', userProfile.cell_id)
    ]);

    if (prayersRes.error || sharingsRes.error) {
      console.error('Error fetching all content:', prayersRes.error || sharingsRes.error);
    } else {
      const pMapped = prayersRes.data ? mapPrayerData(prayersRes.data).map(p => ({ ...p, type: 'prayer' })) : [];
      const sMapped = sharingsRes.data ? mapSharingData(sharingsRes.data).map(s => ({ ...s, type: 'sharing' })) : [];
      const combined = [...pMapped, ...sMapped].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPrayers(combined);
      allContentCacheRef.current = { data: combined, ts: Date.now() };
      // 리캡 및 인물별 보기 초기 달 설정
      if (combined.length > 0) {
        const latestMonth = getKstString(combined[0].created_at).substring(0, 7);
        if (!recapMonth) setRecapMonth(latestMonth);
        if (!personMonth) setPersonMonth(latestMonth);
      }
    }
  };

  const fetchPrayers = async (page: number = 1, force: boolean = false) => {
    if (!userProfile) return;

    const cacheKey = `${filter}_${page}`;
    if (!force && prayersCacheRef.current[cacheKey] && (Date.now() - prayersCacheRef.current[cacheKey].ts < CACHE_TTL)) {
      const cached = prayersCacheRef.current[cacheKey];
      setPrayers(cached.data);
      setTotalCount(cached.count);
      setCurrentPage(page);
      return;
    }

    setIsLoadingMore(true);
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    let query = supabase
      .from('darakbang_prayers')
      .select('*, darakbang_prayer_intercessors(intercessor_name), darakbang_prayer_comments(id, author_name, text, created_at)', { count: 'exact' })
      .eq('cell_id', userProfile.cell_id) // 우리 다락방만
      .order('created_at', { ascending: false });

    if (filter !== '전체') {
      query = query.eq('category', filter);

      const kstNow = getKstDate();
      if (filter === '오늘의 기도') {
        const todayStr = kstNow.toISOString().split('T')[0];
        query = query.gte('created_at', `${todayStr}T00:00:00+09:00`);
      } else if (filter === '이번주 기도') {
        const day = kstNow.getDay();
        const diff = kstNow.getDate() - day;
        const sunday = new Date(kstNow);
        sunday.setDate(diff);
        const sundayStr = sunday.toISOString().split('T')[0];
        query = query.gte('created_at', `${sundayStr}T00:00:00+09:00`);
      } else if (filter === '이번달 기도') {
        const monthFirstStr = `${kstNow.getFullYear()}-${String(kstNow.getMonth() + 1).padStart(2, '0')}-01`;
        query = query.gte('created_at', `${monthFirstStr}T00:00:00+09:00`);
      }
    }

    const { data, error, count } = await query.range(start, end);

    if (error) {
      console.error('Error fetching prayers:', error);
    } else {
      const mapped = data ? mapPrayerData(data) : [];
      setPrayers(mapped);
      setTotalCount(count || 0);
      setCurrentPage(page);
      prayersCacheRef.current[cacheKey] = { data: mapped, count: count || 0, ts: Date.now() };
    }
    setIsLoadingMore(false);
  };

  const fetchSharings = async (page: number = 1, force: boolean = false) => {
    if (!userProfile) return;

    const cacheKey = `${sharingFilter}_${page}`;
    if (!force && sharingsCacheRef.current[cacheKey] && (Date.now() - sharingsCacheRef.current[cacheKey].ts < CACHE_TTL)) {
      const cached = sharingsCacheRef.current[cacheKey];
      setSharings(cached.data);
      setSharingTotalCount(cached.count);
      setSharingPage(page);
      return;
    }

    setIsSharingLoading(true);
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    let query = supabase
      .from('darakbang_sharings')
      .select('*, darakbang_sharing_likes(liker_name), darakbang_sharing_comments(id, author_name, text, created_at)', { count: 'exact' })
      .eq('cell_id', userProfile.cell_id) // 우리 다락방만
      .order('created_at', { ascending: false });

    if (sharingFilter !== '전체') {
      query = query.eq('category', sharingFilter);
    }

    const { data, error, count } = await query.range(start, end);

    if (error) {
      console.error('Error fetching sharings:', error);
    } else {
      const mapped = data ? mapSharingData(data) : [];
      setSharings(mapped);
      setSharingTotalCount(count || 0);
      setSharingPage(page);
      sharingsCacheRef.current[cacheKey] = { data: mapped, count: count || 0, ts: Date.now() };
    }
    setIsSharingLoading(false);
  };

  const refreshContent = async () => {
    invalidateCache();
    if (activeTab === 'main') {
      await fetchPrayers(currentPage, true);
    } else {
      await fetchAllContent(true);
    }
  };

  const handleSignOut = async () => {
    // NextAuth requires a different signout process, but since this app is integrated, 
    // users should logout from the main router, not here.
    router.push('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim() || !session?.user?.id || !userProfile) return;

    const userName = isAnonymous ? '주님의 어린양' : userProfile.name;

    const { error } = await supabase
      .from('darakbang_prayers')
      .insert([{
        user_id: session.user.id,
        member_name: userName,
        category: newCategory,
        prayer_topic: newTopic,
        cell_id: userProfile.cell_id,
        group_id: userProfile.group_id
      }]);

    if (error) console.error('Error inserting prayer:', error);
    else {
      setNewTopic('');
      setIsAnonymous(false);
      setIsWritingPrayer(false); // 작성 후 모달 닫기
      invalidateCache();
      fetchPrayers(1, true);
    }
  };

  const handleSubmitSharing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSharingContent.trim() || !session?.user?.id || !userProfile) return;

    const userName = userProfile.name;

    const { error } = await supabase
      .from('darakbang_sharings')
      .insert([{
        user_id: session.user.id,
        member_name: userName,
        category: newSharingCategory,
        content: newSharingContent,
        cell_id: userProfile.cell_id,
        group_id: userProfile.group_id
      }]);

    if (error) console.error('Error inserting sharing:', error);
    else {
      setNewSharingContent('');
      setIsWritingSharing(false);
      invalidateCache();
      fetchSharings(1, true);
    }
  };

  const handleUpdatePrayer = async (prayerId: string, newTopic: string) => {
    if (!session || !newTopic.trim()) return;

    // 낙관적 업데이트
    setPrayers(prev => prev.map(p => p.id === prayerId ? { ...p, prayer_topic: newTopic.trim() } : p));
    invalidateCache();

    const { error } = await supabase.from('darakbang_prayers').update({ prayer_topic: newTopic.trim() }).eq('id', prayerId);
    if (error) {
      console.error('Error updating prayer:', error);
      refreshContent();
    }
  };

  const handleIntercede = async (prayer: Prayer) => {
    if (!session || !session.user) return;
    const userName = session.user.name || '순장님';
    const isAdding = !prayer.intercessors.includes(userName);

    if (!isAdding) {
      const confirmCancel = window.confirm("중보 기도를 취소하시겠습니까?");
      if (!confirmCancel) return;
    }

    const updatedIntercessors = isAdding
      ? [...prayer.intercessors, userName]
      : prayer.intercessors.filter(name => name !== userName);

    // 낙관적 업데이트: 로컬 상태를 즉시 반영
    setPrayers(prev => prev.map(p => p.id === prayer.id ? { ...p, intercessors: updatedIntercessors } : p));
    invalidateCache();

    let error;
    if (isAdding) {
      const res = await supabase.from('darakbang_prayer_intercessors').insert({ prayer_id: prayer.id, user_id: session.user.id, intercessor_name: userName });
      error = res.error;
    } else {
      const res = await supabase.from('darakbang_prayer_intercessors').delete().match({ prayer_id: prayer.id, user_id: session.user.id });
      error = res.error;
    }

    if (error) {
      console.error('Error interceding:', error);
      refreshContent(); // 에러 발생 시 원래 상태로 복구하기 위해 새로고침
    }
  };

  const handleAnswerToggle = async (prayer: Prayer) => {
    let updatePayload: { is_answered: boolean; answer_text: string | null };
    if (prayer.is_answered) {
      const confirmCancel = window.confirm("응답 상태를 취소하시겠습니까?");
      if (!confirmCancel) return;
      updatePayload = { is_answered: false, answer_text: null };
    } else {
      const answerText = window.prompt("하나님께서 주신 아름다운 응답을 나누어주세요 🌷:");
      if (answerText === null) return;
      updatePayload = { is_answered: true, answer_text: answerText };
    }

    // 낙관적 업데이트
    setPrayers(prev => prev.map(p => p.id === prayer.id ? { ...p, ...updatePayload } : p));
    invalidateCache();

    const { error } = await supabase.from('darakbang_prayers').update(updatePayload).eq('id', prayer.id);
    if (error) {
      console.error('Error toggling answer:', error);
      refreshContent();
    }
  };

  const handleAddComment = async (prayerId: string, text: string) => {
    if (!session || !session.user || !text.trim()) return;
    const userName = session.user.name || '순장님';
    const prayer = prayers.find(p => p.id === prayerId);
    if (!prayer) return;

    const newComment: Comment = {
      id: crypto.randomUUID(),
      author: userName,
      text: text.trim(),
      created_at: new Date().toISOString()
    };

    const updatedComments = [...(prayer.comments || []), newComment];

    // 낙관적 업데이트
    setPrayers(prev => prev.map(p => p.id === prayerId ? { ...p, comments: updatedComments } : p));
    invalidateCache();

    const { error } = await supabase.from('darakbang_prayer_comments').insert({
      id: newComment.id,
      prayer_id: prayerId,
      user_id: session.user.id,
      author_name: userName,
      text: text.trim()
    });
    if (error) {
      console.error('Error adding comment:', error);
      refreshContent();
    }
  };

  const handleUpdateComment = async (prayerId: string, commentId: string, text: string) => {
    if (!session || !text.trim()) return;
    const prayer = prayers.find(p => p.id === prayerId);
    if (!prayer) return;

    const updatedComments = (prayer.comments || []).map((c: any) =>
      c.id === commentId ? { ...c, text: text.trim() } : c
    );

    // 낙관적 업데이트
    setPrayers(prev => prev.map(p => p.id === prayerId ? { ...p, comments: updatedComments } : p));
    invalidateCache();

    const { error } = await supabase.from('darakbang_prayer_comments').update({ text: text.trim() }).eq('id', commentId);
    if (error) {
      console.error('Error updating comment:', error);
      refreshContent();
    }
  };

  const handleDeleteComment = async (prayerId: string, commentId: string) => {
    if (!session) return;
    const prayer = prayers.find(p => p.id === prayerId);
    if (!prayer) return;

    const confirmDelete = window.confirm("댓글을 삭제하시겠습니까?");
    if (!confirmDelete) return;

    const updatedComments = (prayer.comments || []).filter((c: any) => c.id !== commentId);

    // 낙관적 업데이트
    setPrayers(prev => prev.map(p => p.id === prayerId ? { ...p, comments: updatedComments } : p));
    invalidateCache();

    const { error } = await supabase.from('darakbang_prayer_comments').delete().eq('id', commentId);
    if (error) {
      console.error('Error deleting comment:', error);
      refreshContent();
    }
  };

  const handleUpdateSharing = async (sharingId: string, newContent: string) => {
    if (!session || !newContent.trim()) return;
    setSharings(prev => prev.map(p => p.id === sharingId ? { ...p, content: newContent.trim() } : p));
    setPrayers(prev => prev.map(p => p.id === sharingId ? { ...p, content: newContent.trim() } : p));
    invalidateCache();
    const { error } = await supabase.from('darakbang_sharings').update({ content: newContent.trim() }).eq('id', sharingId);
    if (error) { console.error('Error updating sharing:', error); refreshContent(); }
  };

  const handleDeleteSharing = async (sharingId: string) => {
    if (!session) return;
    const confirmDelete = window.confirm("나눔 글을 삭제하시겠습니까?");
    if (!confirmDelete) return;
    setSharings(prev => prev.filter(p => p.id !== sharingId));
    setPrayers(prev => prev.filter(p => p.id !== sharingId));
    invalidateCache();
    const { error } = await supabase.from('darakbang_sharings').delete().eq('id', sharingId);
    if (error) { console.error('Error deleting sharing:', error); refreshContent(); }
  };

  const handleLikeSharing = async (sharing: Sharing) => {
    if (!session || !session.user) return;
    const userName = session.user.name || '순장님';
    const isAdding = !sharing.likes.includes(userName);

    const updatedLikes = isAdding ? [...sharing.likes, userName] : sharing.likes.filter(name => name !== userName);
    setSharings(prev => prev.map(p => p.id === sharing.id ? { ...p, likes: updatedLikes } : p));
    setPrayers(prev => prev.map(p => p.id === sharing.id ? { ...p, likes: updatedLikes } : p));
    invalidateCache();

    let error;
    if (isAdding) {
      const res = await supabase.from('darakbang_sharing_likes').insert({ sharing_id: sharing.id, user_id: session.user.id, liker_name: userName });
      error = res.error;
    } else {
      const res = await supabase.from('darakbang_sharing_likes').delete().match({ sharing_id: sharing.id, user_id: session.user.id });
      error = res.error;
    }
    if (error) { console.error('Error liking:', error); refreshContent(); }
  };

  const handleAddSharingComment = async (sharingId: string, text: string) => {
    if (!session || !session.user || !text.trim()) return;
    const userName = session.user.name || '순장님';
    const sharing = sharings.find(p => p.id === sharingId) || prayers.find(p => p.id === sharingId);
    if (!sharing) return;
    const newComment: Comment = { id: crypto.randomUUID(), author: userName, text: text.trim(), created_at: new Date().toISOString() };
    const updatedComments = [...(sharing.comments || []), newComment];
    setSharings(prev => prev.map(p => p.id === sharingId ? { ...p, comments: updatedComments } : p));
    setPrayers(prev => prev.map(p => p.id === sharingId ? { ...p, comments: updatedComments } : p));
    invalidateCache();

    const { error } = await supabase.from('darakbang_sharing_comments').insert({
      id: newComment.id, sharing_id: sharingId, user_id: session.user.id, author_name: userName, text: text.trim()
    });
    if (error) { console.error('Error adding comment:', error); refreshContent(); }
  };

  const handleUpdateSharingComment = async (sharingId: string, commentId: string, text: string) => {
    if (!session || !text.trim()) return;
    const sharing = sharings.find(p => p.id === sharingId) || prayers.find(p => p.id === sharingId);
    if (!sharing) return;
    const updatedComments = (sharing.comments || []).map((c: any) => c.id === commentId ? { ...c, text: text.trim() } : c);
    setSharings(prev => prev.map(p => p.id === sharingId ? { ...p, comments: updatedComments } : p));
    setPrayers(prev => prev.map(p => p.id === sharingId ? { ...p, comments: updatedComments } : p));
    const { error } = await supabase.from('darakbang_sharing_comments').update({ text: text.trim() }).eq('id', commentId);
    if (error) { console.error('Error updating comment:', error); refreshContent(); }
  };

  const handleDeleteSharingComment = async (sharingId: string, commentId: string) => {
    if (!session) return;
    const sharing = sharings.find(p => p.id === sharingId) || prayers.find(p => p.id === sharingId);
    if (!sharing) return;
    const confirmDelete = window.confirm("댓글을 삭제하시겠습니까?");
    if (!confirmDelete) return;
    const updatedComments = (sharing.comments || []).filter((c: any) => c.id !== commentId);
    setSharings(prev => prev.map(p => p.id === sharingId ? { ...p, comments: updatedComments } : p));
    setPrayers(prev => prev.map(p => p.id === sharingId ? { ...p, comments: updatedComments } : p));
    const { error } = await supabase.from('darakbang_sharing_comments').delete().eq('id', commentId);
    if (error) { console.error('Error deleting comment:', error); refreshContent(); }
  };

  if (sessionStatus === "loading" || !userProfile) {
    return <div css={css`min-height: 100vh; background-color: #fffbf7; display: flex; align-items: center; justify-content: center; color: #fda4af; font-size: 15px; font-family: var(--font-wanted);`}>잠시만 기다려주세요... 🌸</div>;
  }

  // 새가족 그룹(group_id=5) 그룹장/순장 리더십이 아닌 경우 접근 차단 (UI 렌더링 전 방어)
  const isLeadership = userProfile.responsible_cell_id !== null || userProfile.responsible_group_id !== null || userProfile.is_sunjang === true;
  const isSaebonManager = userProfile.name === '김수진';
  if (!isSaebonManager && (userProfile.group_id !== 5 || !isLeadership)) {
    router.replace('/');
    return <div css={css`min-height: 100vh; background-color: #fffbf7; display: flex; align-items: center; justify-content: center; color: #fda4af; font-size: 15px; font-family: var(--font-wanted);`}>권한 확인 중... 🌸</div>;
  }

  // 비로그인 화면 (본진 통합 시 불필요하나, 로컬 개발을 위한 최소한의 폼)
  if (!session) {
    return (
      <div css={css`min-height: 100vh; background-color: #fdfbf7; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px; font-family: var(--font-wanted); color: #292524;`}>
        <div css={css`background-color: white; padding: 32px; border-radius: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); border: 1px solid #f5f5f4; max-width: 384px; width: 100%; text-align: center;`}>
          <h1 css={css`font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #292524;`}>허브워십 로그인 필요</h1>
          <p css={css`color: #78716c; font-size: 14px; margin-bottom: 24px;`}>로그인 페이지로 이동 중입니다...</p>
        </div>
      </div>
    );
  }

  const currentUserFullName = session?.user?.name || '순장님';

  // 오늘 생일인 사람 찾기 (KST 기준)
  const todayKst = getKstDate();
  const todayMonthDay = `${String(todayKst.getMonth() + 1).padStart(2, '0')}-${String(todayKst.getDate()).padStart(2, '0')}`;
  const birthdayPeople = darakbangMembers
    .filter(member => member.birth_date && member.birth_date.substring(5, 10) === todayMonthDay)
    .map(member => member.name);

  // 메인 탭에서는 fetchPrayers에서 이미 필터링된 데이터를 받으므로 local filter skip 가능
  // 다만 리캡이나 인물별 탭은 전체 데이터에서 필터링
  const mainPrayers = prayers;
  const filteredPrayers = filter === '전체' ? prayers : prayers.filter(p => p.category === filter);
  const availableMonths = Array.from(new Set(prayers.map(p => getKstString(p.created_at).substring(0, 7)))).sort().reverse();

  // 리캡(전체) 필터
  const recapPrayers = prayers.filter(p => getKstString(p.created_at).substring(0, 7) === recapMonth);
  // 순장님별 필터
  const personPrayers = prayers.filter(p => p.member_name === selectedPerson && getKstString(p.created_at).substring(0, 7) === personMonth);

  return (
    <>
      <Header />
      <div css={css`min-height: 100vh; background-color: #f5f5f4; font-family: var(--font-wanted); color: #292524; display: flex; justify-content: center; align-items: flex-start; padding-top: 60px; @media (min-width: 940px) { padding-top: 80px; }`}>
        {/* 모바일 퍼스트 레이아웃을 위해 데스크탑에서도 최대 너비를 제한하여
        모바일 앱과 유사한 경험을 제공합니다.
      */}
        <div css={css`width: 100%; max-width: 448px; min-height: 100vh; background-color: #fffbf7; box-shadow: 0 0 40px rgba(0,0,0,0.05); position: relative; display: flex; flex-direction: column; overflow-x: hidden;`}>
          {/* 생일 축하 배너 */}
          {birthdayPeople.length > 0 && (
            <div css={css`background: linear-gradient(to right, #fb7185, #f472b6); color: white; padding: 12px 16px; text-align: center; font-size: 14px; font-weight: 700; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); position: relative; z-index: 10; animation: slideDown 0.5s ease-out;`}>
              🎉 오늘은 <span css={css`color: #fef08a;`}>{birthdayPeople.join(', ')}</span>님의 생일입니다! 축하해주세요! 🎂
            </div>
          )}

          {/* 상단 헤더 영역 (고정) */}
          <header css={css`padding: 16px 24px 16px; background-color: rgba(255, 255, 255, 0.8); backdrop-filter: blur(24px); border-bottom: 1px solid #f5f5f4; position: sticky; top: 0; z-index: 10;`}>
            <div css={css`display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;`}>
              <div>
                <h1 css={css`font-size: 24px; font-weight: 800; color: #292524; letter-spacing: -0.025em;`}>
                  허브 {userProfile?.cell_name || decodeURIComponent(unwrappedParams.darakbang)}
                  {(userProfile?.cell_name || decodeURIComponent(unwrappedParams.darakbang)).includes('새본') || (userProfile?.cell_name || decodeURIComponent(unwrappedParams.darakbang)).includes('새가족 본부') ? '' : '다락방'} 🌸
                </h1>
              </div>
              <div css={css`text-align: right; display: flex; flex-direction: column; align-items: flex-end;`}>
                <button onClick={handleSignOut} css={css`font-size: 12px; color: #a8a29e; padding: 4px 8px; transition: color 0.15s; &:hover { color: #57534e; }`}>로그아웃</button>
              </div>
            </div>

            <div css={css`display: flex; align-items: center; gap: 8px; margin-bottom: 4px;`}>
              <span css={css`font-weight: 700; color: #f43f5e; font-size: 14px;`}>{userProfile?.name || currentUserFullName}</span>
              <span css={css`color: #78716c; font-size: 12px;`}>
                {(() => {
                  const staffRoles: Record<string, string> = {
                    '김수진': '그룹장님', '이정진': '중보기도팀장님',
                    '이주은': '서기님', '신민주': '서기님',
                    '김하진': '총무님', '김예빈': '회계님',
                  };
                  if (staffRoles[userProfile?.name || '']) return staffRoles[userProfile?.name || ''];
                  const leaders: Record<string, string> = { '이레': '이진호', '라파': '김선경', '샬롬': '권예진', '닛시': '강영규' };
                  const isLeader = leaders[userProfile?.cell_name || ''] === userProfile?.name;
                  return isLeader ? '다락방장님' : '순장님';
                })()}, 환영해요!
              </span>
            </div>
            {/* 감성적인 탭 네비게이션 */}
            <div css={css`display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; padding-left: 8px; padding-right: 8px; margin-left: -8px; margin-right: -8px; margin-bottom: -4px; &::-webkit-scrollbar { display: block !important; height: 3px !important; } &::-webkit-scrollbar-track { background: transparent; } &::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 4px; } &::-webkit-scrollbar-thumb:hover { background: #a8a29e; }`}>
              {[
                { id: 'main', label: '기도 나누기 ✨' },
                { id: 'sharing', label: '나눔 공간 ☕' },
                { id: 'person', label: '각자의 기도 💌' },
                { id: 'recap', label: '월별 은혜 🗓️' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setRecapPage(1); setPersonPage(1); setSelectedRecapDate(null); }}
                  css={css`flex-shrink: 0; padding: 10px 16px; border-radius: 16px; font-weight: 700; font-size: 13px; transition: all 0.15s; height: 44px; ${activeTab === tab.id ? (tab.id === 'sharing' ? 'background-color: #34d399; color: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);' : 'background-color: #fb7185; color: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);') : 'background-color: white; color: #78716c; border: 1px solid #f5f5f4; &:hover { background-color: rgba(250, 250, 249, 0.8); }'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </header>

          {/* 메인 콘텐츠 컨테이너 */}
          <main css={css`padding: 20px; padding-bottom: 40px;`}>

            {/* 탭 1: 기도 나누기 */}
            {activeTab === 'main' && (
              <div css={css`animation: fadeIn 0.3s ease-in-out;`}>


                {/* 글쓰기 버튼 (플로팅 대신 상단 고정 버튼) */}
                <button
                  onClick={() => setIsWritingPrayer(true)}
                  css={css`width: 100%; background-color: #292524; color: white; font-weight: 700; padding: 14px; border-radius: 16px; transition: all 0.15s; font-size: 15px; height: 52px; margin-bottom: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; gap: 8px; &:active { background-color: #44403c; }`}
                >
                  ✍️ 마음에 품은 기도 올리기
                </button>

                {/* 기도 제목 입력 폼 (모달) */}
                {isWritingPrayer && (
                  <div css={css`position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 50; display: flex; align-items: flex-end; justify-content: center; padding: 0; background-color: rgba(28, 25, 23, 0.4); backdrop-filter: blur(4px); animation: fadeIn 0.2s ease-out; @media (min-width: 640px) { align-items: center; padding: 16px; }`}>
                    <div css={css`background-color: white; width: 100%; max-width: 448px; border-radius: 24px 24px 0 0;  padding: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: slideUp 0.3s ease-out; @media (min-width: 640px) { border-radius: 24px; }`}>
                      <div css={css`display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;`}>
                        <h2 css={css`font-size: 18px; font-weight: 700; color: #292524; letter-spacing: -0.025em;`}>기도 작성하기</h2>
                        <button onClick={() => setIsWritingPrayer(false)} css={css`color: #a8a29e; padding: 8px; margin-right: -8px; &:hover { color: #57534e; }`}>
                          <svg css={css`width: 24px; height: 24px;`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>

                      <form onSubmit={handleSubmit} css={css`display: flex; flex-direction: column; gap: 16px;`}>
                        <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                          css={css`padding: 14px; border: 1px solid #e7e5e4; border-radius: 16px; outline: none; width: 100%; background-color: rgba(250, 250, 249, 0.5); color: #44403c; font-weight: 500; font-size: 14px; transition: all 0.15s; &:focus { background-color: white; box-shadow: 0 0 0 2px #fecdd3; }`}>
                          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <textarea placeholder="하나님께 올려드릴 기도 제목을 적어주세요..." value={newTopic} onChange={(e) => setNewTopic(e.target.value)}
                          css={css`padding: 16px; border: 1px solid #e7e5e4; border-radius: 16px; height: 144px; resize: none; outline: none; color: #44403c; background-color: rgba(250, 250, 249, 0.5); font-size: 15px; line-height: 1.625; transition: all 0.15s; &:focus { background-color: white; box-shadow: 0 0 0 2px #fecdd3; }`} required />

                        <label css={css`display: flex; align-items: center; gap: 8px; padding-left: 4px; padding-right: 4px; cursor: pointer; width: max-content;`}>
                          <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            css={css`width: 18px; height: 18px; border-radius: 4px; border: 1px solid #d6d3d1; cursor: pointer;`}
                          />
                          <span css={css`font-size: 14px; font-weight: 500; color: #57534e; transition: color 0.15s; &:hover { color: #292524; }`}>익명으로 올리기 (주님의 어린양)</span>
                        </label>

                        <button type="submit" css={css`background-color: #292524; color: white; font-weight: 700; padding: 16px; border-radius: 16px; font-size: 16px; margin-top: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transition: color 0.15s; &:active { background-color: #44403c; }`}>
                          기도 올리기 🕊️
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* 필터 */}
                <div css={css`display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; padding-left: 20px; padding-right: 20px; margin-left: -20px; margin-right: -20px; margin-bottom: 8px; &::-webkit-scrollbar { display: block !important; height: 3px !important; } &::-webkit-scrollbar-track { background: transparent; } &::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 4px; } &::-webkit-scrollbar-thumb:hover { background: #a8a29e; }`}>
                  <button
                    onClick={() => setFilter('전체')}
                    css={css`flex-shrink: 0; padding: 10px 16px; border-radius: 16px; font-weight: 700; font-size: 13px; transition: all 0.15s; height: 44px; ${filter === '전체' ? 'background-color: #292524; color: white;' : 'background-color: white; border: 1px solid #e7e5e4; color: #78716c; &:hover { background-color: #fafaf9; }'}`}
                  >
                    전체
                  </button>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat} onClick={() => setFilter(cat)}
                      css={css`flex-shrink: 0; padding: 10px 16px; border-radius: 16px; font-weight: 700; font-size: 13px; transition: all 0.15s; height: 44px; ${filter === cat ? 'background-color: #fb7185; color: white; border-color: transparent;' : 'background-color: white; border: 1px solid #e7e5e4; color: #78716c; &:hover { background-color: #fafaf9; }'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* 기도 목록 */}
                <section css={css`display: flex; flex-direction: column; gap: 16px;`}>
                  {mainPrayers.length === 0 ? (
                    <div css={css`padding: 64px 0; text-align: center; background-color: rgba(255, 255, 255, 0.5); border-radius: 24px; border: 1px solid rgba(245, 245, 244, 0.5);`}>
                      <p css={css`color: #a8a29e; font-size: 14px;`}>등록된 기도가 없습니다.<br />첫 기도를 심어주세요 🌱</p>
                    </div>
                  ) : (
                    <>
                      {mainPrayers.map((prayer) => (
                        <PrayerCard key={prayer.id} prayer={prayer} currentUser={currentUserFullName} onIntercede={handleIntercede} onAnswerToggle={handleAnswerToggle} onUpdatePrayer={handleUpdatePrayer} onAddComment={handleAddComment} onUpdateComment={handleUpdateComment} onDeleteComment={handleDeleteComment} />
                      ))}

                      {/* 페이지네이션 컨트롤 */}
                      {totalCount > PAGE_SIZE && (
                        <div css={css`display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 32px; padding-bottom: 16px;`}>
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            css={css`width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background-color: white; border: 1px solid #e7e5e4; color: #78716c; transition: all 0.15s; &:disabled { opacity: 0.3; cursor: not-allowed; } &:active:not(:disabled) { transform: scale(0.9); }`}
                          >
                            <span css={css`position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;`}>이전</span>
                            <svg css={css`width: 20px; height: 20px;`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                          </button>

                          <div css={css`display: flex; gap: 6px;`}>
                            {Array.from({ length: Math.ceil(totalCount / PAGE_SIZE) }, (_, i) => i + 1)
                              .filter(p => Math.abs(p - currentPage) <= 1 || p === 1 || p === Math.ceil(totalCount / PAGE_SIZE))
                              .map((p, i, arr) => (
                                <React.Fragment key={p}>
                                  {i > 0 && arr[i - 1] !== p - 1 && <span css={css`color: #d6d3d1; align-self: flex-end; padding: 0 4px;`}>...</span>}
                                  <button
                                    onClick={() => setCurrentPage(p)}
                                    css={css`width: 40px; height: 40px; border-radius: 12px; font-weight: 700; font-size: 14px; transition: all 0.15s; &:active { transform: scale(0.9); } ${currentPage === p ? 'background-color: #fb7185; color: white; box-shadow: 0 4px 6px -1px rgba(254, 205, 211, 0.5);' : 'background-color: white; border: 1px solid #e7e5e4; color: #a8a29e; &:hover { background-color: #fafaf9; }'}`}
                                  >
                                    {p}
                                  </button>
                                </React.Fragment>
                              ))
                            }
                          </div>

                          <button
                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / PAGE_SIZE), prev + 1))}
                            disabled={currentPage === Math.ceil(totalCount / PAGE_SIZE)}
                            css={css`width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background-color: white; border: 1px solid #e7e5e4; color: #78716c; transition: all 0.15s; &:disabled { opacity: 0.3; cursor: not-allowed; } &:active:not(:disabled) { transform: scale(0.9); }`}
                          >
                            <span css={css`position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;`}>다음</span>
                            <svg css={css`width: 20px; height: 20px;`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </section>
              </div>
            )}

            {/* 탭 2: 순장님별 보기 */}
            {activeTab === 'person' && (
              <div css={css`animation: fadeIn 0.3s ease-in-out;`}>
                <section css={css`background-color: white; padding: 24px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid rgba(245, 245, 244, 0.6); margin-bottom: 24px;`}>
                  <div css={css`display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;`}>
                    <h2 css={css`font-size: 18px; font-weight: 700; color: #292524;`}>우리의 기도 노트 📖</h2>
                    <select value={personMonth} onChange={(e) => { setPersonMonth(e.target.value); setPersonPage(1); }} css={css`padding: 8px; border: 1px solid #e7e5e4; border-radius: 12px; background-color: transparent; font-weight: 700; font-size: 14px; outline: none; color: #44403c;`}>
                      {availableMonths.length === 0 && <option value="">-</option>}
                      {availableMonths.map(month => <option key={month} value={month}>{month.split('-')[0].substring(2)}년 {month.split('-')[1]}월</option>)}
                    </select>
                  </div>

                  {/* 가로 스크롤 순장 리스트 */}
                  {sunjangs.length === 0 ? (
                    <div css={css`padding: 16px 0; text-align: center; color: #a8a29e; font-size: 13px;`}>
                      이 다락방에 등록된 순장 정보가 없습니다.
                    </div>
                  ) : (
                    <div css={css`
                      display: flex; 
                      gap: 8px; 
                      overflow-x: auto; 
                      white-space: nowrap; 
                      padding-bottom: 16px; 
                      padding-top: 4px; 
                      padding-left: 24px; 
                      padding-right: 24px; 
                      margin: 0 -24px;
                      width: calc(100% + 48px);
                      -webkit-overflow-scrolling: touch; 
                      scroll-behavior: smooth; 
                      scrollbar-width: thin;
                      scrollbar-color: #a8a29e #f5f5f4;
                      
                      &::-webkit-scrollbar { 
                        display: block;
                        height: 8px; 
                      } 
                      &::-webkit-scrollbar-track { 
                        background: #f5f5f4; 
                        border-radius: 4px; 
                        margin: 0 24px;
                      } 
                      &::-webkit-scrollbar-thumb { 
                        background-color: #a8a29e; 
                        border-radius: 4px; 
                      } 
                    `}>
                      {sunjangs.map(member => (
                        <button
                          key={member.name} onClick={() => { setSelectedPerson(member.name); setPersonPage(1); }}
                          css={css`flex-shrink: 0; padding: 10px 16px; border-radius: 16px; font-weight: 700; transition: all 0.15s; font-size: 13px; height: 44px; display: flex; align-items: center; gap: 6px; ${selectedPerson === member.name ? 'background-color: #292524; color: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);' : 'background-color: #fafaf9; color: #78716c; border: 1px solid rgba(231, 229, 228, 0.6); &:hover { background-color: #f5f5f4; }'}`}
                        >
                          {member.name}
                          {member.is_cell_leader && (
                            <span css={css`font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px; ${selectedPerson === member.name ? 'background-color: rgba(255,255,255,0.2); color: #fda4af;' : 'background-color: #fff1f2; color: #e11d48;'}`}>다락방장</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <section css={css`display: flex; flex-direction: column; gap: 20px;`}>
                  {personPrayers.length === 0 ? (
                    <div css={css`padding: 80px 0; text-align: center; background-color: rgba(255, 255, 255, 0.5); border-radius: 24px; border: 1px solid rgba(245, 245, 244, 0.5);`}>
                      <p css={css`color: #a8a29e; font-size: 14px;`}>이 달에는 {selectedPerson} {sunjangs.find(s => s.name === selectedPerson)?.is_cell_leader ? '다락방장님이' : '순장님이'}<br />나눈 은혜가 없어요.</p>
                    </div>
                  ) : (
                    <>
                      {personPrayers.slice((personPage - 1) * 5, personPage * 5).map((item) => (
                        item.type === 'sharing' ? (
                          <SharingCard key={item.id} sharing={item} currentUser={currentUserFullName} onLike={handleLikeSharing} onUpdateSharing={handleUpdateSharing} onDeleteSharing={handleDeleteSharing} onAddComment={handleAddSharingComment} onUpdateComment={handleUpdateSharingComment} onDeleteComment={handleDeleteSharingComment} />
                        ) : (
                          <PrayerCard key={item.id} prayer={item} currentUser={currentUserFullName} onIntercede={handleIntercede} onAnswerToggle={handleAnswerToggle} onUpdatePrayer={handleUpdatePrayer} onAddComment={handleAddComment} onUpdateComment={handleUpdateComment} onDeleteComment={handleDeleteComment} />
                        )
                      ))}

                      {personPrayers.length > 5 && (
                        <div css={css`display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 16px; padding-bottom: 16px;`}>
                          <button
                            onClick={() => setPersonPage(prev => Math.max(1, prev - 1))}
                            disabled={personPage === 1}
                            css={css`width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background-color: white; border: 1px solid #e7e5e4; color: #78716c; transition: all 0.15s; &:disabled { opacity: 0.3; cursor: not-allowed; } &:active:not(:disabled) { transform: scale(0.9); }`}
                          >
                            <span css={css`position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;`}>이전</span>
                            <svg css={css`width: 20px; height: 20px;`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                          </button>

                          <div css={css`display: flex; gap: 6px;`}>
                            {Array.from({ length: Math.ceil(personPrayers.length / 5) }, (_, i) => i + 1)
                              .filter(p => Math.abs(p - personPage) <= 1 || p === 1 || p === Math.ceil(personPrayers.length / 5))
                              .map((p, i, arr) => (
                                <React.Fragment key={p}>
                                  {i > 0 && arr[i - 1] !== p - 1 && <span css={css`color: #d6d3d1; align-self: flex-end; padding: 0 4px;`}>...</span>}
                                  <button
                                    onClick={() => setPersonPage(p)}
                                    css={css`width: 40px; height: 40px; border-radius: 12px; font-weight: 700; font-size: 14px; transition: all 0.15s; &:active { transform: scale(0.9); } ${personPage === p ? 'background-color: #fb7185; color: white; box-shadow: 0 4px 6px -1px rgba(254, 205, 211, 0.5);' : 'background-color: white; border: 1px solid #e7e5e4; color: #a8a29e; &:hover { background-color: #fafaf9; }'}`}
                                  >
                                    {p}
                                  </button>
                                </React.Fragment>
                              ))
                            }
                          </div>

                          <button
                            onClick={() => setPersonPage(prev => Math.min(Math.ceil(personPrayers.length / 5), prev + 1))}
                            disabled={personPage === Math.ceil(personPrayers.length / 5)}
                            css={css`width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background-color: white; border: 1px solid #e7e5e4; color: #78716c; transition: all 0.15s; &:disabled { opacity: 0.3; cursor: not-allowed; } &:active:not(:disabled) { transform: scale(0.9); }`}
                          >
                            <span css={css`position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;`}>다음</span>
                            <svg css={css`width: 20px; height: 20px;`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </section>
              </div>
            )}

            {/* 탭 3: 월별 리캡 */}
            {activeTab === 'recap' && (
              <div css={css`animation: fadeIn 0.3s ease-in-out;`}>
                <section css={css`background-color: white; padding: 24px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid rgba(245, 245, 244, 0.6); margin-bottom: 24px;`}>
                  <div css={css`display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;`}>
                    <h2 css={css`font-size: 18px; font-weight: 700; color: #292524;`}>은혜의 달력 👣</h2>
                    <select
                      value={recapMonth}
                      onChange={(e) => {
                        setRecapMonth(e.target.value);
                        setSelectedRecapDate(null); // 달 변경 시 선택 날짜 초기화
                        setRecapPage(1); // 페이지 초기화
                      }}
                      css={css`padding: 8px; border: 1px solid #e7e5e4; border-radius: 12px; background-color: transparent; font-weight: 700; font-size: 14px; outline: none; color: #44403c;`}
                    >
                      {availableMonths.length === 0 && <option value="">-</option>}
                      {availableMonths.map(month => <option key={month} value={month}>{month.split('-')[0].substring(2)}년 {month.split('-')[1]}월</option>)}
                    </select>
                  </div>

                  {/* 달력 컴포넌트 */}
                  <RecapCalendar
                    month={recapMonth}
                    prayers={prayers}
                    selectedDate={selectedRecapDate}
                    onDateSelect={(dateStr: string) => { setSelectedRecapDate(dateStr); setRecapPage(1); }}
                  />

                  {recapPrayers.length > 0 && (
                    <div css={css`display: flex; gap: 12px; margin-top: 24px;`}>
                      <div css={css`background-color: #fdfbf7; padding: 16px; border-radius: 16px; flex: 1; text-align: center; border: 1px solid rgba(245, 245, 244, 0.6); transition: all 0.15s;`}>
                        <p css={css`color: #78716c; font-size: 10px; font-weight: 500; margin-bottom: 4px;`}>월간 은혜 목록</p>
                        <p css={css`font-size: 20px; font-weight: 800; color: #292524; letter-spacing: -0.025em;`}>{recapPrayers.length}</p>
                      </div>
                      <div css={css`background-color: rgba(255, 228, 230, 0.5); padding: 16px; border-radius: 16px; flex: 1; text-align: center; border: 1px solid rgba(255, 228, 230, 0.5); transition: all 0.15s;`}>
                        <p css={css`color: #e11d48; font-size: 10px; font-weight: 500; margin-bottom: 4px;`}>받은 응답</p>
                        <p css={css`font-size: 20px; font-weight: 800; color: #f43f5e; letter-spacing: -0.025em;`}>{recapPrayers.filter(p => p.is_answered).length}</p>
                      </div>
                    </div>
                  )}
                </section>

                {/* 선택된 날짜의 기도 리스트 */}
                <section css={css`display: flex; flex-direction: column; gap: 16px;`}>
                  {selectedRecapDate ? (
                    <>
                      <div css={css`display: flex; align-items: center; gap: 8px; padding-left: 4px; padding-right: 4px; margin-bottom: 4px;`}>
                        <div css={css`width: 4px; height: 16px; background-color: #fb7185; border-radius: 9999px;`}></div>
                        <h3 css={css`font-size: 14px; font-weight: 700; color: #57534e;`}>
                          {selectedRecapDate!.split('-')[1]}월 {selectedRecapDate!.split('-')[2]}일의 은혜
                        </h3>
                      </div>
                      {recapPrayers.filter(p => selectedRecapDate && getKstString(p.created_at).startsWith(selectedRecapDate!)).length > 0 ? (
                        <>
                          {recapPrayers
                            .filter(p => selectedRecapDate && getKstString(p.created_at).startsWith(selectedRecapDate!))
                            .slice((recapPage - 1) * 5, recapPage * 5)
                            .map(item => (
                              item.type === 'sharing' ? (
                                <SharingCard key={item.id} sharing={item} currentUser={currentUserFullName} onLike={handleLikeSharing} onUpdateSharing={handleUpdateSharing} onDeleteSharing={handleDeleteSharing} onAddComment={handleAddSharingComment} onUpdateComment={handleUpdateSharingComment} onDeleteComment={handleDeleteSharingComment} />
                              ) : (
                                <div key={item.id} css={css`padding: 20px; border-radius: 16px; border: 1px solid rgba(245, 245, 244, 0.6); background-color: white; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); position: relative; overflow: hidden; transition: transform 0.15s; &:active { transform: scale(0.98); }`}>
                                  <div css={css`display: flex; align-items: center; gap: 8px; margin-bottom: 12px;`}>
                                    <span css={css`font-size: 10px; font-weight: 800; color: #78716c; background-color: rgba(245, 245, 244, 0.8); padding: 4px 10px; border-radius: 6px;`}>{item.category}</span>
                                    <span css={css`font-weight: 700; color: #292524; font-size: 13px;`}>{item.member_name}</span>
                                    {item.is_answered && <span css={css`font-size: 10px; background-color: #fff1f2; color: #e11d48; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(254, 226, 226, 0.5); font-weight: 700; margin-left: auto;`}>응답됨 🎉</span>}
                                  </div>
                                  <p css={css`font-size: 15px; line-height: 1.625; ${item.is_answered ? 'color: #a8a29e; text-decoration-line: line-through; text-decoration-color: rgba(254, 205, 211, 0.5);' : 'color: #44403c;'}`}>{item.prayer_topic}</p>
                                  {item.is_answered && item.answer_text && (
                                    <div css={css`margin-top: 12px; background-color: rgba(255, 241, 242, 0.5); padding: 14px; border-radius: 12px; font-size: 13px; color: rgba(159, 18, 57, 0.9); border: 1px solid rgba(254, 226, 226, 0.4); line-height: 1.625; font-style: italic;`}>
                                      "{item.answer_text}"
                                    </div>
                                  )}
                                </div>
                              )
                            ))}

                          {recapPrayers.filter(p => selectedRecapDate && getKstString(p.created_at).startsWith(selectedRecapDate!)).length > 5 && (
                            <div css={css`display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 16px; padding-bottom: 16px;`}>
                              <button
                                onClick={() => setRecapPage(prev => Math.max(1, prev - 1))}
                                disabled={recapPage === 1}
                                css={css`width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background-color: white; border: 1px solid #e7e5e4; color: #78716c; transition: all 0.15s; &:disabled { opacity: 0.3; cursor: not-allowed; } &:active:not(:disabled) { transform: scale(0.9); }`}
                              >
                                <span css={css`position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;`}>이전</span>
                                <svg css={css`width: 20px; height: 20px;`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                              </button>

                              <div css={css`display: flex; gap: 6px;`}>
                                {Array.from({ length: Math.ceil(recapPrayers.filter(p => selectedRecapDate && getKstString(p.created_at).startsWith(selectedRecapDate!)).length / 5) }, (_, i) => i + 1)
                                  .filter(p => Math.abs(p - recapPage) <= 1 || p === 1 || p === Math.ceil(recapPrayers.filter(pray => selectedRecapDate && getKstString(pray.created_at).startsWith(selectedRecapDate!)).length / 5))
                                  .map((p, i, arr) => (
                                    <React.Fragment key={p}>
                                      {i > 0 && arr[i - 1] !== p - 1 && <span css={css`color: #d6d3d1; align-self: flex-end; padding: 0 4px;`}>...</span>}
                                      <button
                                        onClick={() => setRecapPage(p)}
                                        css={css`width: 40px; height: 40px; border-radius: 12px; font-weight: 700; font-size: 14px; transition: all 0.15s; &:active { transform: scale(0.9); } ${recapPage === p ? 'background-color: #fb7185; color: white; box-shadow: 0 4px 6px -1px rgba(254, 205, 211, 0.5);' : 'background-color: white; border: 1px solid #e7e5e4; color: #a8a29e; &:hover { background-color: #fafaf9; }'}`}
                                      >
                                        {p}
                                      </button>
                                    </React.Fragment>
                                  ))
                                }
                              </div>

                              <button
                                onClick={() => setRecapPage(prev => Math.min(Math.ceil(recapPrayers.filter(p => selectedRecapDate && getKstString(p.created_at).startsWith(selectedRecapDate!)).length / 5), prev + 1))}
                                disabled={recapPage === Math.ceil(recapPrayers.filter(p => selectedRecapDate && getKstString(p.created_at).startsWith(selectedRecapDate!)).length / 5)}
                                css={css`width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background-color: white; border: 1px solid #e7e5e4; color: #78716c; transition: all 0.15s; &:disabled { opacity: 0.3; cursor: not-allowed; } &:active:not(:disabled) { transform: scale(0.9); }`}
                              >
                                <span css={css`position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;`}>다음</span>
                                <svg css={css`width: 20px; height: 20px;`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div css={css`padding: 48px 0; text-align: center; color: #a8a29e; font-size: 14px; background-color: rgba(255, 255, 255, 0.5); border-radius: 24px; border: 1px dashed #e7e5e4;`}>이 날에는 등록된 은혜가 없습니다.</div>
                      )}
                    </>
                  ) : (
                    <div css={css`padding: 64px 0; text-align: center; color: #a8a29e; font-size: 14px; background-color: rgba(255, 255, 255, 0.3); border-radius: 24px; border: 1px dashed #f5f5f4;`}>
                      달력에서 날짜를 선택하여<br />그날의 은혜를 확인해보세요 🕊️
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* 탭 4: 나눔 공간 */}
            {activeTab === 'sharing' && (
              <div css={css`animation: fadeIn 0.3s ease-in-out;`}>

                {/* 나눔 작성 */}
                {/* 글쓰기 버튼 (플로팅 대신 상단 고정 버튼) */}
                <button
                  onClick={() => setIsWritingSharing(true)}
                  css={css`width: 100%; background-color: #292524; color: white; font-weight: 700; padding: 14px; border-radius: 16px; transition: all 0.15s; font-size: 15px; height: 52px; margin-bottom: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; gap: 8px; &:active { background-color: #44403c; }`}
                >
                  ✍️ 말씀과 삶의 은혜 나누기
                </button>

                {/* 나눔 작성 (모달) */}
                {isWritingSharing && (
                  <div css={css`position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 50; display: flex; align-items: flex-end; justify-content: center; padding: 0; background-color: rgba(28, 25, 23, 0.4); backdrop-filter: blur(4px); animation: fadeIn 0.2s ease-out; @media (min-width: 640px) { align-items: center; padding: 16px; }`}>
                    <div css={css`background-color: white; width: 100%; max-width: 448px; border-radius: 24px 24px 0 0;  padding: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: slideUp 0.3s ease-out; @media (min-width: 640px) { border-radius: 24px; }`}>
                      <div css={css`display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;`}>
                        <h2 css={css`font-size: 18px; font-weight: 700; color: #292524; letter-spacing: -0.025em;`}>은혜 나누기</h2>
                        <button onClick={() => setIsWritingSharing(false)} css={css`color: #a8a29e; padding: 8px; margin-right: -8px; &:hover { color: #57534e; }`}>
                          <svg css={css`width: 24px; height: 24px;`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>

                      <form onSubmit={handleSubmitSharing} css={css`display: flex; flex-direction: column; gap: 16px;`}>
                        <select value={newSharingCategory} onChange={(e) => setNewSharingCategory(e.target.value)}
                          css={css`padding: 14px; border: 1px solid #e7e5e4; border-radius: 16px; outline: none; width: 100%; background-color: rgba(250, 250, 249, 0.5); color: #44403c; font-weight: 500; font-size: 14px; transition: all 0.15s; &:focus { background-color: white; box-shadow: 0 0 0 2px #a7f3d0; }`}>
                          {SHARING_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <textarea placeholder="큐티, 주일 말씀 은혜, 감사했던 일 등 자유롭게 나누어주세요..." value={newSharingContent} onChange={(e) => setNewSharingContent(e.target.value)}
                          css={css`padding: 16px; border: 1px solid #e7e5e4; border-radius: 16px; height: 144px; resize: none; outline: none; color: #44403c; background-color: rgba(250, 250, 249, 0.5); font-size: 15px; line-height: 1.625; transition: all 0.15s; &:focus { background-color: white; box-shadow: 0 0 0 2px #a7f3d0; }`} required />
                        <button type="submit" css={css`background-color: #292524; color: white; font-weight: 700; padding: 16px; border-radius: 16px; font-size: 16px; margin-top: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transition: color 0.15s; &:active { background-color: #44403c; }`}>
                          은혜 나누기 🌿
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* 필터 */}
                <div css={css`display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; padding-left: 20px; padding-right: 20px; margin-left: -20px; margin-right: -20px; margin-bottom: 8px; &::-webkit-scrollbar { display: block !important; height: 3px !important; } &::-webkit-scrollbar-track { background: transparent; } &::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 4px; } &::-webkit-scrollbar-thumb:hover { background: #a8a29e; }`}>
                  <button
                    onClick={() => { setSharingFilter('전체'); setSharingPage(1); }}
                    css={css`flex-shrink: 0; padding: 10px 16px; border-radius: 16px; font-weight: 700; font-size: 13px; transition: all 0.15s; height: 44px; ${sharingFilter === '전체' ? 'background-color: #292524; color: white;' : 'background-color: white; border: 1px solid #e7e5e4; color: #78716c; &:hover { background-color: #fafaf9; }'}`}
                  >
                    전체
                  </button>
                  {SHARING_CATEGORIES.map(cat => (
                    <button
                      key={cat} onClick={() => { setSharingFilter(cat); setSharingPage(1); }}
                      css={css`flex-shrink: 0; padding: 10px 16px; border-radius: 16px; font-weight: 700; font-size: 13px; transition: all 0.15s; height: 44px; ${sharingFilter === cat ? 'background-color: #34d399; color: white; border-color: transparent;' : 'background-color: white; border: 1px solid #e7e5e4; color: #78716c; &:hover { background-color: #fafaf9; }'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* 나눔 목록 */}
                <section css={css`display: flex; flex-direction: column; gap: 16px;`}>
                  {sharings.length === 0 ? (
                    <div css={css`padding: 64px 0; text-align: center; background-color: rgba(255, 255, 255, 0.5); border-radius: 24px; border: 1px solid rgba(245, 245, 244, 0.5);`}>
                      <p css={css`color: #a8a29e; font-size: 14px;`}>등록된 나눔이 없습니다.<br />아름다운 은혜를 먼저 나누어보세요 ☕</p>
                    </div>
                  ) : (
                    <>
                      {sharings.map((sharing) => (
                        <SharingCard key={sharing.id} sharing={sharing} currentUser={currentUserFullName} onLike={handleLikeSharing} onUpdateSharing={handleUpdateSharing} onDeleteSharing={handleDeleteSharing} onAddComment={handleAddSharingComment} onUpdateComment={handleUpdateSharingComment} onDeleteComment={handleDeleteSharingComment} />
                      ))}

                      {sharingTotalCount > PAGE_SIZE && (
                        <div css={css`display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 32px; padding-bottom: 16px;`}>
                          <button
                            onClick={() => setSharingPage(prev => Math.max(1, prev - 1))}
                            disabled={sharingPage === 1}
                            css={css`width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background-color: white; border: 1px solid #e7e5e4; color: #78716c; transition: all 0.15s; &:disabled { opacity: 0.3; cursor: not-allowed; } &:active:not(:disabled) { transform: scale(0.9); }`}
                          >
                            <span className="sr-only">이전</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                          </button>

                          <div css={css`display: flex; gap: 6px;`}>
                            {Array.from({ length: Math.ceil(sharingTotalCount / PAGE_SIZE) }, (_, i) => i + 1)
                              .filter(p => Math.abs(p - sharingPage) <= 1 || p === 1 || p === Math.ceil(sharingTotalCount / PAGE_SIZE))
                              .map((p, i, arr) => (
                                <React.Fragment key={p}>
                                  {i > 0 && arr[i - 1] !== p - 1 && <span css={css`color: #d6d3d1; align-self: flex-end; padding: 0 4px;`}>...</span>}
                                  <button
                                    onClick={() => setSharingPage(p)}
                                    css={css`width: 40px; height: 40px; border-radius: 12px; font-weight: 700; font-size: 14px; transition: all 0.15s; &:active { transform: scale(0.9); } ${sharingPage === p ? 'background-color: #34d399; color: white; box-shadow: 0 4px 6px -1px rgba(167, 243, 208, 0.5);' : 'background-color: white; border: 1px solid #e7e5e4; color: #a8a29e; &:hover { background-color: #fafaf9; }'}`}
                                  >
                                    {p}
                                  </button>
                                </React.Fragment>
                              ))
                            }
                          </div>

                          <button
                            onClick={() => setSharingPage(prev => Math.min(Math.ceil(sharingTotalCount / PAGE_SIZE), prev + 1))}
                            disabled={sharingPage === Math.ceil(sharingTotalCount / PAGE_SIZE)}
                            css={css`width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background-color: white; border: 1px solid #e7e5e4; color: #78716c; transition: all 0.15s; &:disabled { opacity: 0.3; cursor: not-allowed; } &:active:not(:disabled) { transform: scale(0.9); }`}
                          >
                            <span css={css`position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;`}>다음</span>
                            <svg css={css`width: 20px; height: 20px;`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </section>
              </div>
            )}

          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}

function SharingCard({ sharing, currentUser, onLike, onUpdateSharing, onAddComment, onUpdateComment, onDeleteComment }: any) {
  const isMyLike = sharing.likes.includes(currentUser);
  const isMySharing = sharing.member_name === currentUser;
  const [commentInput, setCommentInput] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');

  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editContentInput, setEditContentInput] = useState(sharing.content);

  const handleSaveContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (editContentInput.trim() && editContentInput !== sharing.content) {
      onUpdateSharing(sharing.id, editContentInput);
    }
    setIsEditingContent(false);
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    onAddComment(sharing.id, commentInput);
    setCommentInput('');
    setShowComments(true);
  };

  const handleStartEdit = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditInput(comment.text);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditInput('');
  };

  const handleSaveEdit = (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    onUpdateComment(sharing.id, commentId, editInput);
    setEditingCommentId(null);
  };

  return (
    <div css={css`padding: 16px; border-radius: 24px; border: 1px solid #f5f5f4; position: relative; overflow: hidden; transition: all 0.3s; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.02); @media (min-width: 768px) { padding: 20px; }`}>
      <div>
        <div css={css`display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;`}>
          <div css={css`display: flex; align-items: center; gap: 8px;`}>
            <span css={css`font-weight: 800; font-size: 14px; color: #292524; letter-spacing: -0.025em;`}>
              {sharing.member_name}
            </span>
            <span css={css`font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 6px; background-color: #fafaf9; color: #a8a29e;`}>
              {sharing.category}
            </span>
          </div>
          <div css={css`display: flex; align-items: center; gap: 8px;`}>
            {isMySharing && !isEditingContent && (
              <button onClick={() => { setIsEditingContent(true); setEditContentInput(sharing.content); }} css={css`font-size: 10px; color: #a8a29e; transition: color 0.15s; font-weight: 700; &:hover { color: #57534e; } &:active { transform: scale(0.95); }`}>수정</button>
            )}
            <span css={css`font-size: 10px; font-weight: 500; color: #d6d3d1;`}>
              {new Date(sharing.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' })}
            </span>
          </div>
        </div>

        {isEditingContent ? (
          <form onSubmit={handleSaveContent} css={css`margin-bottom: 16px;`}>
            <textarea
              value={editContentInput}
              onChange={(e) => setEditContentInput(e.target.value)}
              css={css`width: 100%; padding: 16px; border: 1px solid #a7f3d0; border-radius: 12px; outline: none; color: #44403c; background-color: white; font-size: 15px; line-height: 1.625; resize: none; height: 96px; margin-bottom: 8px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); transition: all 0.15s; &:focus { box-shadow: 0 0 0 2px #a7f3d0; }`}
              autoFocus
            />
            <div css={css`display: flex; justify-content: flex-end; gap: 8px;`}>
              <button type="button" onClick={() => setIsEditingContent(false)} css={css`font-size: 12px; font-weight: 700; color: #a8a29e; padding: 6px 12px; transition: color 0.15s; &:hover { color: #57534e; }`}>취소</button>
              <button type="submit" css={css`font-size: 12px; font-weight: 700; background-color: #292524; color: white; padding: 6px 16px; border-radius: 8px; transition: all 0.15s; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); &:active { background-color: #44403c; transform: scale(0.95); }`}>저장</button>
            </div>
          </form>
        ) : (
          <p css={css`white-space: pre-wrap; font-size: 15px; line-height: 1.625; margin-bottom: 16px; color: #44403c;`}>
            {sharing.content}
          </p>
        )}
      </div>

      <div css={css`display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid #fafaf9;`}>
        <div css={css`display: flex; gap: 16px;`}>
          <button
            onClick={() => onLike(sharing)}
            css={css`display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; transition: all 0.15s; padding: 8px 12px; border-radius: 8px; &:active { transform: scale(0.9); } ${isMyLike ? 'background-color: #ecfdf5; color: #10b981; box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);' : 'color: #34d399; background-color: #fafaf9; &:hover { color: #10b981; }'}`}
          >
            {isMyLike ? '💚' : '🤍'} {sharing.likes.length > 0 ? sharing.likes.length : '좋아요'}
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            css={css`display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; color: #78716c; transition: all 0.15s; padding: 8px 4px; &:hover { color: #44403c; } &:active { transform: scale(0.95); }`}
          >
            💬 {sharing.comments?.length > 0 ? sharing.comments.length : '댓글'}
          </button>
        </div>
      </div>

      {showComments && (
        <div css={css`margin-top: 16px; padding-top: 16px; border-top: 1px solid #fafaf9; animation: fadeIn 0.2s ease-in-out;`}>
          <div css={css`display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; max-height: 250px; overflow-y: auto; padding-left: 4px; padding-right: 4px; &::-webkit-scrollbar { display: none; }`}>
            {(!sharing.comments || sharing.comments.length === 0) ? (
              <p css={css`font-size: 11px; color: #d6d3d1; text-align: center; padding: 8px 0;`}>은혜로운 댓글을 남겨주세요 🌿</p>
            ) : (
              sharing.comments.map((c: any) => (
                <div key={c.id} css={css`background-color: rgba(250, 250, 249, 0.5); padding: 12px; border-radius: 16px; border: 1px solid rgba(245, 245, 244, 0.5);`}>
                  <div css={css`display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;`}>
                    <div css={css`display: flex; align-items: center; gap: 8px;`}>
                      <span css={css`font-weight: 700; font-size: 11px; color: #57534e;`}>{c.author}</span>
                      <span css={css`font-size: 9px; color: #d6d3d1;`}>{new Date(c.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' })}</span>
                    </div>
                    {c.author === currentUser && (
                      <div css={css`display: flex; gap: 8px;`}>
                        <button onClick={() => handleStartEdit(c)} css={css`font-size: 9px; color: #a8a29e; font-weight: 700; transition: color 0.15s; &:hover { color: #10b981; }`}>수정</button>
                        <button onClick={() => onDeleteComment(sharing.id, c.id)} css={css`font-size: 9px; color: #a8a29e; font-weight: 700; transition: color 0.15s; &:hover { color: #fb7185; }`}>삭제</button>
                      </div>
                    )}
                  </div>
                  {editingCommentId === c.id ? (
                    <form onSubmit={(e) => handleSaveEdit(e, c.id)} css={css`display: flex; flex-direction: column; gap: 8px; margin-top: 8px;`}>
                      <textarea
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        css={css`width: 100%; padding: 8px; font-size: 12px; border: 1px solid #e7e5e4; border-radius: 12px; outline: none; resize: none; height: 64px; background-color: white; &:focus { border-color: #a7f3d0; }`}
                        autoFocus
                      />
                      <div css={css`display: flex; justify-content: flex-end; gap: 8px;`}>
                        <button type="button" onClick={handleCancelEdit} css={css`font-size: 10px; font-weight: 700; color: #a8a29e; padding: 4px 8px;`}>취소</button>
                        <button type="submit" css={css`font-size: 10px; font-weight: 700; background-color: #34d399; color: white; padding: 4px 12px; border-radius: 8px;`}>저장</button>
                      </div>
                    </form>
                  ) : (
                    <p css={css`font-size: 13px; color: #57534e; line-height: 1.5; white-space: pre-wrap;`}>{c.text}</p>
                  )}
                </div>
              ))
            )}
          </div>

          <form onSubmit={submitComment} css={css`display: flex; gap: 8px; margin-top: 8px;`}>
            <input
              type="text"
              placeholder="따뜻한 나눔을 남겨주세요..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              css={css`flex: 1; padding: 0 16px; font-size: 13px; border: 1px solid #f5f5f4; border-radius: 16px; outline: none; transition: all 0.15s; height: 44px; background-color: rgba(250, 250, 249, 0.5); &:focus { background-color: white; border-color: #d1fae5; }`}
              required
            />
            <button type="submit" css={css`background-color: #292524; color: white; padding: 0 16px; border-radius: 16px; font-size: 12px; font-weight: 700; height: 44px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); &:active { background-color: #44403c; }`}>
              게시
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function RecapCalendar({ month, prayers, selectedDate, onDateSelect }: any) {
  if (!month) return null;

  const [year, monthStr] = month.split('-').map(Number);
  const firstDay = new Date(year, monthStr - 1, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const lastDate = new Date(year, monthStr, 0).getDate();

  const days = Array.from({ length: 42 }, (_, i) => {
    const dayValue = i - firstDay + 1;
    if (dayValue > 0 && dayValue <= lastDate) {
      const dateStr = `${year}-${String(monthStr).padStart(2, '0')}-${String(dayValue).padStart(2, '0')}`;
      const dayPrayers = prayers.filter((p: any) => getKstString(p.created_at).startsWith(dateStr));
      return { dayValue, dateStr, count: dayPrayers.length, hasAnswer: dayPrayers.some((p: any) => p.is_answered) };
    }
    return null;
  });

  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div css={css`user-select: none;`}>
      <div css={css`display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); margin-bottom: 8px;`}>
        {dayLabels.map((l, i) => (
          <div key={l} css={css`text-align: center; font-size: 10px; font-weight: 700; padding: 4px; ${i === 0 ? 'color: #fb7185;' : i === 6 ? 'color: #60a5fa;' : 'color: #d6d3d1;'}`}>
            {l}
          </div>
        ))}
      </div>
      <div css={css`display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px;`}>
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} css={css`aspect-ratio: 1 / 1;`}></div>;

          const isSelected = selectedDate === day.dateStr;
          const kstNow = new Date(new Date().getTime() + (new Date().getTimezoneOffset() * 60000) + (9 * 3600000));
          const isToday = kstNow.toISOString().startsWith(day.dateStr);

          let dynamicStyle = '';
          if (isSelected) {
            dynamicStyle = 'background-color: #fb7185; color: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); z-index: 10;';
          } else if (isToday) {
            dynamicStyle = 'background-color: #fafaf9; border: 1px solid #e7e5e4;';
          } else {
            dynamicStyle = '&:hover { background-color: rgba(fff1f2, 0.5); }';
          }

          return (
            <button
              key={day.dateStr}
              onClick={() => onDateSelect(day.dateStr)}
              css={css`aspect-ratio: 1 / 1; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; transition: all 0.15s; &:active { transform: scale(0.95); } ${dynamicStyle}`}
            >
              <span css={css`font-size: 13px; font-weight: 700; ${!isSelected && (i % 7 === 0 ? 'color: #fb7185;' : i % 7 === 6 ? 'color: #60a5fa;' : 'color: #44403c;')}`}>
                {day.dayValue}
              </span>

              {/* 기도가 있는 날표시 */}
              {day.count > 0 && !isSelected && (
                <div css={css`margin-top: 2px; width: 4px; height: 4px; border-radius: 9999px; ${day.hasAnswer ? 'background-color: #fb7185;' : 'background-color: #d6d3d1;'}`}></div>
              )}
              {day.count > 0 && isSelected && (
                <div css={css`margin-top: 2px; width: 4px; height: 4px; border-radius: 9999px; background-color: rgba(255, 255, 255, 0.7);`}></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PrayerCard({ prayer, currentUser, onIntercede, onAnswerToggle, onUpdatePrayer, onAddComment, onUpdateComment, onDeleteComment }: any) {
  const isMyIntercession = prayer.intercessors.includes(currentUser);
  const isMyPrayer = prayer.member_name === currentUser;
  const [commentInput, setCommentInput] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');

  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editTopicInput, setEditTopicInput] = useState(prayer.prayer_topic);

  const handleSaveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (editTopicInput.trim() && editTopicInput !== prayer.prayer_topic) {
      onUpdatePrayer(prayer.id, editTopicInput);
    }
    setIsEditingTopic(false);
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    onAddComment(prayer.id, commentInput);
    setCommentInput('');
    setShowComments(true);
  };

  const handleStartEdit = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditInput(comment.text);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditInput('');
  };

  const handleSaveEdit = (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    onUpdateComment(prayer.id, commentId, editInput);
    setEditingCommentId(null);
  };

  return (
    <div css={css`padding: 16px; border-radius: 24px; border: 1px solid; position: relative; overflow: hidden; transition: all 0.3s; @media (min-width: 768px) { padding: 20px; } ${prayer.is_answered ? 'background-color: #fdfbf7; border-color: #ffe4e6;' : 'background-color: white; border-color: #f5f5f4; box-shadow: 0 2px 10px rgba(0,0,0,0.02);'}`}>
      <div>
        <div css={css`display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;`}>
          <div css={css`display: flex; align-items: center; gap: 8px;`}>
            <span css={css`font-weight: 800; font-size: 14px; color: #292524; letter-spacing: -0.025em;`}>
              {prayer.member_name}
            </span>
            <span css={css`font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 6px; ${prayer.is_answered ? 'background-color: rgba(ffe4e6, 0.5); color: #f43f5e;' : 'background-color: #fafaf9; color: #a8a29e;'}`}>
              {prayer.category}
            </span>
          </div>
          <div css={css`display: flex; align-items: center; gap: 8px;`}>
            {isMyPrayer && !prayer.is_answered && !isEditingTopic && (
              <button onClick={() => { setIsEditingTopic(true); setEditTopicInput(prayer.prayer_topic); }} css={css`font-size: 10px; color: #a8a29e; transition: color 0.15s; font-weight: 700; &:hover { color: #57534e; } &:active { transform: scale(0.95); }`}>수정</button>
            )}
            <span css={css`font-size: 10px; font-weight: 500; color: #d6d3d1;`}>
              {new Date(prayer.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' })}
            </span>
          </div>
        </div>

        {isEditingTopic ? (
          <form onSubmit={handleSaveTopic} css={css`margin-bottom: 16px;`}>
            <textarea
              value={editTopicInput}
              onChange={(e) => setEditTopicInput(e.target.value)}
              css={css`width: 100%; padding: 16px; border: 1px solid #fecdd3; border-radius: 12px; outline: none; color: #44403c; background-color: white; font-size: 15px; line-height: 1.625; resize: none; height: 96px; margin-bottom: 8px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); transition: all 0.15s; &:focus { box-shadow: 0 0 0 2px #fecdd3; }`}
              autoFocus
            />
            <div css={css`display: flex; justify-content: flex-end; gap: 8px;`}>
              <button type="button" onClick={() => setIsEditingTopic(false)} css={css`font-size: 12px; font-weight: 700; color: #a8a29e; padding: 6px 12px; transition: color 0.15s; &:hover { color: #57534e; }`}>취소</button>
              <button type="submit" css={css`font-size: 12px; font-weight: 700; background-color: #292524; color: white; padding: 6px 16px; border-radius: 8px; transition: all 0.15s; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); &:active { background-color: #44403c; transform: scale(0.95); }`}>저장</button>
            </div>
          </form>
        ) : (
          <p css={css`white-space: pre-wrap; font-size: 15px; line-height: 1.625; margin-bottom: 16px; ${prayer.is_answered ? 'color: #a8a29e; text-decoration: line-through; text-decoration-color: rgba(fecdd3, 0.4);' : 'color: #44403c;'}`}>
            {prayer.prayer_topic}
          </p>
        )}

        {prayer.is_answered && prayer.answer_text && (
          <div css={css`background-color: rgba(255, 241, 242, 0.5); padding: 12px; border-radius: 12px; margin-bottom: 16px; font-size: 13px; color: rgba(159, 18, 57, 0.8); border: 1px solid rgba(255, 228, 230, 0.3); line-height: 1.375;`}>
            <span css={css`font-weight: 700; color: #f43f5e; margin-right: 6px;`}>응답:</span>
            {prayer.answer_text}
          </div>
        )}
      </div>

      <div css={css`display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid #fafaf9;`}>
        <div css={css`display: flex; gap: 16px;`}>
          <button
            onClick={() => onIntercede(prayer)}
            css={css`display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; transition: all 0.15s; padding: 8px 12px; border-radius: 8px; &:active { transform: scale(0.9); } ${isMyIntercession ? 'background-color: #ffe4e6; color: #f43f5e; box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);' : 'color: #fb7185; background-color: rgba(255, 241, 242, 0.5); &:hover { color: #f43f5e; }'}`}
          >
            {isMyIntercession ? '💖' : '🙏'} {prayer.intercessors.length > 0 ? prayer.intercessors.length : '중보'}
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            css={css`display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; color: #78716c; transition: all 0.15s; padding: 8px 4px; &:hover { color: #44403c; } &:active { transform: scale(0.95); }`}
          >
            💬 {prayer.comments?.length > 0 ? prayer.comments.length : '댓글'}
          </button>
        </div>

        {isMyPrayer && (
          <button
            onClick={() => onAnswerToggle(prayer)}
            css={css`font-size: 12px; font-weight: 700; padding: 8px 16px; border-radius: 12px; border: 1px solid; transition: all 0.15s; &:active { transform: scale(0.95); } ${prayer.is_answered ? 'background-color: white; color: #d6d3d1; border-color: #f5f5f4;' : 'background-color: #fb7185; color: white; border-color: #fb7185; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);'}`}
          >
            {prayer.is_answered ? '응답 취소' : '응답 기록'}
          </button>
        )}
      </div>

      {showComments && (
        <div css={css`margin-top: 16px; padding-top: 16px; border-top: 1px solid #fafaf9; animation: fadeIn 0.2s ease-in-out;`}>
          <div css={css`display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; max-height: 250px; overflow-y: auto; padding-left: 4px; padding-right: 4px; &::-webkit-scrollbar { display: none; }`}>
            {(!prayer.comments || prayer.comments.length === 0) ? (
              <p css={css`font-size: 11px; color: #d6d3d1; text-align: center; padding: 8px 0;`}>따뜻한 한마디를 남겨주세요 💌</p>
            ) : (
              prayer.comments.map((c: any) => (
                <div key={c.id} css={css`background-color: rgba(250, 250, 249, 0.5); padding: 12px; border-radius: 16px; border: 1px solid rgba(245, 245, 244, 0.5);`}>
                  <div css={css`display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;`}>
                    <div css={css`display: flex; align-items: center; gap: 8px;`}>
                      <span css={css`font-weight: 700; font-size: 11px; color: #57534e;`}>{c.author}</span>
                      <span css={css`font-size: 9px; color: #d6d3d1;`}>{new Date(c.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' })}</span>
                    </div>
                    {c.author === currentUser && (
                      <div css={css`display: flex; gap: 8px;`}>
                        <button onClick={() => handleStartEdit(c)} css={css`font-size: 9px; color: #a8a29e; font-weight: 700; transition: color 0.15s; &:hover { color: #fb7185; }`}>수정</button>
                        <button onClick={() => onDeleteComment(prayer.id, c.id)} css={css`font-size: 9px; color: #a8a29e; font-weight: 700; transition: color 0.15s; &:hover { color: #f43f5e; }`}>삭제</button>
                      </div>
                    )}
                  </div>
                  {editingCommentId === c.id ? (
                    <form onSubmit={(e) => handleSaveEdit(e, c.id)} css={css`display: flex; flex-direction: column; gap: 8px; margin-top: 8px;`}>
                      <textarea
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        css={css`width: 100%; padding: 8px; font-size: 12px; border: 1px solid #e7e5e4; border-radius: 12px; outline: none; resize: none; height: 64px; background-color: white; &:focus { border-color: #fecdd3; }`}
                        autoFocus
                      />
                      <div css={css`display: flex; justify-content: flex-end; gap: 8px;`}>
                        <button type="button" onClick={handleCancelEdit} css={css`font-size: 10px; font-weight: 700; color: #a8a29e; padding: 4px 8px;`}>취소</button>
                        <button type="submit" css={css`font-size: 10px; font-weight: 700; background-color: #fb7185; color: white; padding: 4px 12px; border-radius: 8px;`}>저장</button>
                      </div>
                    </form>
                  ) : (
                    <p css={css`font-size: 13px; color: #57534e; line-height: 1.5; white-space: pre-wrap;`}>{c.text}</p>
                  )}
                </div>
              ))
            )}
          </div>

          <form onSubmit={submitComment} css={css`display: flex; gap: 8px; margin-top: 8px;`}>
            <input
              type="text"
              placeholder="따뜻한 댓글을 남겨주세요..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              css={css`flex: 1; padding: 0 16px; font-size: 13px; border: 1px solid #f5f5f4; border-radius: 16px; outline: none; transition: all 0.15s; height: 44px; background-color: rgba(250, 250, 249, 0.5); &:focus { background-color: white; border-color: #ffe4e6; }`}
              required
            />
            <button type="submit" css={css`background-color: #292524; color: white; padding: 0 16px; border-radius: 16px; font-size: 12px; font-weight: 700; height: 44px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); &:active { background-color: #44403c; }`}>
              게시
            </button>
          </form>
        </div>
      )}
    </div>
  );
}