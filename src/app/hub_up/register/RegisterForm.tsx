"use client";

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { DepartureSlot, ReturnSlot, ElectiveLecture, HubUpConfig, FormData } from './types';

// ─────────────────────────────────────────────
// 자차 관련 고정 옵션 (날짜 기반이라 DB 불필요)
// ─────────────────────────────────────────────
const ARRIVAL_TIME_OPTIONS = [
  '5/15 18:00', '5/15 19:00', '5/15 20:00', '5/15 21:00', '5/15 22:00', '5/15 23:00',
  '5/16 이후 입소',
];
const DEPART_TIME_OPTIONS = [
  '5/17 07:00', '5/17 08:00', '5/17 09:00', '5/17 10:00',
  '5/17 11:00', '5/17 11:30', '5/17 12:00', '5/17 이후',
];

const PHONE_REGEX = /^01[0-9]-\d{3,4}-\d{4}$/;
const PRIMARY_COLOR = '#F25246';

const initialFormData: FormData = {
  community: '', group: '', leaderName: '', name: '', gender: '',
  birthdate: '', phone: '', privacyConsent: false,
  departureBusTime: '', returnBusTime: '', carRole: '',
  carPassengerCount: '', carPassengerNames: '', carPlateNumber: '',
  carArrivalTime: '', carDepartureTime: '',
  electiveLecture: '', depositConfirm: false,
  intercessorTeam: '', volunteerTeam: '', finalSubmitConfirm: false,
};

interface Props {
  departureSlots: DepartureSlot[];
  returnSlots: ReturnSlot[];
  electives: ElectiveLecture[];
  config: HubUpConfig;
  initialSlotCounts: Record<string, number>;
}

