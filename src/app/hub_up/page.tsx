"use client";

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type CarRole = '' | '자가운전자' | '동승자' | '택시 및 대중교통';

interface FormData {
  community: string;
  group: string;
  leaderName: string;
  name: string;
  gender: string;
  birthdate: string;
  phone: string;
  privacyConsent: boolean;

  departureBusTime: string;
  returnBusTime: string;
  carRole: CarRole;
  carPassengerCount: string;
  carPassengerNames: string;
  carPlateNumber: string;
  carArrivalTime: string;
  carDepartureTime: string;

  electiveLecture: string;
  depositConfirm: boolean;

  intercessorTeam: string;
  volunteerTeam: string;
  finalSubmitConfirm: boolean;
}

const initialFormData: FormData = {
  community: '',
  group: '',
  leaderName: '',
  name: '',
  gender: '',
  birthdate: '',
  phone: '',
  privacyConsent: false,
  departureBusTime: '',
  returnBusTime: '',
  carRole: '',
  carPassengerCount: '',
  carPassengerNames: '',
  carPlateNumber: '',
  carArrivalTime: '',
  carDepartureTime: '',
  electiveLecture: '',
  depositConfirm: false,
  intercessorTeam: '',
  volunteerTeam: '',
  finalSubmitConfirm: false,
};

// ─────────────────────────────────────────────
// 슬롯 정의 (최대 인원만 내부적으로 관리)
// ─────────────────────────────────────────────
const DEPARTURE_SLOTS = [
  { value: 'bus-선발대', label: '선발대', max: 43 },
  { value: 'bus-18:00', label: '18:00', max: 86 },
  { value: 'bus-18:30', label: '18:30', max: 86 },
  { value: 'bus-19:00', label: '19:00', max: 258 },
  { value: 'bus-20:00', label: '20:00', max: 172 },
  { value: 'car', label: '자차/대중교통 이용', max: Infinity },
];

const RETURN_SLOTS = [
  { value: 'bus-7:00', label: '7:00 (차세대 및 예배섬김에 한함)', max: Infinity },
  { value: 'bus-11:30', label: '11:30', max: Infinity },
  { value: 'car', label: '자차/대중교통 이용', max: Infinity },
];

const ARRIVAL_TIME_OPTIONS = [
  '5/15 18:00', '5/15 19:00', '5/15 20:00', '5/15 21:00', '5/15 22:00', '5/15 23:00',
  '5/16 이후 입소',
];
const DEPART_TIME_OPTIONS = [
  '5/17 07:00', '5/17 08:00', '5/17 09:00', '5/17 10:00', '5/17 11:00', '5/17 11:30', '5/17 12:00', '5/17 이후',
];

const PHONE_REGEX = /^01[0-9]-\d{3,4}-\d{4}$/;

