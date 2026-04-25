"use client";

import { useState, useEffect, useRef } from "react";
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
  // 프로그레스 바 ref (인증 후 스크롤 타겟)
  const progressRef = useRef<HTMLDivElement>(null);
  // 일러스트 애니메이션 강조
  const [progressAnimating, setProgressAnimating] = useState(false);
  // 인증 완료 팝업
  const [showCertifyPopup, setShowCertifyPopup] = useState(false);
  // 팝업 확인 전까지 보류할 progress 데이터
  const pendingProgressRef = useRef<MyProgress | null>(null);

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
        // 나눔 목록 새로고침
        const [progressRes, sharesRes] = await Promise.all([
          fetch("/api/hub-challenge/my-progress"),
          fetch(`/api/hub-challenge/shares?day=${dayData.day}&page=1&limit=5`),
        ]);
        const progressData = await progressRes.json();
        const sharesData = await sharesRes.json();
        // progress는 팝업 버튼 누를 때까지 보류 (사람 이동 방지)
        if (!progressData.error) pendingProgressRef.current = progressData;
        if (!sharesData.error) {
          setShares(sharesData.shares || []);
          setTotalShares(sharesData.total || 0);
          setPage(1);
        }
        // 팝업 표시 (사람 이동은 팝업 버튼에서)
        setShowCertifyPopup(true);
      } else {
        alert(data.error || "나눔 작성에 실패했습니다.");
      }
    } catch {
      alert("나눔 작성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 팝업 '한 발자국 동행하기' 버튼 → 사람 이동 + 스크롤
  const handleWalkStep = () => {
    setShowCertifyPopup(false);
    // 보류했던 progress 적용 → 사람 이동
    if (pendingProgressRef.current) {
      setMyProgress(pendingProgressRef.current);
      pendingProgressRef.current = null;
    }
    setTimeout(() => {
      progressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setProgressAnimating(true);
      setTimeout(() => setProgressAnimating(false), 1800);
    }, 100);
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
            {'\'나 너희 하나님 여호와가 거룩하니 너희도 거룩해야 한다.\''}{'\n\n'}
            {'하나님께서 주신 이 말씀을\n허브가 함께 지켜 행하려 합니다.'}{'\n\n'}
            {'이 말씀은 단순한 명령이 아니라,'}{'\n'}
            {'우리와 동행하여 함께 기쁨을 누리고 싶으신'}{'\n'}
            {'하나님께서 우리를 부르시는 거룩한 초대입니다.'}{'\n\n'}
            {'우리는 본래 거룩하신 하나님 앞에'}{'\n'}
            {'나아갈 수 없는 존재이지만'}{'\n\n'}
            {'우리의 죄를 대속해 주신\n예수님의 사랑과 은혜로 인해'}{'\n'}
            {'\'의롭다 함을\' 얻어\n\n어느 때, 어느 곳에서든지'}{'\n'}
            {'말씀을 통해, 기도를 통해'}{'\n'}
            {'하나님께 가까이 나아갈 수 있게 되었습니다.'}{'\n\n'}
            {'이제 우리는 그 사랑과 은혜에 반응하여'}{'\n'}
            {'레위기 19장에 나타난'}{'\n'}
            {'하나님 사랑, 이웃 사랑과 관련된'}{'\n'}
            {'구체적인 말씀들을 하나 하나 함께\n실천해보고자 합니다.'}{'\n\n'}
            {'성공과 실패에 집중하기보다'}{'\n'}
            {'하나님의 임재를 사모하며\n그 안에서 참된 기쁨을 누려봅시다.'}{'\n\n'}
            {'이번 여정을 통해,'}{'\n'}
            {'거룩하신 하나님과 더욱 긴밀히 동행하여'}{'\n'}
            {'하나님 나라를 이 땅에 이루는\n허브 공동체가 되길 소망합니다.'}
          </IntroText>
          <IntroToggleBtn onClick={() => setIntroExpanded((v) => !v)}>
            {introExpanded ? "접기 ↑" : "전체 보기 ↓"}
          </IntroToggleBtn>
        </IntroBox>

        {/* Day N */}
        <DayBadge>Day {dayData.day}</DayBadge>

        {/* 오늘의 실천 */}
        <SectionTitle>오늘의 실천</SectionTitle>

        {/* ㄹ자 프로그레스 바 */}
        <ZigzagProgress
          completedDays={myProgress?.completedDays.length ?? 0}
          animating={progressAnimating}
          forwardedRef={progressRef}
        />

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
            placeholder={`오늘의 실천 결과를 나눠주세요.\n실패한 이야기도 괜찮아요.`}
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

      {/* 인증 완료 팝업 */}
      {showCertifyPopup && (
        <PopupOverlay>
          <PopupBox onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <PopupIllust src="/images/challenge/challenge_illust.png" alt="" />
            <PopupTitle>오늘의 실천 완료!</PopupTitle>
            <PopupDesc>
              하나님과 한 발자국 더 동행했어요.{"\n"}
              내일도 함께 걸어가요.
            </PopupDesc>
            <PopupWalkBtn onClick={handleWalkStep}>
              한 발자국 동행하기
            </PopupWalkBtn>
          </PopupBox>
        </PopupOverlay>
      )}
    </Wrap>
  );
}

// ─── ㄹ자 프로그레스 컴포넌트 ────────────────────────────────
// Figma 스펙: 경로 290×169.5px, stroke 9px, BeHoly 45×45 원
// viewBox에 좌우/상단 여백을 포함해 잘림 없이 표시

function ZigzagProgress({
  completedDays,
  animating,
  forwardedRef,
}: {
  completedDays: number;
  animating: boolean;
  forwardedRef: React.RefObject<HTMLDivElement | null>;
}) {
  const BH_R = 22.5;       // BeHoly 원 반지름 (45/2)
  const ILLUST_W = 44;
  const ILLUST_H = 52;

  // viewBox 여백
  const PAD_L = ILLUST_W / 2 + 2;  // 왼쪽: 일러스트 반폭 + 여유
  const PAD_R = BH_R + 2;           // 오른쪽: BeHoly 반지름 + 여유
  const PAD_T = ILLUST_H + 8;       // 상단: 일러스트 높이 + 여유
  const PAD_B = BH_R + 4;           // 하단: BeHoly 반지름 + 여유

  // 경로 크기 (Figma 스펙)
  const PATH_W = 240;
  const PATH_H = 169.5;
  const SW = 9;             // stroke-width
  const SH = SW / 2;        // 4.5

  // 경로 stroke 중심선 좌표
  const PL = PAD_L + SH;
  const PR = PAD_L + PATH_W - SH;
  const PT = PAD_T + SH;
  const MID_Y = PAD_T + PATH_H / 2;
  const BOT_Y = PAD_T + PATH_H - SH;

  // viewBox 전체 크기
  const VB_W = PAD_L + PATH_W + PAD_R;
  const VB_H = PAD_T + PATH_H + PAD_B;

  // 세그먼트 길이
  const seg = [
    PR - PL,        // 상단 가로
    MID_Y - PT,     // 오른쪽 수직
    PR - PL,        // 중단 가로
    BOT_Y - MID_Y,  // 왼쪽 수직
    PR - PL,        // 하단 가로
  ];
  const totalLen = seg.reduce((a, b) => a + b, 0);

  function posOnPath(d: number): { x: number; y: number } {
    let r = d;
    if (r <= seg[0]) return { x: PL + r, y: PT };
    r -= seg[0];
    if (r <= seg[1]) return { x: PR, y: PT + r };
    r -= seg[1];
    if (r <= seg[2]) return { x: PR - r, y: MID_Y };
    r -= seg[2];
    if (r <= seg[3]) return { x: PL, y: MID_Y + r };
    r -= seg[3];
    return { x: PL + r, y: BOT_Y };
  }

  // 포인트: Day1~19를 경로 위에 균등 배치
  // interval = totalLen / 20 → Day1=1칸, Day19=19칸, 앞뒤 여유 1칸씩
  const interval = totalLen / 20;
  const points = Array.from({ length: 19 }, (_, i) => posOnPath((i + 1) * interval));

  // 완료 경로 길이: completedDays번째 점까지
  const doneLen = completedDays === 0 ? 0
    : completedDays >= 19 ? totalLen
    : completedDays * interval;

  // 일러스트 위치:
  //   Day0 (미완료) → 경로 시작점 앞 (PL, PT)
  //   Day1~19 → 해당 점 위치
  const illustPos = completedDays === 0
    ? { x: PL, y: PT }
    : posOnPath(completedDays * interval);

  const bgPath = `${PL},${PT} ${PR},${PT} ${PR},${MID_Y} ${PL},${MID_Y} ${PL},${BOT_Y} ${PR},${BOT_Y}`;

  function getDonePath(): string {
    const pts: string[] = [`${PL},${PT}`];
    if (doneLen <= 0) return `${PL},${PT}`;
    let r = doneLen;
    if (r >= seg[0]) { pts.push(`${PR},${PT}`); r -= seg[0]; } else { pts.push(`${PL + r},${PT}`); return pts.join(" "); }
    if (r >= seg[1]) { pts.push(`${PR},${MID_Y}`); r -= seg[1]; } else { pts.push(`${PR},${PT + r}`); return pts.join(" "); }
    if (r >= seg[2]) { pts.push(`${PL},${MID_Y}`); r -= seg[2]; } else { pts.push(`${PR - r},${MID_Y}`); return pts.join(" "); }
    if (r >= seg[3]) { pts.push(`${PL},${BOT_Y}`); r -= seg[3]; } else { pts.push(`${PL},${MID_Y + r}`); return pts.join(" "); }
    pts.push(`${PL + r},${BOT_Y}`);
    return pts.join(" ");
  }

  const illustX = illustPos.x - ILLUST_W / 2;
  const illustY = illustPos.y - ILLUST_H - 4;

  return (
    <ZigzagWrap ref={forwardedRef}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        style={{ display: "block" }}
        aria-hidden="true"
      >
        {/* 배경 경로 */}
        <polyline points={bgPath} fill="none" stroke="#CDCDCD" strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />

        {/* 완료 경로 */}
        {doneLen > 0 && (
          <polyline points={getDonePath()} fill="none" stroke={LIGHT_BLUE} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* 19개 점 */}
        {points.map((pt, i) => {
          const day = i + 1;
          const done = day <= completedDays;
          const isCurrent = day === completedDays;
          return (
            <circle
              key={day}
              cx={pt.x}
              cy={pt.y}
              r={isCurrent ? 6 : done ? 5 : 4}
              fill={done ? LIGHT_BLUE : "#CDCDCD"}
              stroke={isCurrent ? "rgba(141,173,255,0.45)" : "none"}
              strokeWidth={isCurrent ? 4 : 0}
            />
          );
        })}

        {/* BeHoly: 45×45 파란 원 + 로고 이미지 */}
        <circle cx={PR} cy={BOT_Y} r={BH_R} fill={LIGHT_BLUE} />
        <image
          href="/images/challenge/challenge_logo.png"
          x={PR - 16.5}
          y={BOT_Y - 4.5}
          width={33}
          height={9}
          preserveAspectRatio="xMidYMid meet"
        />

        {/* 일러스트 */}
        <image
          href="/images/challenge/challenge_illust.png"
          x={illustX}
          y={illustY}
          width={ILLUST_W}
          height={ILLUST_H}
          style={{ filter: animating ? "drop-shadow(0 0 8px rgba(141,173,255,0.9))" : undefined }}
        />
      </svg>
    </ZigzagWrap>
  );
}

// ─── Styled ──────────────────────────────────────────────────

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
  border-radius: 8px;
  overflow: hidden;
`;

const IntroText = styled.div<{ $expanded: boolean }>`
  font-size: 14px;
  font-weight: 400;
  line-height: 1.7;
  color: ${WHITE};
  white-space: pre-line;
  padding: 16px 16px 0 16px;
  overflow: hidden;
  text-align: center;
  /* 8줄 = font-size(14px) * line-height(1.7) * 8 = ~190.4px, 상단 padding 포함 */
  max-height: ${(p) => (p.$expanded ? "3000px" : "calc(14px * 1.9 * 8 + 16px)")};
  transition: max-height 0.45s ease;
  -webkit-mask-image: ${(p) =>
    p.$expanded
      ? "none"
      : "linear-gradient(to bottom, black 55%, transparent 100%)"};
  mask-image: ${(p) =>
    p.$expanded
      ? "none"
      : "linear-gradient(to bottom, black 55%, transparent 100%)"};
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

const ZigzagWrap = styled.div`
  margin: 0 0 32px;
  padding: 0;
`;

const DayCard = styled.div`
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const DayCardBadge = styled.div`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 8px 20px;
  background: ${WHITE};
  margin: 0 auto 20px;
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
  align-items: center;
  width: 100%;
`;

const PracticeDetailItem = styled.p`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 23px;
  letter-spacing: -0.02em;
  color: #FFFFFF;
  text-align: center;
  width: 299px;
  word-break: keep-all;
  overflow-wrap: break-word;
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

/* ── 인증 완료 팝업 ── */
const PopupOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 24px;
`;

const PopupBox = styled.div`
  width: 100%;
  max-width: 320px;
  background: ${PRIMARY};
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 32px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
`;

const PopupIllust = styled.img`
  width: 80px;
  height: auto;
  margin-bottom: 16px;
`;

const PopupTitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: ${WHITE};
  margin-bottom: 10px;
  letter-spacing: -0.02em;
`;

const PopupDesc = styled.p`
  font-size: 14px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.75);
  text-align: center;
  line-height: 1.7;
  white-space: pre-line;
  margin: 0 0 24px;
`;

const PopupWalkBtn = styled.button`
  width: 100%;
  height: 48px;
  background: ${WHITE};
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  color: ${PRIMARY};
  font-family: inherit;
  cursor: pointer;
  margin-bottom: 10px;
  letter-spacing: -0.02em;
`;

const PopupCloseBtn = styled.button`
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.45);
  font-family: inherit;
  cursor: pointer;
  padding: 4px 8px;
`;