export default function RegisterForm({
  departureSlots, returnSlots, electives, config, initialSlotCounts,
}: Props) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [step, setStep] = useState(0);
  const totalSteps = 5;
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [phoneError, setPhoneError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [groupOptions, setGroupOptions] = useState<string[]>([]);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>(initialSlotCounts);

  // 바텀 시트 상태 관리
  const [activeSheet, setActiveSheet] = useState<'community' | 'group' | 'gender' | null>(null);

  // ── 프로필 + 그룹목록 fetch ──────────────────────────────
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login?redirect=/hub_up/register');
      return;
    }
    if (sessionStatus === 'authenticated' && session?.user && !isProfileLoaded) {
      const fetchData = async () => {
        try {
          const res = await fetch('/api/user/profile');
          if (res.ok) {
            const result = await res.json();
            
            // 성별 데이터 매핑 ('M', 'F' 등을 한글로 변환)
            let mappedGender = '';
            if (result.gender) {
              const g = result.gender.toUpperCase();
              if (g === 'M' || g === 'MALE' || result.gender === '남자') mappedGender = '남자';
              else if (g === 'F' || g === 'FEMALE' || result.gender === '여자') mappedGender = '여자';
            }

            setFormData((prev) => ({
              ...prev,
              name: result.name || '',
              gender: mappedGender, // 매핑된 성별 할당
              birthdate: result.birth_date || '',
              community: result.community || '',
              // 옵션 포맷(OO그룹 OO다락방)과 일치하도록 기본값 세팅 수정
              group: result.group_name && result.cell_name
                ? `${result.group_name}그룹 ${result.cell_name}다락방` : '',
            }));
          }
          const [cellsRes, groupsRes] = await Promise.all([
            fetch('/api/common/cells'),
            fetch('/api/common/groups'),
          ]);
          if (cellsRes.ok && groupsRes.ok) {
            const cellsJson = await cellsRes.json();
            const groupsJson = await groupsRes.json();
            const groupMap = new Map<number, string>();
            if (Array.isArray(groupsJson)) {
              groupsJson.forEach((g: any) => groupMap.set(g.id, g.name));
            }
            const cellsArray: any[] = Array.isArray(cellsJson.cells)
              ? cellsJson.cells : Array.isArray(cellsJson) ? cellsJson : [];
            const formatted = cellsArray
              .map((cell: any) => `${groupMap.get(cell.group_id) || '기타'}그룹 ${cell.name}다락방`)
              .sort((a: string, b: string) => a.localeCompare(b));
            setGroupOptions([...Array.from(new Set(formatted)) as string[], '해당없음']);
          } else {
            setGroupOptions(['해당없음']);
          }
        } catch (err) {
          console.error('Error loading profile/groups:', err);
        } finally {
          setIsProfileLoaded(true);
        }
      };
      fetchData();
    }
  }, [sessionStatus, session, router, isProfileLoaded]);

  // ── 슬롯 카운트 실시간 갱신 ──────────
  useEffect(() => {
    fetch('/api/hub-up/form-data')
      .then((r) => r.json())
      .then((data) => { if (data.slotCounts) setSlotCounts(data.slotCounts); })
      .catch(console.error);
  }, [step]);

  // ── helpers ──────────────────────────────────────────────
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const nextStep = () => { scrollTop(); setStep((s) => Math.min(s + 1, totalSteps)); };
  const prevStep = () => { scrollTop(); setStep((s) => Math.max(s - 1, 0)); };
  const set = (field: keyof FormData, value: string | boolean) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    set('phone', val);
    setPhoneError(val && !PHONE_REGEX.test(val)
      ? "올바른 형식으로 입력해주세요. (ex. 010-1234-5678)" : '');
  };

  const isCarSelected = formData.departureBusTime === 'car' || formData.returnBusTime === 'car';

  const checkStep1Valid = () => {
    return formData.community && formData.group && formData.leaderName && formData.name && formData.gender && formData.phone && formData.privacyConsent && !phoneError;
  };

  // ── 제출 ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    try {
      const res = await fetch('/api/hub-up/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || '제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        return;
      }
      scrollTop();
      setStep(6);
    } catch {
      setSubmitError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleStepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && !PHONE_REGEX.test(formData.phone)) {
      setPhoneError("올바른 형식으로 입력해주세요. (ex. 010-1234-5678)");
      return;
    }
    if (step === totalSteps) handleSubmit(e);
    else nextStep();
  };

  if (sessionStatus === 'loading' || (sessionStatus === 'authenticated' && !isProfileLoaded)) {
    return <HubUpLoader />;
  }

  // 바텀 시트 렌더링 함수
  const renderBottomSheet = () => {
    if (!activeSheet) return null;

    let title = '';
    let options: string[] = [];
    let currentValue = '';
    let onSelect = (val: string) => {};

    if (activeSheet === 'community') {
      title = '소속 공동체';
      options = ['허브', '타공동체(온누리교회)', '타교회'];
      currentValue = formData.community;
      onSelect = (val) => set('community', val);
    } else if (activeSheet === 'group') {
      title = '그룹 / 다락방';
      options = groupOptions;
      currentValue = formData.group;
      onSelect = (val) => set('group', val);
    } else if (activeSheet === 'gender') {
      title = '성별';
      options = ['남자', '여자'];
      currentValue = formData.gender;
      onSelect = (val) => set('gender', val);
    }

    return (
      <BottomSheetOverlay onClick={() => setActiveSheet(null)}>
        <BottomSheetContainer onClick={(e) => e.stopPropagation()}>
          <SheetDragHandle />
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <CloseButton onClick={() => setActiveSheet(null)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </CloseButton>
          </SheetHeader>
          <SheetContent>
            {options.map((opt) => (
              <SheetOption
                key={opt}
                selected={currentValue === opt}
                onClick={() => {
                  onSelect(opt);
                  setActiveSheet(null);
                }}
              >
                <CheckIcon selected={currentValue === opt}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </CheckIcon>
                <OptionText selected={currentValue === opt}>{opt}</OptionText>
              </SheetOption>
            ))}
          </SheetContent>
        </BottomSheetContainer>
      </BottomSheetOverlay>
    );
  };

  return (
    <Container>
      {/* ── 상단 네비게이션 ── */}
      <TopNav>
        <BackButton onClick={step > 0 && step < 6 ? prevStep : () => router.back()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 19L8 12L15 5" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </BackButton>
      </TopNav>

      {/* ── 프로그레스 바 (Step 1~5에서만 표시) ── */}
      {step >= 1 && step <= totalSteps && (
        <ProgressContainer>
          <ProgressFill width={(step / totalSteps) * 100} />
        </ProgressContainer>
      )}

      {/* ── STEP 0: 랜딩/안내사항 ── */}
      {step === 0 && (
        <LandingWrapper>
          <HeroSection>
            <HeroDate>{config.event_dates}</HeroDate>
            <HeroTitle>Title Title Title</HeroTitle>
            <HeroSubTitle>(메인 메세지)</HeroSubTitle>
            <HeroImagePlaceholder>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="#BDBDBD">
                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z"/>
              </svg>
              <span>키비주얼</span>
            </HeroImagePlaceholder>
          </HeroSection>

          <InfoSection>
            <InfoGrid>
              <InfoLabel>일정</InfoLabel>
              <InfoData>
                <strong>{config.event_dates}</strong>
                <p>Companion1은 5월 15일, ??시에 시작됩니다.</p>
              </InfoData>

              <InfoLabel>장소</InfoLabel>
              <InfoData>
                <strong>{config.event_venue}</strong>
                <p>{config.event_venue_address}</p>
              </InfoData>

              <InfoLabel>신청</InfoLabel>
              <InfoData>
                <strong>4월 21일 (일) - 5월 8일 (수)</strong>
                <p>최대 {config.max_capacity}명 신청 가능</p>
              </InfoData>

              <InfoLabel>회비</InfoLabel>
              <InfoData>
                <FeeGrid>
                  <div>
                    <strong>얼리버드 {config.fee_early_bird}원</strong>
                    <p>{config.fee_early_bird_until}</p>
                  </div>
                  <div>
                    <strong>일반 {config.fee_regular}원</strong>
                    <p>{config.registration_deadline}</p>
                  </div>
                </FeeGrid>
                <p className="account">{config.bank_name} {config.bank_account} / {config.bank_holder}</p>
              </InfoData>
            </InfoGrid>
          </InfoSection>

          <GuideSection>
            <GuideBlock>
              <GuideTitle>입금 주의사항</GuideTitle>
              <GuideList>
                <li>회비를 입금 하셔야 접수 완료 입니다.</li>
                <li>입금자명 이름+연락처 끝 네자리 기입 요망 (ex. 홍길동8572)</li>
                <li>입금 후 확인 문자가 발송되오니, 연락처를 정확히 기재 바랍니다.</li>
                <li>신청자와 입금자명이 다를 경우 {config.contact_name}에게 연락 주셔야 확인됩니다.</li>
                <li>부분참석도 회비는 동일합니다.</li>
              </GuideList>
            </GuideBlock>

            <GuideBlock>
              <GuideTitle>회비 환불 안내</GuideTitle>
              <GuideList>
                <li>5월 18일 (토) 자정까지 환불 신청 가능합니다.</li>
              </GuideList>
            </GuideBlock>

            <GuideBlock>
              <GuideTitle>접수 확인</GuideTitle>
              <GuideList>
                <li>1차 : 4월 13일 (월) 오후 ??시</li>
                <li>2차 : 4월 20일 (월) 오후 8시</li>
                <li>3차 : 4월 27일 (월) 20시</li>
              </GuideList>
              <GuideSubText>
                ※ 월요일 20시 이후 신청자는 "차주 수요일" 발송<br/>
                ※ 해당일에 문자를 받지 못하신 분은 {config.contact_name}에게 연락주세요 :)
              </GuideSubText>
            </GuideBlock>

            <GuideBlock>
              <GuideTitle>문의</GuideTitle>
              <GuideList>
                <li>{config.contact_name} ({config.contact_phone})</li>
              </GuideList>
            </GuideBlock>
          </GuideSection>

          <BottomNavFixed>
            <PrimaryButton onClick={nextStep}>
              신청서 작성하기
            </PrimaryButton>
          </BottomNavFixed>
        </LandingWrapper>
      )}

      {/* ── Form 영역 ── */}
      {step >= 1 && step <= totalSteps && (
        <FormWrapper onSubmit={handleStepSubmit}>
          <StepContent>
            {/* ── STEP 1: 기본 정보 ── */}
            {step === 1 && (
              <>
                <FormHeader>
                  허브업 등록을 위한<br/>
                  기본정보를 입력해주세요
                </FormHeader>

                <InputGroup>
                  <Label>소속 공동체</Label>
                  <SelectField onClick={() => setActiveSheet('community')}>
                    <span className={formData.community ? 'selected' : 'placeholder'}>
                      {formData.community || '소속 공동체 선택'}
                    </span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9L12 15L18 9" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </SelectField>
                </InputGroup>

                <InputGroup>
                  <Label>그룹 / 다락방</Label>
                  <SelectField onClick={() => setActiveSheet('group')}>
                    <span className={formData.group ? 'selected' : 'placeholder'}>
                      {formData.group || '그룹 / 다락방 선택'}
                    </span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9L12 15L18 9" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </SelectField>
                </InputGroup>

                <InputGroup>
                  <Label>순장님 이름</Label>
                  <UnderlineInput 
                    type="text" 
                    placeholder="이름 입력" 
                    value={formData.leaderName}
                    onChange={(e) => set('leaderName', e.target.value)}
                    required 
                  />
                  <HelperText>
                    *순모임 미참여 시 "없음"이라고 작성해주세요.<br/>
                    *HUB 외 타 공동체인 경우 소속된 공동체를 작성해주세요.
                  </HelperText>
                </InputGroup>

                <InputGroup>
                  <Label>신청자 이름</Label>
                  <UnderlineInput 
                    type="text" 
                    placeholder="이름 입력" 
                    value={formData.name}
                    onChange={(e) => set('name', e.target.value)}
                    required 
                  />
                </InputGroup>

                <InputGroup>
                  <Label>생년월일</Label>
                  <SubLabel>동명이인을 확인하기 위함입니다.</SubLabel>
                  <UnderlineInput
                    type="text"
                    placeholder="0000년 00월 00일"
                    value={formData.birthdate}
                    onChange={(e) => set('birthdate', e.target.value)}
                    required
                  />
                </InputGroup>

                <InputGroup>
                  <Label>성별</Label>
                  <SelectField onClick={() => setActiveSheet('gender')}>
                    <span className={formData.gender ? 'selected' : 'placeholder'}>
                      {formData.gender || '성별 선택'}
                    </span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9L12 15L18 9" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </SelectField>
                </InputGroup>

                <InputGroup>
                  <Label>연락처 <span style={{fontWeight: 400, color: '#888', fontSize: '12px'}}>(ex. 010-1234-5678 / 하이픈 '-' 포함)</span></Label>
                  <UnderlineInput 
                    type="tel" 
                    placeholder="연락처 입력" 
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    required 
                  />
                  {phoneError && <ErrorText>{phoneError}</ErrorText>}
                </InputGroup>

                <ConsentWrapper onClick={() => set('privacyConsent', !formData.privacyConsent)}>
                  <ConsentText>
                    <strong>개인정보 수집 및 이용에 대한 동의</strong>
                    <p>수집한 개인정보는 신청 후 안내 및 공지에 사용하며,<br/>수련회 이후 파기됩니다.</p>
                  </ConsentText>
                  <CheckIcon selected={formData.privacyConsent}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </CheckIcon>
                </ConsentWrapper>
              </>
            )}

            {/* Step 2~5 내용 */}
            {step === 2 && (
              <>
                <FormHeader>차량 탑승 정보</FormHeader>
                <LegacySection>
                  <Label>[5/15] 출발 차량 탑승 시각</Label>
                  <SubLabel>선착순 마감됩니다. 마감된 시간대는 선택할 수 없습니다.</SubLabel>
                  <LegacySelect value={formData.departureBusTime} onChange={(e) => set('departureBusTime', e.target.value)} required>
                    <option value="">선택해주세요</option>
                    {departureSlots.map((slot) => {
                      const isFull = slot.max_count > 0 && (slotCounts[slot.value] || 0) >= slot.max_count;
                      return (
                        <option key={slot.value} value={slot.value} disabled={isFull}>
                          {slot.label} {isFull ? '(마감)' : ''}
                        </option>
                      );
                    })}
                  </LegacySelect>
                </LegacySection>

                <LegacySection>
                  <Label>[5/17] 복귀 차량 탑승 시각</Label>
                  <LegacySelect value={formData.returnBusTime} onChange={(e) => set('returnBusTime', e.target.value)} required>
                    <option value="">선택해주세요</option>
                    {returnSlots.map((slot) => (
                      <option key={slot.value} value={slot.value}>{slot.label}</option>
                    ))}
                  </LegacySelect>
                </LegacySection>

                {isCarSelected && (
                  <>
                    <LegacySection>
                      <Label>자차 / 대중교통 해당사항 체크</Label>
                      <SubLabel>주차 대수 파악을 위한 조사입니다.</SubLabel>
                      <LegacySelect value={formData.carRole} onChange={(e) => set('carRole', e.target.value)} required>
                        <option value="">선택해주세요</option>
                        <option value="자가운전자">자가운전자 (주차O)</option>
                        <option value="동승자">동승자 (주차X)</option>
                        <option value="택시 및 대중교통">택시 및 대중교통 이용</option>
                      </LegacySelect>
                    </LegacySection>

                    {formData.carRole === '자가운전자' && (
                      <>
                        <LegacySection>
                          <Label>총 탑승 인원</Label>
                          <SubLabel>본인 포함 최대 8명</SubLabel>
                          <LegacySelect value={formData.carPassengerCount} onChange={(e) => set('carPassengerCount', e.target.value)} required>
                            <option value="">선택</option>
                            <option value="1">1명 (혼자 - 동승자 없음)</option>
                            {[2,3,4,5,6,7,8].map((n) => (
                              <option key={n} value={String(n)}>{n}명</option>
                            ))}
                          </LegacySelect>
                        </LegacySection>

                        {formData.carPassengerCount && formData.carPassengerCount !== '1' && (
                          <InputGroup>
                            <Label>동승자 이름</Label>
                            <SubLabel>쉼표(,)로 구분해서 작성해주세요.</SubLabel>
                            <UnderlineInput
                              type="text"
                              placeholder="예: 홍길동, 김철수"
                              value={formData.carPassengerNames}
                              onChange={(e) => set('carPassengerNames', e.target.value)}
                            />
                          </InputGroup>
                        )}

                        <InputGroup>
                          <Label>차량 번호</Label>
                          <UnderlineInput
                            type="text"
                            placeholder="예: 12가 3456"
                            value={formData.carPlateNumber}
                            onChange={(e) => set('carPlateNumber', e.target.value)}
                            required
                          />
                        </InputGroup>
                      </>
                    )}

                    {(formData.carRole === '자가운전자' || formData.carRole === '동승자') && (
                      <LegacySection>
                        <Label>입소 예정 시간</Label>
                        <LegacySelect value={formData.carArrivalTime} onChange={(e) => set('carArrivalTime', e.target.value)} required>
                          <option value="">선택해주세요</option>
                          {ARRIVAL_TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </LegacySelect>
                      </LegacySection>
                    )}

                    {formData.carRole !== '' && formData.carRole !== '택시 및 대중교통' && (
                      <LegacySection>
                        <Label>퇴소 예정 시간</Label>
                        <LegacySelect value={formData.carDepartureTime} onChange={(e) => set('carDepartureTime', e.target.value)} required>
                          <option value="">선택해주세요</option>
                          {DEPART_TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </LegacySelect>
                      </LegacySection>
                    )}
                  </>
                )}
              </>
            )}

            {step === 3 && (
               <>
                 <FormHeader>선택강의 및 입금 확인</FormHeader>
                 <LegacySection>
                   <Label>선택강의 수강 조사</Label>
                   <SubLabel>허브업 기간 중 진행되는 선택강의입니다. 중복 신청은 불가합니다.</SubLabel>
                   <ElectiveGroup>
                     {electives.map((e) => (
                       <ElectiveCard
                         key={e.value}
                         selected={formData.electiveLecture === e.value}
                         onClick={() => set('electiveLecture', formData.electiveLecture === e.value ? '' : e.value)}
                       >
                         <ElectiveCheck selected={formData.electiveLecture === e.value}>
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                             <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                           </svg>
                         </ElectiveCheck>
                         <span>{e.label}</span>
                       </ElectiveCard>
                     ))}
                   </ElectiveGroup>
                 </LegacySection>
                 <ConsentWrapper onClick={() => set('depositConfirm', !formData.depositConfirm)}>
                  <ConsentText>
                    <strong>입금 확인</strong>
                    <p>입금 하신 후 신청서 제출 부탁드립니다.</p>
                  </ConsentText>
                  <CheckIcon selected={formData.depositConfirm}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </CheckIcon>
                </ConsentWrapper>
               </>
            )}

            {step === 4 && (
              <>
                <FormHeader>팀 섬김 신청</FormHeader>
                <LegacySection>
                  <Label>중보팀 섬김 여부</Label>
                  <LegacySelect value={formData.intercessorTeam} onChange={(e) => set('intercessorTeam', e.target.value)} required>
                     <option value="">선택해주세요</option>
                     <option value="신청">신청합니다</option>
                     <option value="없음">해당 없음</option>
                  </LegacySelect>
                </LegacySection>
                <LegacySection>
                  <Label>자원봉사 섬김 여부</Label>
                  <LegacySelect value={formData.volunteerTeam} onChange={(e) => set('volunteerTeam', e.target.value)} required>
                     <option value="">선택해주세요</option>
                     <option value="신청">신청합니다</option>
                     <option value="없음">해당 없음</option>
                  </LegacySelect>
                </LegacySection>
              </>
            )}

            {step === 5 && (
              <>
                <FormHeader>최종 제출 확인</FormHeader>
                <ConsentWrapper onClick={() => set('finalSubmitConfirm', !formData.finalSubmitConfirm)}>
                  <ConsentText>
                    <strong>위 내용을 제출하시겠습니까?</strong>
                    <p>제출 후에는 수정이 어려우니 신중하게 확인해주세요.</p>
                  </ConsentText>
                  <CheckIcon selected={formData.finalSubmitConfirm}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </CheckIcon>
                </ConsentWrapper>
                {submitError && <ErrorText>{submitError}</ErrorText>}
              </>
            )}

          </StepContent>

          <BottomNavInline>
            <PrevTextButton type="button" onClick={prevStep}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{marginRight: '4px'}}>
                <path d="M15 19L8 12L15 5" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              이전
            </PrevTextButton>
            
            {step < totalSteps ? (
              <NextStepButton type="submit" disabled={step === 1 && !checkStep1Valid()}>
                다음
              </NextStepButton>
            ) : (
              <NextStepButton type="submit" disabled={!formData.finalSubmitConfirm}>
                제출
              </NextStepButton>
            )}
          </BottomNavInline>
        </FormWrapper>
      )}

      {/* ── STEP 6: 제출 완료 ── */}
      {step === 6 && (
        <CompleteWrapper>
          <FormHeader style={{textAlign: 'center', marginTop: '60px'}}>제출이 완료되었습니다!</FormHeader>
          <p style={{textAlign: 'center', color: '#666', lineHeight: 1.6}}>
            입금 확인 후 접수가 완료되며,<br/>
            확인 문자가 발송될 예정입니다.
          </p>
        </CompleteWrapper>
      )}

      {renderBottomSheet()}
    </Container>
  );
}

// ═══════════════════════════════════════════════════════════
// Styled Components
// ═══════════════════════════════════════════════════════════

const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  background-color: #FAFAFA;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  position: relative;
`;

const TopNav = styled.div`
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: #FFF;
`;

const BackButton = styled.button`
  background: none; border: none; padding: 8px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
`;

const ProgressContainer = styled.div`
  width: 100%; height: 2px; background: #E5E5EA;
`;

const ProgressFill = styled.div<{ width: number }>`
  height: 100%; background: #111; width: ${(p) => p.width}%;
  transition: width 0.3s ease;
`;

// ── 랜딩 페이지 (Step 0) 디자인 ──
const LandingWrapper = styled.div`
  background: #F8F8F8;
  padding-bottom: 100px; /* 하단 고정버튼 공간 */
`;

const HeroSection = styled.div`
  text-align: center;
  padding: 40px 20px;
`;

const HeroDate = styled.p`
  color: #888; font-size: 14px; margin: 0 0 8px 0;
`;

const HeroTitle = styled.h1`
  font-size: 24px; font-weight: 700; color: #111; margin: 0 0 8px 0;
`;

const HeroSubTitle = styled.p`
  font-size: 18px; color: #111; font-weight: 600; margin: 0 0 32px 0;
`;

const HeroImagePlaceholder = styled.div`
  width: 120px; height: 120px; background: #E5E5EA; border-radius: 16px;
  margin: 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #888; font-size: 12px; gap: 8px;
`;

const InfoSection = styled.div`
  background: #FFF; padding: 32px 24px; margin-bottom: 12px;
`;

const InfoGrid = styled.div`
  display: grid; grid-template-columns: 40px 1fr; gap: 24px 16px;
`;

const InfoLabel = styled.div`
  color: ${PRIMARY_COLOR}; font-weight: 600; font-size: 14px; padding-top: 2px;
`;

const InfoData = styled.div`
  color: #111; font-size: 15px; line-height: 1.5;
  strong { display: block; margin-bottom: 4px; font-weight: 600; }
  p { margin: 0; color: #888; font-size: 13px; }
  .account { color: #666; margin-top: 8px; }
`;

const FeeGrid = styled.div`
  display: flex; gap: 24px;
  div { flex: 1; }
`;

const GuideSection = styled.div`
  background: #FFF; padding: 32px 24px;
`;

const GuideBlock = styled.div`
  margin-bottom: 32px;
  &:last-child { margin-bottom: 0; }
`;

const GuideTitle = styled.h3`
  font-size: 15px; font-weight: 700; color: #111; margin: 0 0 12px 0;
`;

const GuideList = styled.ul`
  list-style: none; padding: 0; margin: 0;
  li {
    position: relative; padding-left: 12px; font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 6px;
    &::before { content: '•'; position: absolute; left: 0; top: 0; color: #888; }
  }
`;

const GuideSubText = styled.p`
  font-size: 12px; color: #888; margin: 12px 0 0 0; line-height: 1.5;
`;

const BottomNavFixed = styled.div`
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px;
  padding: 16px 20px 32px 20px; background: #F8F8F8;
`;

const PrimaryButton = styled.button`
  width: 100%; background: ${PRIMARY_COLOR}; color: #FFF; font-size: 16px; font-weight: 600;
  padding: 16px; border-radius: 12px; border: none; cursor: pointer;
  &:disabled { background: #E5E5EA; color: #AFAFAF; cursor: not-allowed; }
`;

// ── 폼 입력 페이지 (Step 1~5) 디자인 ──
const FormWrapper = styled.form`
  display: flex; flex-direction: column; min-height: calc(100vh - 58px);
  background: #FFF;
`;

const StepContent = styled.div`
  flex: 1; padding: 32px 0;
`;

const FormHeader = styled.h2`
  font-size: 22px; font-weight: 700; color: #111; line-height: 1.4; margin: 0 0 40px 0;
  padding: 0 24px;
`;

const InputGroup = styled.div`
  margin-bottom: 32px;
  padding: 0 24px;
`;

const Label = styled.label`
  display: block; font-size: 13px; color: #888; margin-bottom: 8px; font-weight: 500;
`;

const SelectField = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px solid #E5E5EA; cursor: pointer;
  span.selected { color: #111; font-size: 16px; }
  span.placeholder { color: #AFAFAF; font-size: 16px; }
`;

const UnderlineInput = styled.input`
  width: 100%; border: none; border-bottom: 1px solid #E5E5EA; padding: 8px 0;
  font-size: 16px; color: #111; background: transparent; outline: none;
  &::placeholder { color: #AFAFAF; }
  &:focus { border-bottom-color: #111; }
`;

const HelperText = styled.p`
  font-size: 12px; color: #888; margin: 8px 0 0 0; line-height: 1.4;
`;

const ErrorText = styled.p`
  font-size: 12px; color: ${PRIMARY_COLOR}; margin: 8px 0 0 0;
`;

const ConsentWrapper = styled.div`
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 24px 24px 0 24px; margin-top: 16px; cursor: pointer;
`;

const ConsentText = styled.div`
  strong { display: block; font-size: 15px; color: #111; margin-bottom: 8px; font-weight: 600; }
  p { margin: 0; font-size: 12px; color: #888; line-height: 1.5; }
`;

const BottomNavInline = styled.div`
  padding: 16px 24px 32px 24px; display: flex; justify-content: space-between; align-items: center;
`;

const PrevTextButton = styled.button`
  background: none; border: none; color: #888; font-size: 15px; font-weight: 500;
  display: flex; align-items: center; cursor: pointer; padding: 8px 0;
`;

const NextStepButton = styled.button`
  background: ${PRIMARY_COLOR}; color: #FFF; font-size: 15px; font-weight: 600;
  padding: 12px 32px; border-radius: 12px; border: none; cursor: pointer;
  &:disabled { background: #F4F4F4; color: #AFAFAF; cursor: not-allowed; }
`;

// ── 바텀 시트 관련 컴포넌트 ──
const BottomSheetOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4);
  z-index: 100; display: flex; flex-direction: column; justify-content: flex-end;
  animation: fadeIn 0.2s ease-out;
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;

const BottomSheetContainer = styled.div`
  background: #FFF; border-radius: 24px 24px 0 0; padding: 12px 24px 32px 24px;
  max-width: 480px; width: 100%; margin: 0 auto;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
`;

const SheetDragHandle = styled.div`
  width: 40px; height: 4px; background: #E5E5EA; border-radius: 2px; margin: 0 auto 20px auto;
`;

const SheetHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
`;

const SheetTitle = styled.h3`
  font-size: 16px; font-weight: 700; color: #111; margin: 0;
`;

const CloseButton = styled.button`
  background: none; border: none; padding: 4px; cursor: pointer;
`;

const SheetContent = styled.div`
  max-height: 50vh; overflow-y: auto;
  /* 커스텀 스크롤바 */
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #E5E5EA; border-radius: 2px; }
`;

const SheetOption = styled.div<{ selected: boolean }>`
  display: flex; align-items: center; padding: 16px 12px; gap: 12px; cursor: pointer;
  border-radius: 8px;
  margin: 0 -12px; /* 패딩을 보정해서 라인 맞추기 */
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(242, 82, 70, 0.05); /* 마우스 호버시 연한 빨간색 배경 */
    
    span {
      color: ${PRIMARY_COLOR};
    }
    div {
      color: ${PRIMARY_COLOR};
    }
  }
`;

const OptionText = styled.span<{ selected: boolean }>`
  font-size: 16px; color: ${(p) => p.selected ? PRIMARY_COLOR : '#111'};
  font-weight: ${(p) => p.selected ? 600 : 400};
  transition: color 0.2s ease;
`;

const CheckIcon = styled.div<{ selected: boolean }>`
  color: ${(p) => p.selected ? PRIMARY_COLOR : '#E5E5EA'};
  display: flex; align-items: center; justify-content: center;
  transition: color 0.2s ease;
`;

// ── 기타 공통 컴포넌트 ──
const CompleteWrapper = styled.div`
  background: #FFF; min-height: calc(100vh - 58px); padding: 24px;
`;

const LegacySection = styled.div`
  margin-bottom: 24px;
  padding: 0 24px;
`;

const LegacySelect = styled.select`
  width: 100%; border: none; border-bottom: 1px solid #E5E5EA; padding: 8px 0;
  font-size: 16px; background: transparent; outline: none; appearance: none;
`;

const SubLabel = styled.p`
  font-size: 12px; color: #888; margin: 4px 0 12px 0; line-height: 1.4;
`;

const ElectiveGroup = styled.div`
  display: flex; flex-direction: column; gap: 10px; margin-top: 8px;
`;

const ElectiveCard = styled.div<{ selected: boolean }>`
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; border-radius: 12px; cursor: pointer;
  border: 1.5px solid ${(p) => p.selected ? PRIMARY_COLOR : '#E5E5EA'};
  background: ${(p) => p.selected ? '#FFF5F5' : 'white'};
  font-size: 15px; font-weight: ${(p) => p.selected ? 600 : 400};
  color: ${(p) => p.selected ? PRIMARY_COLOR : '#111'};
  transition: all 0.15s;
`;

const ElectiveCheck = styled.div<{ selected: boolean }>`
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: ${(p) => p.selected ? PRIMARY_COLOR : 'transparent'};
  border: 1.5px solid ${(p) => p.selected ? PRIMARY_COLOR : '#CCC'};
  color: white; transition: all 0.15s;
`;

const LoaderWrap = styled.div`
  min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; background: #FAFAFA;
`;
const Spinner = styled.div`
  width: 40px; height: 40px; border-radius: 50%; border: 3px solid #FDECEB; border-top-color: ${PRIMARY_COLOR};
  animation: spin 0.8s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;
const LoaderText = styled.div`
  font-size: 14px; color: ${PRIMARY_COLOR}; font-weight: 500;
`;
function HubUpLoader() {
  return (
    <LoaderWrap>
      <Spinner />
      <LoaderText>정보를 불러오는 중입니다</LoaderText>
    </LoaderWrap>
  );
}