// ═══════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════
export default function HubUpSurvey() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [step, setStep] = useState(0);
  const totalSteps = 5;

  const [isNoticeChecked, setIsNoticeChecked] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [phoneError, setPhoneError] = useState('');
  const [submitError, setSubmitError] = useState('');

  // 그룹/다락방 동적 로드
  const [groupOptions, setGroupOptions] = useState<string[]>([]);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  // 슬롯별 현재 신청 인원 map: slotValue -> count
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({});

  // ── 1) 프로필 + 그룹목록 fetch ──────────────────────────
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login?redirect=/hub_up');
      return;
    }

    if (sessionStatus === 'authenticated' && session?.user && !isProfileLoaded) {
      const fetchData = async () => {
        try {
          const res = await fetch('/api/user/profile');
          if (res.ok) {
            const result = await res.json();
            setFormData((prev) => ({
              ...prev,
              name: result.name || '',
              gender: result.gender || '',
              birthdate: result.birth_date || '',
              community: result.community || '',
              group: result.group_name && result.cell_name
                ? `${result.group_name}-${result.cell_name}` : '',
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
              ? cellsJson.cells
              : Array.isArray(cellsJson) ? cellsJson : [];

            const formatted = cellsArray
              .map((cell: any) => `${groupMap.get(cell.group_id) || '기타'}-${cell.name}`)
              .sort((a: string, b: string) => a.localeCompare(b));

            const unique = Array.from(new Set(formatted)) as string[];
            setGroupOptions([...unique, '해당없음']);
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

  // ── 2) 슬롯 잔여석 fetch (차량 step 진입 시) ────────────
  const fetchSlotCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('hub_up_registrations')
        .select('departure_slot');

      if (error) { console.error('slot count error:', error); return; }

      const counts: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        const s = row.departure_slot;
        if (s) counts[s] = (counts[s] || 0) + 1;
      });
      setSlotCounts(counts);
    } catch (err) {
      console.error('fetchSlotCounts:', err);
    }
  };

  useEffect(() => {
    if (step === 2) fetchSlotCounts();
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
      ? "하이픈('-')을 포함한 올바른 형식으로 입력해주세요. (예: 010-1234-5678)"
      : '');
  };

  const isCarSelected = formData.departureBusTime === 'car' || formData.returnBusTime === 'car';

  // ── 제출 ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    try {
      const { error } = await supabase.from('hub_up_registrations').insert([{
        user_id: session?.user?.id || null,
        community: formData.community,
        group_name: formData.group,
        leader_name: formData.leaderName,
        name: formData.name,
        gender: formData.gender,
        birthdate: formData.birthdate,
        phone: formData.phone,
        privacy_consent: formData.privacyConsent,

        departure_slot: formData.departureBusTime,
        return_slot: formData.returnBusTime,
        car_role: formData.carRole || null,
        car_passenger_count: formData.carPassengerCount || null,
        car_passenger_names: formData.carPassengerNames || null,
        car_plate_number: formData.carPlateNumber || null,
        car_arrival_time: formData.carArrivalTime || null,
        car_departure_time: formData.carDepartureTime || null,

        elective_lecture: formData.electiveLecture,
        deposit_confirm: formData.depositConfirm,

        intercessor_team: formData.intercessorTeam,
        volunteer_team: formData.volunteerTeam,
      }]);

      if (error) {
        console.error('submit error:', error);
        setSubmitError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        return;
      }

      scrollTop();
      setStep(6);
    } catch (err) {
      console.error('submit exception:', err);
      setSubmitError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleStepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && !PHONE_REGEX.test(formData.phone)) {
      setPhoneError("하이픈('-')을 포함한 올바른 형식으로 입력해주세요. (예: 010-1234-5678)");
      return;
    }
    if (step === totalSteps) {
      handleSubmit(e);
    } else {
      nextStep();
    }
  };

  if (sessionStatus === 'loading' || (sessionStatus === 'authenticated' && !isProfileLoaded)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontSize: '15px' }}>
        기본 정보를 불러오고 있습니다... 🌸
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────
  return (
    <FormContainer>

      {/* ── STEP 0: 안내사항 ── */}
      {step === 0 && (
        <StepWrapper key="step-0">
          <NoticeSection>
            <NoticeHeader>
              <NoticeTitle>[24 허브업] Companion</NoticeTitle>
              <NoticeSubTitle>설문을 시작하기 전에 아래 안내사항을 꼭 읽어주세요.</NoticeSubTitle>
            </NoticeHeader>

            <NoticeContentArea>
              <NoticeBlock>
                <BlockTitle>📅 일정 및 장소</BlockTitle>
                <BlockText>• <strong>일정:</strong> 5월 15-17일 (금-주일)</BlockText>
                <BlockText style={{ color: '#d93025', fontSize: '14px', marginTop: '2px', marginBottom: '8px' }}>
                  ❗️ Companion1은 5월 15일, 추후 공지 예정 시간에 시작됩니다.
                </BlockText>
                <BlockText>• <strong>장소:</strong> 소망 수양관<br />&nbsp;&nbsp;&nbsp;(경기도 광주시 곤지암읍 건업길 122-83)</BlockText>
              </NoticeBlock>

              <NoticeBlock>
                <BlockTitle>💸 회비 및 입금 안내</BlockTitle>
                <BlockText>• <strong>얼리버드</strong> (4/12~4/18): 80,000원</BlockText>
                <BlockText>• <strong>일반</strong> (4/19~4/26): 85,000원</BlockText>
                <BlockText>• <strong>입금계좌:</strong> 하나은행 (계좌번호) / (예금주)</BlockText>
                <HighlightBox>
                  <strong style={{ color: '#1d4ed8' }}>📍 입금 주의사항 안내</strong><br />
                  - 회비를 입금 하셔야 접수 완료 입니다.<br />
                  - 입금자명 이름+연락처 끝 네자리 기입 요망 (ex. 홍길동8572)<br />
                  - 입금 후 확인 문자가 발송되오니, 연락처를 정확히 기재 바랍니다.<br />
                  - 신청자와 입금자명이 다를 경우 서기MC에게 연락 주셔야 확인됩니다.<br />
                  - 부분참석도 회비는 동일합니다.
                </HighlightBox>
              </NoticeBlock>

              <NoticeBlock>
                <BlockTitle>⚠️ 회비 환불</BlockTitle>
                <BlockText>• 5월 3일 (일) 자정까지 환불 신청 가능</BlockText>
              </NoticeBlock>

              <NoticeBlock>
                <BlockTitle>📝 신청 및 접수 확인</BlockTitle>
                <BlockText>• <strong>신청 기간:</strong> 4월 12일 (주일) ~ 4월 26일(주일) 또는 인원 마감시 (700명)</BlockText>
                <BlockText>• <strong>접수 확인:</strong></BlockText>
                <BlockText style={{ paddingLeft: '14px' }}>
                  1차 : 4월 13일 (월) 시간 추후 공지<br />
                  2차 : 4월 20일 (월) 20시<br />
                  3차 : 4월 27일 (월) 20시
                </BlockText>
                <BlockText style={{ color: '#5f6368', fontSize: '13.5px', marginTop: '6px' }}>
                  ※ 월요일 20시 이후 신청자는 &quot;차주 월요일&quot; 발송<br />
                  ※ 해당일에 문자를 받지 못하신 분은 서기MC에게 연락주세요 :)
                </BlockText>
              </NoticeBlock>

              <NoticeBlock>
                <BlockTitle>📞 문의</BlockTitle>
                <BlockText>• 서기MC (010-8284-3283)</BlockText>
              </NoticeBlock>

              <Divider />

              <CheckboxLabel checked={isNoticeChecked}>
                <input
                  type="checkbox"
                  checked={isNoticeChecked}
                  onChange={(e) => setIsNoticeChecked(e.target.checked)}
                />
                <span>위 안내사항을 모두 꼼꼼히 읽었으며, 숙지하였습니다.</span>
              </CheckboxLabel>
              <StartButton disabled={!isNoticeChecked} onClick={nextStep}>
                설문 시작하기
              </StartButton>
            </NoticeContentArea>
          </NoticeSection>
        </StepWrapper>
      )}

      {/* ── STEP 6: 제출 완료 ── */}
      {step === 6 && (
        <StepWrapper key="step-6">
          <SubmitCompleteSection>
            <SubmitCompleteIcon>✅</SubmitCompleteIcon>
            <SubmitCompleteTitle>제출이 완료되었습니다!</SubmitCompleteTitle>
            <SubmitCompleteMessage>
              [24 허브업] Companion 신청서가 성공적으로 제출되었습니다.<br /><br />
              입금 확인 후 접수가 완료되며,<br />
              확인 문자가 발송될 예정입니다.<br /><br />
              <strong>입금 계좌</strong><br />
              하나은행 (계좌번호) / (예금주)<br /><br />
              입금시 <strong>이름+연락처 끝 네자리</strong> 기입 요망<br />
              (ex. 홍길동8572)
            </SubmitCompleteMessage>
            <SubmitCompleteNote>
              문의: 서기MC (010-8284-3283)
            </SubmitCompleteNote>
          </SubmitCompleteSection>
        </StepWrapper>
      )}

      {/* ── STEP 1~5: 설문 ── */}
      {step >= 1 && step <= totalSteps && (
        <>
          <TitleBlock>
            <Title>[24 허브업] Companion</Title>
            <Description>
              허브업 등록을 위한 설문입니다.<br />
              <RequiredAsterisk>*</RequiredAsterisk> 표시는 필수 질문입니다.
            </Description>
          </TitleBlock>

          <ProgressBarContainer>
            <Progress fill={(step / totalSteps) * 100} />
          </ProgressBarContainer>
          <StepIndicator>Step {step} of {totalSteps}</StepIndicator>

          <form onSubmit={handleStepSubmit}>
            <StepWrapper key={`step-${step}`}>

              {/* ── 2p: 기본 정보 ── */}
              {step === 1 && (
                <Section>
                  <SectionTitle>기본 정보</SectionTitle>

                  <Field>
                    <Label>소속 공동체 <RequiredAsterisk>*</RequiredAsterisk></Label>
                    <RadioGroup>
                      {['허브', '타공동체 (온누리교회)', '타교회'].map((v) => (
                        <RadioLabel key={v} checked={formData.community === v}>
                          <input type="radio" name="community" value={v} required
                            checked={formData.community === v}
                            onChange={() => set('community', v)} /> {v}
                        </RadioLabel>
                      ))}
                    </RadioGroup>
                  </Field>

                  <Field>
                    <Label>그룹/다락방 <RequiredAsterisk>*</RequiredAsterisk></Label>
                    <Select name="group" value={formData.group} required
                      onChange={(e) => set('group', e.target.value)}>
                      <option value="">선택해주세요</option>
                      {groupOptions.map((g) => <option key={g} value={g}>{g}</option>)}
                    </Select>
                  </Field>

                  <Field>
                    <Label>순장님 성함 <RequiredAsterisk>*</RequiredAsterisk>
                      <SubLabel>*순모임에 참여하고 있지 않는 경우 &quot;없음&quot;이라고 적어주세요.</SubLabel>
                      <SubLabel>**HUB 외 타 공동체인 경우 소속된 공동체를 적어주세요.</SubLabel>
                    </Label>
                    <Input type="text" value={formData.leaderName} required
                      placeholder="내 답변"
                      onChange={(e) => set('leaderName', e.target.value)} />
                  </Field>

                  <Field>
                    <Label>이름 <RequiredAsterisk>*</RequiredAsterisk></Label>
                    <Input type="text" value={formData.name} required
                      placeholder="홍길동"
                      onChange={(e) => set('name', e.target.value)} />
                  </Field>

                  <Field>
                    <Label>성별 <RequiredAsterisk>*</RequiredAsterisk></Label>
                    <RadioGroup>
                      {['남', '여'].map((v) => (
                        <RadioLabel key={v} checked={formData.gender === v}>
                          <input type="radio" name="gender" value={v} required
                            checked={formData.gender === v}
                            onChange={() => set('gender', v)} /> {v}
                        </RadioLabel>
                      ))}
                    </RadioGroup>
                  </Field>

                  <Field>
                    <Label>생년월일 <RequiredAsterisk>*</RequiredAsterisk>
                      <SubLabel>동명이인을 확인하기 위함입니다</SubLabel>
                    </Label>
                    <Input type="text" value={formData.birthdate} required
                      placeholder="0000년 00월 00일"
                      onChange={(e) => set('birthdate', e.target.value)} />
                  </Field>

                  <Field>
                    <Label>연락처 <RequiredAsterisk>*</RequiredAsterisk>
                      <SubLabel>ex. 010-1234-5678 / 하이픈 &apos;-&apos;을 꼭 넣어서 작성해주세요</SubLabel>
                    </Label>
                    <Input type="tel" value={formData.phone} required
                      placeholder="010-0000-0000"
                      onChange={handlePhoneChange}
                      style={phoneError ? { borderColor: '#d93025' } : {}} />
                    {phoneError && <ErrorText>{phoneError}</ErrorText>}
                  </Field>

                  <Field>
                    <Label>개인정보 수집 및 이용에 대한 동의 <RequiredAsterisk>*</RequiredAsterisk>
                      <SubLabel>수집한 개인정보는 신청 후 안내 및 공지에 사용하며, 수련회 이후 파기됩니다.</SubLabel>
                    </Label>
                    <RadioLabel checked={formData.privacyConsent}>
                      <input type="checkbox"
                        checked={formData.privacyConsent}
                        onChange={(e) => set('privacyConsent', e.target.checked)}
                        required
                      /> 동의합니다
                    </RadioLabel>
                  </Field>
                </Section>
              )}

              {/* ── 3p: 차량 ── */}
              {step === 2 && (
                <Section>
                  <SectionTitle>차량</SectionTitle>

                  <Field>
                    <Label>[5/15] 차량 탑승 시각 <RequiredAsterisk>*</RequiredAsterisk>
                      <SubLabel>선착순 마감됩니다. 마감된 시간대는 선택할 수 없습니다.</SubLabel>
                    </Label>
                    <RadioGroup>
                      {DEPARTURE_SLOTS.map((slot) => {
                        const count = slotCounts[slot.value] || 0;
                        const isFull = count >= slot.max;
                        return (
                          <RadioLabel key={slot.value}
                            checked={formData.departureBusTime === slot.value}
                            disabled={isFull}>
                            <input type="radio" name="departureBusTime" value={slot.value} required
                              disabled={isFull}
                              checked={formData.departureBusTime === slot.value}
                              onChange={() => !isFull && set('departureBusTime', slot.value)} />
                            <span>
                              {slot.label}
                              {isFull && <SoldOutBadge>마감</SoldOutBadge>}
                            </span>
                          </RadioLabel>
                        );
                      })}
                    </RadioGroup>
                  </Field>

                  <Divider />

                  <Field>
                    <Label>[5/17] 복귀 차량 탑승 시각 <RequiredAsterisk>*</RequiredAsterisk></Label>
                    <RadioGroup>
                      {RETURN_SLOTS.map((slot) => (
                        <RadioLabel key={slot.value} checked={formData.returnBusTime === slot.value}>
                          <input type="radio" name="returnBusTime" value={slot.value} required
                            checked={formData.returnBusTime === slot.value}
                            onChange={() => set('returnBusTime', slot.value)} />
                          {slot.label}
                        </RadioLabel>
                      ))}
                    </RadioGroup>
                  </Field>

                  {isCarSelected && (
                    <>
                      <Divider />
                      <CarDetailsBox>
                        <WarningText>🚗 자차/대중교통 이용자 추가 정보</WarningText>

                        <Field>
                          <Label>자차/대중교통 해당사항 체크 <RequiredAsterisk>*</RequiredAsterisk>
                            <SubLabel>주차 대수 파악을 위한 조사입니다.</SubLabel>
                          </Label>
                          <RadioGroup>
                            {([
                              ['자가운전자', '자가운전자 (주차O)'],
                              ['동승자', '동승자 (주차X)'],
                              ['택시 및 대중교통', '택시 및 대중교통 이용'],
                            ] as const).map(([val, label]) => (
                              <RadioLabel key={val} checked={formData.carRole === val}>
                                <input type="radio" name="carRole" value={val} required
                                  checked={formData.carRole === val}
                                  onChange={() => set('carRole', val)} />
                                {label}
                              </RadioLabel>
                            ))}
                          </RadioGroup>
                        </Field>

                        {formData.carRole === '자가운전자' && (
                          <>
                            <Field>
                              <Label>총 탑승 인원 <RequiredAsterisk>*</RequiredAsterisk>
                                <SubLabel>본인 포함 최대 8명</SubLabel>
                              </Label>
                              <Select value={formData.carPassengerCount} required
                                onChange={(e) => set('carPassengerCount', e.target.value)}>
                                <option value="">선택</option>
                                <option value="1">1명 (혼자 - 동승자 없음)</option>
                                {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                                  <option key={n} value={String(n)}>{n}명</option>
                                ))}
                              </Select>
                            </Field>
                            {formData.carPassengerCount && formData.carPassengerCount !== '1' && (
                              <Field>
                                <Label>동승자 이름 기입
                                  <SubLabel>쉼표(,)로 구분해서 작성해주세요.</SubLabel>
                                </Label>
                                <Input type="text" value={formData.carPassengerNames}
                                  placeholder="예: 홍길동, 김철수"
                                  onChange={(e) => set('carPassengerNames', e.target.value)} />
                              </Field>
                            )}
                            <Field>
                              <Label>차량 번호 <RequiredAsterisk>*</RequiredAsterisk></Label>
                              <Input type="text" value={formData.carPlateNumber} required
                                placeholder="예: 12가 3456"
                                onChange={(e) => set('carPlateNumber', e.target.value)} />
                            </Field>
                          </>
                        )}

                        {(formData.carRole === '자가운전자' || formData.carRole === '동승자') && (
                          <Field>
                            <Label>입소 예정 시간 <RequiredAsterisk>*</RequiredAsterisk></Label>
                            <Select value={formData.carArrivalTime} required
                              onChange={(e) => set('carArrivalTime', e.target.value)}>
                              <option value="">선택해주세요</option>
                              {ARRIVAL_TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </Select>
                          </Field>
                        )}

                        {formData.carRole !== '' && formData.carRole !== '택시 및 대중교통' && (
                          <Field>
                            <Label>퇴소 예정 시간 <RequiredAsterisk>*</RequiredAsterisk></Label>
                            <Select value={formData.carDepartureTime} required
                              onChange={(e) => set('carDepartureTime', e.target.value)}>
                              <option value="">선택해주세요</option>
                              {DEPART_TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </Select>
                          </Field>
                        )}
                      </CarDetailsBox>
                    </>
                  )}
                </Section>
              )}

              {/* ── 4p: 선택강의 + 입금 ── */}
              {step === 3 && (
                <Section>
                  <SectionTitle>선택강의 및 입금 확인</SectionTitle>

                  <Field>
                    <Label>선택강의 수강 조사 <RequiredAsterisk>*</RequiredAsterisk>
                      <SubLabel>허브업 기간 중 진행되는 선택강의입니다. 중복 신청은 불가합니다.</SubLabel>
                    </Label>
                    <RadioGroup>
                      {[
                        ['연애/결혼', '연애 / 결혼'],
                        ['돈/재정', '돈 / 재정'],
                      ].map(([val, label]) => (
                        <RadioLabel key={val} checked={formData.electiveLecture === val}>
                          <input type="radio" name="electiveLecture" value={val} required
                            checked={formData.electiveLecture === val}
                            onChange={() => set('electiveLecture', val)} />
                          {label}
                        </RadioLabel>
                      ))}
                    </RadioGroup>
                  </Field>

                  <Divider />

                  <NoticeBox>
                    <strong>입금 하신 후 신청서 제출 부탁드립니다. <RequiredAsterisk>*</RequiredAsterisk></strong><br />
                    하나 (계좌번호) / (예금주)<br />
                    입금시 본인 연락처 끝 네자리 기입 필수<br />
                    <span style={{ color: '#5f6368', fontSize: '13px' }}>EX. 이지원3283</span>
                  </NoticeBox>

                  <Field>
                    <RadioLabel checked={formData.depositConfirm}>
                      <input type="checkbox"
                        checked={formData.depositConfirm}
                        required
                        onChange={(e) => set('depositConfirm', e.target.checked)} />
                      입금했습니다
                    </RadioLabel>
                    <SubLabel style={{ marginTop: '12px', color: '#f59e0b', fontWeight: 600 }}>
                      ※ 얼리버드 및 기획 이벤트 진행 시 양식이 변경될 가능성이 있습니다.
                    </SubLabel>
                  </Field>
                </Section>
              )}

              {/* ── 5p: 팀 섬김 ── */}
              {step === 4 && (
                <Section>
                  <SectionTitle>팀 섬김 신청</SectionTitle>

                  <Field>
                    <Label>중보팀 섬김 여부 <RequiredAsterisk>*</RequiredAsterisk>
                      <SubLabel>중보기도팀은 허브업 기간 동안 릴레이 중보기도를 섬깁니다.</SubLabel>
                    </Label>
                    <RadioGroup>
                      {[
                        ['신청', '중보기도자로 신청합니다'],
                        ['없음', '해당 사항 없음'],
                      ].map(([val, label]) => (
                        <RadioLabel key={val} checked={formData.intercessorTeam === val}>
                          <input type="radio" name="intercessorTeam" value={val} required
                            checked={formData.intercessorTeam === val}
                            onChange={() => set('intercessorTeam', val)} />
                          {label}
                        </RadioLabel>
                      ))}
                    </RadioGroup>
                  </Field>

                  <Field>
                    <Label>자원봉사 섬김 여부 <RequiredAsterisk>*</RequiredAsterisk>
                      <SubLabel>자원봉사팀은 허브업 행사 운영을 위해 다양한 분야에서 섬깁니다.</SubLabel>
                    </Label>
                    <RadioGroup>
                      {[
                        ['신청', '자원봉사자로 신청합니다'],
                        ['없음', '해당 사항 없음'],
                      ].map(([val, label]) => (
                        <RadioLabel key={val} checked={formData.volunteerTeam === val}>
                          <input type="radio" name="volunteerTeam" value={val} required
                            checked={formData.volunteerTeam === val}
                            onChange={() => set('volunteerTeam', val)} />
                          {label}
                        </RadioLabel>
                      ))}
                    </RadioGroup>
                  </Field>
                </Section>
              )}

              {/* ── 6p: 최종 제출 확인 ── */}
              {step === 5 && (
                <Section>
                  <SectionTitle>최종 제출 확인</SectionTitle>
                  <DescriptionBox>
                    지금까지 입력하신 내용을 확인 후 제출해주세요.<br />
                    제출 후에는 수정이 어려우니 신중하게 확인해주세요.
                  </DescriptionBox>

                  <Field>
                    <Label>위 내용을 제출하시겠습니까? <RequiredAsterisk>*</RequiredAsterisk></Label>
                    <RadioLabel checked={formData.finalSubmitConfirm}>
                      <input type="checkbox"
                        checked={formData.finalSubmitConfirm}
                        required
                        onChange={(e) => set('finalSubmitConfirm', e.target.checked)} />
                      네, 제출합니다
                    </RadioLabel>
                  </Field>

                  {submitError && <ErrorText style={{ marginTop: '12px', fontSize: '14px' }}>{submitError}</ErrorText>}
                </Section>
              )}

            </StepWrapper>

            <ButtonGroup>
              <Button type="button" onClick={prevStep} variant="secondary">이전</Button>
              {step < totalSteps ? (
                <Button type="submit" variant="primary">다음으로</Button>
              ) : (
                <Button type="submit" variant="submit"
                  disabled={!formData.finalSubmitConfirm}>
                  제출하기
                </Button>
              )}
            </ButtonGroup>
          </form>
        </>
      )}
    </FormContainer>
  );
}

