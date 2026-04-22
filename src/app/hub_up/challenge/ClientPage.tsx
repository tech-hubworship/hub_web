"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styled from "@emotion/styled";
import {
  HUB_CHALLENGE,
  CHALLENGE_DAYS,
  getTodayChallengeDay,
  getKSTDateStr,
} from "@src/lib/hub-challenge/constants";

const PRIMARY = "#2D478C";
const LIGHT_BLUE = "#8DADFF";
const LIGHT_BG = "#D0DDFF";
const WHITE = "#FFFFFF";

// ── 테스트 모드: true면 하단에 Day 선택 버튼 표시 ──
const TEST_MODE = true;

interface Share {
  share_id: string;
  day: number;
  content: string;
  reg_dt: string;
  user_name: string;
  user_affiliation: string;
  seq: number;
  is_mine: boolean;
}

interface MyProgress {
  completedDays: number[];
  lastCompletedDay: number;
  todayDayNumber: number | null;
  todayDone: boolean;
  totalShares: number;
}

export default function ChallengeClientPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [shares, setShares] = useState<Share[]>([]);
  const [myProgress, setMyProgress] = useState<MyProgress | null>(null);
  const [shareContent, setShareContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sharesLoading, setSharesLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalShares, setTotalShares] = useState(0);

  // 테스트용 선택 day (null이면 오늘 날짜 기준)
  const [testDay, setTestDay] = useState<number | null>(null);
  // 소개 텍스트 펼침 상태
  const [introExpanded, setIntroExpanded] = useState(false);
  // 수정 중인 나눔
  const [editingShare, setEditingShare] = useState<{ share_id: string; content: string } | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const todayStr = getKSTDateStr();
  const todayChallenge = getTodayChallengeDay(todayStr);

  // 표시할 day 데이터: 테스트 선택 > 오늘 > Day1 기본
  const dayData = testDay !== null
    ? CHALLENGE_DAYS.find((d) => d.day === testDay) ?? CHALLENGE_DAYS[0]
    : (todayChallenge ?? CHALLENGE_DAYS[0]);

  const progressPercent = myProgress
    ? Math.min((myProgress.completedDays.length / HUB_CHALLENGE.TOTAL_DAYS) * 100, 100)
    : 0;

  const todayDone = myProgress?.todayDone ?? false;
  // 테스트 모드에서는 인증 항상 활성화, 실제는 오늘 day이고 미완료일 때만
  const canCertify = TEST_MODE
    ? !!session
    : (!!todayChallenge && !todayDone && !!session);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/hub-challenge/my-progress")
        .then((r) => r.json())
        .then((data) => { if (!data.error) setMyProgress(data); })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (!dayData) return;
    setSharesLoading(true);
    fetch(`/api/hub-challenge/shares?day=${dayData.day}&page=${page}&limit=5`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setShares(data.shares || []);
          setTotalShares(data.total || 0);
        }
      })
      .catch(console.error)
      .finally(() => setSharesLoading(false));
  }, [dayData.day, page]);

  const handleEditSubmit = async () => {
    if (!editingShare || !editContent.trim()) return;
    setIsEditing(true);
    try {
      const res = await fetch("/api/hub-challenge/shares", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ share_id: editingShare.share_id, content: editContent.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditingShare(null);
        setEditContent("");
        // 목록 새로고침
        const sharesRes = await fetch(`/api/hub-challenge/shares?day=${dayData.day}&page=${page}&limit=5`);
        const sharesData = await sharesRes.json();
        if (!sharesData.error) {
          setShares(sharesData.shares || []);
          setTotalShares(sharesData.total || 0);
        }
      } else {
        alert(data.error || "수정에 실패했습니다.");
      }
    } catch {
      alert("수정 중 오류가 발생했습니다.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleSubmit = async () => {
    if (!session) {
      router.push("/login?redirect=/hub_up/challenge");
      return;
    }
    if (!shareContent.trim() || !dayData) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/hub-challenge/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day: dayData.day, content: shareContent.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setShareContent("");
        const [progressRes, sharesRes] = await Promise.all([
          fetch("/api/hub-challenge/my-progress"),
          fetch(`/api/hub-challenge/shares?day=${dayData.day}&page=1&limit=5`),
        ]);
        const progressData = await progressRes.json();
        const sharesData = await sharesRes.json();
        if (!progressData.error) setMyProgress(progressData);
        if (!sharesData.error) {
          setShares(sharesData.shares || []);
          setTotalShares(sharesData.total || 0);
          setPage(1);
        }
      } else {
        alert(data.error || "나눔 작성에 실패했습니다.");
      }
    } catch {
      alert("나눔 작성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Wrap>
        <LoadingWrap>챌린지 정보를 불러오는 중...</LoadingWrap>
      </Wrap>
    );
  }

  return (
    <Wrap>
      {/* 헤더 */}
      <Header>
        <BackBtn onClick={() => router.push("/hub_up")}>←</BackBtn>
        <HeaderTitle>허브업 챌린지</HeaderTitle>
      </Header>

      <Body>
        {/* 허브업 챌린지 */}
        <SubLabel>허브업 챌린지</SubLabel>

        {/* 레위기 19장 19일 실천 */}
        <PageTitle>레위기 19장 19일 실천</PageTitle>

        {/* 소개 텍스트 — 처음엔 4줄, 누르면 전체 펼침 */}
        <IntroBox>
          <IntroText $expanded={introExpanded}>
            거룩은 {"\n"}내가 만들어내는 결과가 아니라{"\n"}예수 그리스도와 성령 안에서{"\n"}하나님과의 관계 속에서 누리는 상태입니다.{"\n\n"}"너희는 거룩하라"는 말씀은 {"\n"}부담이나 의무가 아니라 {"\n"}하나님의 거룩하심을 닮아가며 {"\n"}그 마음을 알아가라는 초대입니다.{"\n\n"}그래서 레위기 19장의 말씀을 실천한다는 것은 {"\n"}단순히 규칙을 지키는 것이 아니라, {"\n"}하나님의 마음을 배우고 알아가는 과정입니다.{"\n\n"}거룩은 규칙이 아니라 관계이고,{"\n"}순종은 부담이 아니라 {"\n"}사랑의 반응이기 때문입니다.{"\n\n"}예수님께서 단번에 그분을 드리심으로{"\n"}이미 우리를 거룩하게 하셨고, {"\n"}성령님께서 우리를 도우셔서{"\n"}우리는 하나님과 동행하는 삶으로 초대받았습니다.{"\n\n"}이처럼 말씀과 기도로 거룩해진다는 것은{"\n"}우리가 하나님께 속하고, 예수님으로 깨끗해지며,{"\n"}성령님과 동행하는 삶으로 살아가는 것입니다.{"\n\n"}우리의 연약함으로 인해 매일의 실천을 {"\n"}실패할 수도 있겠지만{"\n"}그 순종의 과정을 통해 {"\n"}하나님의 사랑을 알아가며{"\n"}예수님과 성령님을 의지하게 될 것입니다.{"\n\n"}실천의 성공과 실패는 중요하지 않습니다.{"\n"}그러니 실패를 하더라도 말씀에 순종하기 위해{"\n"}하나님, 예수님, 성령님과 함께 고군분투했던 {"\n"}하루의 은혜를 나눠주세요.{"\n\n"}레위기 19장을 실천하는 과정 속에서 {"\n"}예수 그리스도가 주신 소망을 붙들고{"\n"}성령님의 도우심을 구하며{"\n"}하나님의 마음을 더 깊이 알아{"\n"}그분의 사랑 안에서 {"\n"}거룩을 누리는 시간이 되기를 축복합니다.
          </IntroText>
          <IntroToggleBtn onClick={() => setIntroExpanded((v) => !v)}>
            {introExpanded ? "접기 ↑" : "전체 보기 ↓"}
          </IntroToggleBtn>
        </IntroBox>

        {/* Day N */}
        <DayBadge>Day {dayData.day}</DayBadge>

        {/* 오늘의 실천 */}
        <SectionTitle>오늘의 실천</SectionTitle>

        {/* 일러스트 + 로고 원 + 프로그레스 바 */}
        <IllustProgressWrap>
          {/* 일러스트 — progressPercent 위치에 따라 프로그레스 바 위에서 이동 */}
          <IllustImg style={{ left: `calc(${progressPercent}% - 26px)` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/challenge/challenge_illust.png" alt="" />
          </IllustImg>
          {/* 로고 원 — 오른쪽 끝 고정 */}
          <LogoCircle>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/challenge/challenge_logo.png" alt="" style={{ width: "33px", height: "9px", objectFit: "contain" }} />
          </LogoCircle>
          {/* 프로그레스 바 */}
          <ProgressBg>
            <ProgressFill style={{ width: `${progressPercent}%` }} />
            <ProgressDot style={{ left: `${progressPercent}%` }} />
          </ProgressBg>
        </IllustProgressWrap>

        {/* Day 정보 카드: dDay | verse */}
        <DayCard>
          <DayCardBadge>
            <DayCardText>{dayData.dDay}</DayCardText>
            <DayCardSep>|</DayCardSep>
            <DayCardText>{dayData.verse}</DayCardText>
          </DayCardBadge>
          <PracticeDetailList>
            {dayData.practices.map((p, i) => (
              <PracticeDetailItem key={i}>
                {i === 0 ? "❶" : i === 1 ? "❷" : "❸"} {p}
              </PracticeDetailItem>
            ))}
          </PracticeDetailList>
        </DayCard>

        {/* 입력창 */}
        <TextareaWrap>
          <Textarea
            placeholder={`오늘의 실천 제목을 실천한 이야기를 공유해주세요.\n실패한 이야기도 괜찮아요.`}
            value={shareContent}
            onChange={(e) => setShareContent(e.target.value)}
            maxLength={300}
            disabled={!canCertify}
          />
          <CharCount>{shareContent.length} / 300자</CharCount>
        </TextareaWrap>

        {/* 인증하기 버튼 */}
        <CertifyBtn
          onClick={handleSubmit}
          disabled={!canCertify || !shareContent.trim() || isSubmitting}
        >
          {isSubmitting ? "작성 중..." : "인증하기"}
        </CertifyBtn>

        {/* 나눔 카드 목록 */}
        {sharesLoading ? (
          <LoadingText>나눔을 불러오는 중...</LoadingText>
        ) : shares.length === 0 ? (
          <EmptyText>아직 나눔이 없습니다.</EmptyText>
        ) : (
          <>
            {shares.map((share) => (
              <ShareCard key={share.share_id} $isMine={share.is_mine}>
                <ShareCardHeader>
                  <ShareNum>
                    #{share.seq}{share.is_mine && <MineTag> (나)</MineTag>}
                  </ShareNum>
                  {share.is_mine && (
                    <EditBtn onClick={() => {
                      setEditingShare({ share_id: share.share_id, content: share.content });
                      setEditContent(share.content);
                    }}>
                      수정
                    </EditBtn>
                  )}
                </ShareCardHeader>
                {editingShare?.share_id === share.share_id ? (
                  <EditBox>
                    <EditTextarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      maxLength={300}
                    />
                    <EditFooter>
                      <EditCharCount>{editContent.length} / 300자</EditCharCount>
                      <EditActions>
                        <EditCancelBtn onClick={() => { setEditingShare(null); setEditContent(""); }}>
                          취소
                        </EditCancelBtn>
                        <EditSaveBtn
                          onClick={handleEditSubmit}
                          disabled={!editContent.trim() || isEditing}
                        >
                          {isEditing ? "저장 중..." : "저장"}
                        </EditSaveBtn>
                      </EditActions>
                    </EditFooter>
                  </EditBox>
                ) : (
                  <ShareContent>{share.content}</ShareContent>
                )}
              </ShareCard>
            ))}
            {/* 페이지네이션 */}
            {totalShares > 5 && (
              <Pagination>
                <PageBtn
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ‹
                </PageBtn>
                {Array.from({ length: Math.ceil(totalShares / 5) }, (_, i) => i + 1).map((p) => (
                  <PageBtn
                    key={p}
                    $active={page === p}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </PageBtn>
                ))}
                <PageBtn
                  onClick={() => setPage((p) => Math.min(Math.ceil(totalShares / 5), p + 1))}
                  disabled={page === Math.ceil(totalShares / 5)}
                >
                  ›
                </PageBtn>
              </Pagination>
            )}
          </>
        )}

        {/* ── 테스트 모드: Day 선택 버튼 ── */}
        {TEST_MODE && (
          <TestPanel>
            <TestLabel>🧪 테스트 — Day 선택</TestLabel>
            <TestGrid>
              {CHALLENGE_DAYS.map((d) => (
                <TestDayBtn
                  key={d.day}
                  $active={dayData.day === d.day}
                  onClick={() => {
                    setTestDay(d.day);
                    setShareContent("");
                  }}
                >
                  <span>Day {d.day}</span>
                  <small>{d.dDay}</small>
                  <small>{d.date}</small>
                </TestDayBtn>
              ))}
            </TestGrid>
            <TestResetBtn onClick={() => setTestDay(null)}>
              오늘 날짜로 초기화
            </TestResetBtn>
          </TestPanel>
        )}
      </Body>

      {/* 로그인 유도 */}
      {!session && (
        <LoginBar>
          <LoginBarText>로그인하고 챌린지에 참여해보세요!</LoginBarText>
          <LoginBarBtn onClick={() => router.push("/login?redirect=/hub_up/challenge")}>
            로그인
          </LoginBarBtn>
        </LoginBar>
      )}
    </Wrap>
  );
}

// ─── Styled ──────────────────────────────────────────────────

const Wrap = styled.div`
  width: 100%;
  min-height: 100vh;
  background: ${PRIMARY};
  font-family: 'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
  padding-bottom: 100px;
`;

const LoadingWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: ${WHITE};
  font-size: 15px;
`;

const Header = styled.div`
  position: sticky;
  top: 0;
  z-index: 100;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: ${PRIMARY};
`;

const BackBtn = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  color: ${WHITE};
  cursor: pointer;
  padding: 8px;
`;

const HeaderTitle = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 16px;
  font-weight: 600;
  color: ${WHITE};
`;

const Body = styled.div`
  padding: 0 20px 40px;
`;

const SubLabel = styled.p`
  margin: 28px 0 4px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  color: rgba(255, 255, 255, 0.85);
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  line-height: 37px;
  text-align: center;
  letter-spacing: -0.02em;
  color: ${WHITE};
`;

/* 소개 텍스트 접기/펼치기 */
const IntroBox = styled.div`
  margin: 20px 0 28px;
  background: rgba(255, 255, 255, 0.08);
  border-left: 3px solid ${LIGHT_BLUE};
  border-radius: 0 8px 8px 0;
  overflow: hidden;
`;

const IntroText = styled.div<{ $expanded: boolean }>`
  font-size: 14px;
  font-weight: 400;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.8);
  white-space: pre-line;
  padding: 16px 16px 0 16px;
  overflow: hidden;
  max-height: ${(p) => (p.$expanded ? "3000px" : "96px")};
  transition: max-height 0.45s ease;
  -webkit-mask-image: ${(p) =>
    p.$expanded
      ? "none"
      : "linear-gradient(to bottom, black 50%, transparent 100%)"};
  mask-image: ${(p) =>
    p.$expanded
      ? "none"
      : "linear-gradient(to bottom, black 50%, transparent 100%)"};
`;

const IntroToggleBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  padding: 10px 16px;
  background: none;
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: ${LIGHT_BLUE};
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  letter-spacing: 0.02em;
`;

const PracticeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 16px 0 32px;
`;

const PracticeItem = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 23px;
  letter-spacing: -0.02em;
  color: ${WHITE};
`;

const DayBadge = styled.div`
  font-size: 16px;
  font-weight: 600;
  line-height: 37px;
  text-align: center;
  color: ${WHITE};
`;

const SectionTitle = styled.h2`
  margin: 0 0 32px;
  font-size: 28px;
  font-weight: 700;
  line-height: 37px;
  text-align: center;
  letter-spacing: -0.02em;
  color: ${WHITE};
`;

const IllustProgressWrap = styled.div`
  position: relative;
  margin-bottom: 32px;
  padding-top: 90px;
`;

/* 일러스트 — progressPercent 위치에 따라 프로그레스 바 위에서 수평 이동 */
const IllustImg = styled.div`
  position: absolute;
  bottom: 12px;
  width: 52px;
  transition: left 0.4s ease;

  img {
    width: 100%;
    height: auto;
    display: block;
  }
`;

const LogoCircle = styled.div`
  position: absolute;
  right: 0;
  bottom: 18px;
  width: 45px;
  height: 45px;
  background: ${LIGHT_BLUE};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ProgressBg = styled.div`
  position: relative;
  height: 4px;
  background: #cdcdcd;
  border-radius: 99px;
`;

const ProgressFill = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: ${LIGHT_BLUE};
  border-radius: 99px;
  transition: width 0.4s ease;
`;

const ProgressDot = styled.div`
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 8.15px;
  height: 8.15px;
  background: ${WHITE};
  border-radius: 50%;
  transition: left 0.4s ease;
`;

const DayCard = styled.div`
  margin-bottom: 24px;
`;

const DayCardBadge = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: ${WHITE};
  margin-bottom: 20px;
`;

const DayCardText = styled.span`
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${PRIMARY};
`;

const DayCardSep = styled.span`
  font-size: 16px;
  color: ${PRIMARY};
  opacity: 0.4;
`;

const PracticeDetailList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PracticeDetailItem = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 23px;
  letter-spacing: -0.02em;
  color: ${WHITE};
`;

const TextareaWrap = styled.div`
  position: relative;
  margin-bottom: 8px;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 115px;
  padding: 12px 12px 32px;
  background: ${WHITE};
  border: 1px solid #7a57b8;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: -0.02em;
  color: ${PRIMARY};
  font-family: inherit;
  resize: none;
  box-sizing: border-box;

  &::placeholder { color: #b4b4b4; }
  &:focus { outline: none; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const CharCount = styled.div`
  position: absolute;
  bottom: 10px;
  right: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #888;
`;

const CertifyBtn = styled.button<{ disabled?: boolean }>`
  display: block;
  width: 100%;
  height: 48px;
  margin-bottom: 24px;
  background: ${WHITE};
  border: none;
  font-size: 16px;
  font-weight: 700;
  color: ${PRIMARY};
  font-family: inherit;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  opacity: ${(p) => (p.disabled ? 0.5 : 1)};
  letter-spacing: -0.02em;
`;

const LoadingText = styled.p`
  text-align: center;
  padding: 32px 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin: 0;
`;

const EmptyText = styled.p`
  text-align: center;
  padding: 32px 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  margin: 0;
`;

const ShareCard = styled.div<{ $isMine?: boolean }>`
  background: ${WHITE};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 10px;
  border: ${(p) => (p.$isMine ? `2px solid ${LIGHT_BLUE}` : "none")};
`;

const ShareCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const ShareNum = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #888;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MineTag = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: ${PRIMARY};
  background: ${LIGHT_BG};
  padding: 1px 6px;
  border-radius: 99px;
`;

const EditBtn = styled.button`
  font-size: 12px;
  font-weight: 600;
  color: ${PRIMARY};
  background: ${LIGHT_BG};
  border: none;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  font-family: inherit;
`;

const EditBox = styled.div``;

const EditTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 10px;
  background: #f5f7ff;
  border: 1.5px solid ${LIGHT_BLUE};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.6;
  color: ${PRIMARY};
  font-family: inherit;
  resize: none;
  box-sizing: border-box;
  &:focus { outline: none; border-color: ${PRIMARY}; }
`;

const EditFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
`;

const EditCharCount = styled.span`
  font-size: 11px;
  color: #aaa;
`;

const EditActions = styled.div`
  display: flex;
  gap: 6px;
`;

const EditCancelBtn = styled.button`
  font-size: 13px;
  font-weight: 600;
  color: #888;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  cursor: pointer;
  font-family: inherit;
`;

const EditSaveBtn = styled.button<{ disabled?: boolean }>`
  font-size: 13px;
  font-weight: 700;
  color: ${WHITE};
  background: ${PRIMARY};
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  opacity: ${(p) => (p.disabled ? 0.5 : 1)};
  font-family: inherit;
`;

const ShareContent = styled.div`
  font-size: 15px;
  font-weight: 500;
  line-height: 1.65;
  letter-spacing: -0.01em;
  color: #222;
  white-space: pre-wrap;
  word-break: keep-all;
`;

const MoreBtn = styled.button`
  display: block;
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: ${WHITE};
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  margin-bottom: 12px;
`;

/* 페이지네이션 */
const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 16px 0 8px;
`;

const PageBtn = styled.button<{ $active?: boolean; disabled?: boolean }>`
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  background: ${(p) => (p.$active ? WHITE : "rgba(255,255,255,0.12)")};
  border: 1px solid ${(p) => (p.$active ? WHITE : "rgba(255,255,255,0.25)")};
  border-radius: 6px;
  color: ${(p) => (p.$active ? PRIMARY : p.disabled ? "rgba(255,255,255,0.25)" : WHITE)};
  font-size: 14px;
  font-weight: ${(p) => (p.$active ? 700 : 500)};
  font-family: inherit;
  cursor: ${(p) => (p.disabled ? "default" : "pointer")};
  transition: all 0.15s ease;
`;

/* ── 테스트 패널 ── */
const TestPanel = styled.div`
  margin-top: 40px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
`;

const TestLabel = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 12px;
  text-align: center;
`;

const TestGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 12px;
`;

const TestDayBtn = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  background: ${(p) => (p.$active ? WHITE : "rgba(255,255,255,0.12)")};
  border: 1px solid ${(p) => (p.$active ? WHITE : "rgba(255,255,255,0.2)")};
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;

  span {
    font-size: 13px;
    font-weight: 700;
    color: ${(p) => (p.$active ? PRIMARY : WHITE)};
  }
  small {
    font-size: 10px;
    color: ${(p) => (p.$active ? PRIMARY : "rgba(255,255,255,0.6)")};
    line-height: 1.3;
  }
`;

const TestResetBtn = styled.button`
  display: block;
  width: 100%;
  padding: 8px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
`;

/* 로그인 유도 바 */
const LoginBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${WHITE};
  border-top: 1px solid #e5e5ea;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  z-index: 99;
`;

const LoginBarText = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #111;
`;

const LoginBarBtn = styled.button`
  padding: 10px 20px;
  background: ${PRIMARY};
  color: ${WHITE};
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
`;