// ═══════════════════════════════════════════════════════════
// Animations & Styled Components
// ═══════════════════════════════════════════════════════════
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const FormContainer = styled.div`
  width: 100%;
`;

const StepWrapper = styled.div`
  animation: ${fadeIn} 0.3s ease-out;
`;

// ── Notice (step 0) ───────────────────────────────────────
const NoticeSection = styled.div`
  background: white;
  border-top: 8px solid #2563eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
`;

const NoticeHeader = styled.div`
  background: #eff6ff;
  padding: 32px 24px;
  text-align: center;
  border-bottom: 1px solid #bfdbfe;
`;

const NoticeTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1d4ed8;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
`;

const NoticeSubTitle = styled.p`
  font-size: 15px;
  color: #5f6368;
  margin: 0;
`;

const NoticeContentArea = styled.div`
  padding: 32px 24px;
`;

const NoticeBlock = styled.div`
  margin-bottom: 24px;
  &:last-of-type { margin-bottom: 0; }
`;

const BlockTitle = styled.h3`
  font-size: 17px;
  font-weight: 700;
  color: #202124;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const BlockText = styled.p`
  font-size: 15px;
  color: #4d5156;
  line-height: 1.6;
  margin: 0 0 6px 0;
  padding-left: 4px;
`;

const HighlightBox = styled.div`
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  font-size: 14px;
  color: #3c4043;
  line-height: 1.6;
  margin-top: 12px;
  margin-left: 4px;
  border-left: 3px solid #2563eb;
`;

const CheckboxLabel = styled.label<{ checked: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: ${(p) => (p.checked ? 'rgba(37,99,235,0.08)' : '#f8f9fa')};
  border: 2px solid ${(p) => (p.checked ? '#2563eb' : '#dadce0')};
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
  color: ${(p) => (p.checked ? '#1d4ed8' : '#202124')};
  transition: all 0.2s;
  margin-bottom: 24px;

  input[type="checkbox"] {
    width: 22px;
    height: 22px;
    accent-color: #2563eb;
    cursor: pointer;
    flex-shrink: 0;
  }
`;

const StartButton = styled.button`
  width: 100%;
  padding: 16px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  background: #2563eb;
  color: white;

  &:disabled {
    background: #dadce0;
    color: #9aa0a6;
    cursor: not-allowed;
  }
  &:not(:disabled):hover {
    background: #1d4ed8;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(37,99,235,0.25);
  }
`;

// ── Submit complete ───────────────────────────────────────
const SubmitCompleteSection = styled.div`
  background: white;
  border-top: 8px solid #2563eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding: 48px 24px;
  text-align: center;
`;

const SubmitCompleteIcon = styled.div`
  font-size: 56px;
  margin-bottom: 20px;
`;

const SubmitCompleteTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1d4ed8;
  margin: 0 0 24px 0;
  letter-spacing: -0.5px;
`;

const SubmitCompleteMessage = styled.p`
  font-size: 15px;
  color: #3c4043;
  line-height: 1.8;
  margin: 0 0 24px 0;
  background: #eff6ff;
  border-radius: 12px;
  padding: 20px;
  text-align: left;
`;

const SubmitCompleteNote = styled.p`
  font-size: 14px;
  color: #5f6368;
  margin: 0;
`;

// ── Form (step 1~5) ───────────────────────────────────────
const TitleBlock = styled.div`
  background: white;
  border-top: 8px solid #2563eb;
  border-radius: 12px;
  padding: 32px 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
`;

const Title = styled.h1`
  font-size: 26px;
  margin: 0 0 16px 0;
  font-weight: 700;
  color: #202124;
  letter-spacing: -0.5px;
`;

const Description = styled.p`
  color: #5f6368;
  font-size: 15px;
  margin: 0;
  line-height: 1.6;
`;

const RequiredAsterisk = styled.span`
  color: #d93025;
  font-weight: bold;
  margin-left: 2px;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  margin-bottom: 8px;
  overflow: hidden;
`;

const Progress = styled.div<{ fill: number }>`
  height: 100%;
  background: #2563eb;
  border-radius: 3px;
  width: ${(p) => p.fill}%;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
`;

const StepIndicator = styled.div`
  text-align: right;
  font-size: 13px;
  font-weight: 500;
  color: #5f6368;
  margin-bottom: 20px;
`;

const Section = styled.div`
  background: white;
  border-radius: 12px;
  padding: 32px 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
`;

const SectionTitle = styled.h2`
  background: #2563eb;
  color: white;
  margin: -32px -24px 32px -24px;
  padding: 20px 24px;
  font-size: 18px;
  font-weight: 600;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  letter-spacing: -0.3px;
`;

const Field = styled.div`
  margin-bottom: 32px;
  &:last-child { margin-bottom: 0; }
`;

const Label = styled.label`
  display: block;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #202124;
  line-height: 1.4;
`;

const SubLabel = styled.span`
  display: block;
  font-size: 13px;
  color: #80868b;
  font-weight: 400;
  margin-top: 6px;
  line-height: 1.4;
`;

const ErrorText = styled.span`
  display: block;
  font-size: 13px;
  color: #d93025;
  margin-top: 6px;
`;

const Input = styled.input`
  width: 100%;
  border: 1px solid #dadce0;
  border-radius: 8px;
  padding: 14px 16px;
  font-size: 15px;
  outline: none;
  background: #fafafa;
  transition: all 0.2s;
  box-sizing: border-box;

  &:focus {
    border-color: #2563eb;
    background: white;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
  }
  &::placeholder { color: #9aa0a6; }
`;

const Select = styled.select`
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #dadce0;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  background: #fafafa;
  cursor: pointer;
  appearance: none;
  transition: all 0.2s;

  &:focus {
    border-color: #2563eb;
    background: white;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
  }
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const RadioLabel = styled.label<{ checked?: boolean; disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid ${(p) => p.disabled ? '#e8eaed' : p.checked ? '#2563eb' : '#dadce0'};
  border-radius: 8px;
  background: ${(p) => p.disabled ? '#f8f9fa' : p.checked ? 'rgba(37,99,235,0.04)' : 'white'};
  cursor: ${(p) => p.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  font-size: 15px;
  font-weight: ${(p) => p.checked ? '600' : '400'};
  color: ${(p) => p.disabled ? '#9aa0a6' : p.checked ? '#1d4ed8' : '#202124'};
  opacity: ${(p) => p.disabled ? 0.6 : 1};

  &:hover {
    background: ${(p) => p.disabled ? '#f8f9fa' : p.checked ? 'rgba(37,99,235,0.06)' : '#f8f9fa'};
  }

  input[type="radio"], input[type="checkbox"] {
    accent-color: #2563eb;
    width: 20px;
    height: 20px;
    margin: 0;
    cursor: ${(p) => p.disabled ? 'not-allowed' : 'pointer'};
    flex-shrink: 0;
  }
`;

const SoldOutBadge = styled.span`
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: #fee2e2;
  color: #dc2626;
  font-size: 12px;
  font-weight: 700;
  border-radius: 4px;
  vertical-align: middle;
`;

const Divider = styled.hr`
  border: 0;
  height: 1px;
  background: #dadce0;
  margin: 32px 0;
`;

const CarDetailsBox = styled.div`
  background: #fdfaf3;
  border: 1px solid #f2e3c6;
  border-left: 4px solid #f2bb57;
  padding: 20px;
  border-radius: 8px;
  margin-top: 24px;
`;

const WarningText = styled.div`
  color: #d97706;
  font-weight: 700;
  margin-bottom: 16px;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const DescriptionBox = styled.div`
  font-size: 15px;
  color: #3c4043;
  line-height: 1.6;
  margin-bottom: 24px;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
`;

const NoticeBox = styled.div`
  background: rgba(37,99,235,0.07);
  border: 1px solid rgba(37,99,235,0.2);
  padding: 20px;
  border-radius: 8px;
  font-size: 15px;
  color: #1d4ed8;
  line-height: 1.6;
  margin-bottom: 20px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  gap: 12px;
`;

const Button = styled.button<{ variant: 'primary' | 'secondary' | 'submit' }>`
  padding: 14px 28px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  flex: 1;

  ${(p) => p.variant === 'primary' && `
    background: #2563eb;
    color: white;
    max-width: fit-content;
    margin-left: auto;
    &:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(37,99,235,0.25); }
  `}

  ${(p) => p.variant === 'submit' && `
    background: #2563eb;
    color: white;
    max-width: fit-content;
    margin-left: auto;
    &:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(37,99,235,0.25); }
    &:disabled { background: #dadce0; color: #9aa0a6; cursor: not-allowed; transform: none; box-shadow: none; }
  `}

  ${(p) => p.variant === 'secondary' && `
    background: white;
    color: #5f6368;
    border: 1px solid #dadce0;
    max-width: fit-content;
    &:hover { background: #f8f9fa; color: #202124; }
  `}
`;