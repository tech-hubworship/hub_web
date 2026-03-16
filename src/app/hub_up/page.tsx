"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

export default function HubUpSurvey() {
  const router = useRouter();
  // step 0은 안내사항 확인 페이지, 1~6은 실제 설문 페이지입니다.
  const [step, setStep] = useState(0);
  const totalSteps = 6;

  // Intro State
  const [isNoticeChecked, setIsNoticeChecked] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    community: '',
    name: '',
    gender: '',
    birthdate: '',
    phone: '',
    group: '',
    leaderName: '',
    departureTransportType: '', // 'bus' | 'car'
    departureBusTime: '',
    returnTransportType: '', // 'bus' | 'car'
    returnBusTime: '',
    carDetails: {
      role: '', // driver, passenger, taxi
      entryTime: '',
      exitTime: '',
    },
    volunteerChoice1: '',
    volunteerChoice2: '',
    volunteerChoice3: '',
    capApplication: '',
    depositStatus: '',
    privacyConsent: '',
    question1: '',
    question2: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('carDetails.')) {
      const key = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        carDetails: { ...prev.carDetails, [key]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const nextStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep((s) => Math.min(s + 1, totalSteps));
  };
  const prevStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams({
      name: formData.name,
      group: formData.group,
      departureTime: formData.departureTransportType === 'bus' ? formData.departureBusTime : '자차/대중교통',
      returnTime: formData.returnTransportType === 'bus' ? formData.returnBusTime : '자차/대중교통',
    }).toString();
    router.push(`/hub_up/myinfo?${query}`);
  };

  const needsCarDetails = formData.departureTransportType === 'car' || formData.returnTransportType === 'car';

  return (
    <FormContainer>
      {step === 0 ? (
        <StepWrapper key="step-0">
          <NoticeSection>
            <NoticeHeader>
              <NoticeTitle>[24 허브업] Companion</NoticeTitle>
              <NoticeSubTitle>설문을 시작하기 전에 아래 안내사항을 꼭 읽어주세요.</NoticeSubTitle>
            </NoticeHeader>

            <NoticeContentArea>
              <NoticeBlock>
                <BlockTitle>📅 일정 및 장소</BlockTitle>
                <BlockText>• <strong>일정:</strong> 5월 24-26일 (금-주일)</BlockText>
                <BlockText style={{ color: '#d93025', fontSize: '14px', marginTop: '2px', marginBottom: '8px' }}>
                  ❗️ Companion1은 5월 24일, 21시에 시작됩니다.
                </BlockText>
                <BlockText>• <strong>장소:</strong> 소망 수양관<br />&nbsp;&nbsp;&nbsp;(경기도 광주시 곤지암읍 건업길 122-83)</BlockText>
              </NoticeBlock>

              <NoticeBlock>
                <BlockTitle>💸 회비 및 입금 안내</BlockTitle>
                <BlockText>• <strong>회비:</strong> 얼리버드(4/21~5/4) 75,000원 / 일반(5/5~5/8) 85,000원</BlockText>
                <BlockText>• <strong>입금계좌:</strong> 하나은행 573-910022-19605 / 온누리교회(허브행사비)</BlockText>
                <HighlightBox>
                  <strong style={{ color: '#1e7046' }}>📍 입금 주의사항 안내</strong><br />
                  - 회비를 입금 하셔야 접수 완료 입니다.<br />
                  - 입금자명 이름+연락처 끝 네자리 기입 요망 (ex. 홍길동8572)<br />
                  - 입금 후 확인 문자가 발송되오니, 연락처를 정확히 기재 바랍니다.<br />
                  - 신청자와 입금자명이 다를 경우 서기MC에게 연락 주셔야 확인됩니다.<br />
                  - 부분참석도 회비는 동일합니다.
                </HighlightBox>
              </NoticeBlock>

              <NoticeBlock>
                <BlockTitle>⚠️ 회비 환불</BlockTitle>
                <BlockText>• 5월 18일 (토) 자정까지 환불 신청 가능</BlockText>
              </NoticeBlock>

              <NoticeBlock>
                <BlockTitle>📝 신청 및 접수 확인</BlockTitle>
                <BlockText>• <strong>신청 기간:</strong> 4월 21일 (주일) ~ 5월 8일(수) 또는 인원 마감시(600명)</BlockText>
                <BlockText>• <strong>접수 확인:</strong></BlockText>
                <BlockText style={{ paddingLeft: '14px' }}>
                  1차 : 4월 24일 (수) 18시<br />
                  2차 : 5월 1일 (수) 18시<br />
                  3차 : 5월 9일 (목) 18시
                </BlockText>
                <BlockText style={{ color: '#5f6368', fontSize: '13.5px', marginTop: '6px' }}>
                  ※ 수요일 18시 이후 신청자는 "차주 수요일" 발송<br />
                  ※ 해당일에 문자를 받지 못하신 분은 서기MC에게 연락주세요 :)
                </BlockText>
              </NoticeBlock>

              <NoticeBlock>
                <BlockTitle>📞 문의</BlockTitle>
                <BlockText>• 서기MC (010-6310-2082)</BlockText>
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
              <StartButton
                disabled={!isNoticeChecked}
                onClick={nextStep}
              >
                설문 시작하기
              </StartButton>
            </NoticeContentArea>
          </NoticeSection>
        </StepWrapper>
      ) : (
        <>
          <TitleBlock>
            <Title>[24 허브업] Companion</Title>
            <Description>
              허브업 등록을 위한 설문입니다. <br />
              <RequiredAsterisk>*</RequiredAsterisk> 표시는 필수 질문입니다.
            </Description>
          </TitleBlock>

          <ProgressBarContainer>
            <Progress fill={(step / totalSteps) * 100} />
          </ProgressBarContainer>
          <StepIndicator>Step {step} of {totalSteps}</StepIndicator>

          <form onSubmit={step === totalSteps ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
            <StepWrapper key={`step-${step}`}>
              {step === 1 && (
                <Section>
                  <SectionTitle>기본정보</SectionTitle>
                  <Field>
                    <Label>소속 공동체 <RequiredAsterisk>*</RequiredAsterisk></Label>
                    <RadioGroup>
                      <RadioLabel checked={formData.community === '허브'}>
                        <input type="radio" name="community" value="허브" onChange={handleChange} required checked={formData.community === '허브'} /> 허브
                      </RadioLabel>
                      <RadioLabel checked={formData.community === '타공동체(온누리)'}>
                        <input type="radio" name="community" value="타공동체(온누리)" onChange={handleChange} checked={formData.community === '타공동체(온누리)'} /> 타공동체(온누리)
                      </RadioLabel>
                      <RadioLabel checked={formData.community === '타교회'}>
                        <input type="radio" name="community" value="타교회" onChange={handleChange} checked={formData.community === '타교회'} /> 타교회
                      </RadioLabel>
                    </RadioGroup>
                  </Field>
                  <Field>
                    <Label>이름 <RequiredAsterisk>*</RequiredAsterisk></Label>
                    <Input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="홍길동" />
                  </Field>
                  <Field>
                    <Label>성별 <RequiredAsterisk>*</RequiredAsterisk></Label>
                    <RadioGroup>
                      <RadioLabel checked={formData.gender === '남'}>
                        <input type="radio" name="gender" value="남" onChange={handleChange} required checked={formData.gender === '남'} /> 남
                      </RadioLabel>
                      <RadioLabel checked={formData.gender === '여'}>
                        <input type="radio" name="gender" value="여" onChange={handleChange} checked={formData.gender === '여'} /> 여
                      </RadioLabel>
                    </RadioGroup>
                  </Field>
                  <Field>
                    <Label>생년월일 <RequiredAsterisk>*</RequiredAsterisk><SubLabel>동명이인을 확인하기 위함입니다</SubLabel></Label>
                    <Input type="date" name="birthdate" value={formData.birthdate} onChange={handleChange} required />
                  </Field>
                  <Field>
                    <Label>연락처 <RequiredAsterisk>*</RequiredAsterisk><SubLabel>ex. 010-1234-5678 (하이픈'-'을 꼭 넣어서 써주세요)</SubLabel></Label>
                    <Input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="010-0000-0000" />
                  </Field>
                </Section>
              )}

              {step === 2 && (
                <Section>
                  <SectionTitle>소속 상세</SectionTitle>
                  <Field>
                    <Label>그룹/다락방 <RequiredAsterisk>*</RequiredAsterisk></Label>
                    <Select name="group" value={formData.group} onChange={handleChange} required>
                      <option value="">선택해주세요</option>
                      <option value="그룹1-다락방A">그룹1-다락방A</option>
                      <option value="그룹1-다락방B">그룹1-다락방B</option>
                      <option value="그룹2-다락방C">그룹2-다락방C</option>
                    </Select>
                  </Field>
                  <Field>
                    <Label>순장님 성함을 기입해주세요 <RequiredAsterisk>*</RequiredAsterisk><SubLabel>순모임에 참여하고 있지 않는 경우 "없음"이라고 적어주세요.</SubLabel></Label>
                    <Input type="text" name="leaderName" value={formData.leaderName} onChange={handleChange} required placeholder="내 답변" />
                  </Field>
                </Section>
              )}

              {step === 3 && (
                <Section>
                  <SectionTitle>교통 수단</SectionTitle>
                  <Field>
                    <Label>[5/24] 출발 탑승 수단 <RequiredAsterisk>*</RequiredAsterisk></Label>
                    <RadioGroup>
                      <RadioLabel checked={formData.departureTransportType === 'bus'}>
                        <input type="radio" name="departureTransportType" value="bus" onChange={handleChange} required checked={formData.departureTransportType === 'bus'} /> 버스 탑승
                      </RadioLabel>
                      <RadioLabel checked={formData.departureTransportType === 'car'}>
                        <input type="radio" name="departureTransportType" value="car" onChange={handleChange} checked={formData.departureTransportType === 'car'} /> 자차/대중교통 이용
                      </RadioLabel>
                    </RadioGroup>
                  </Field>

                  {formData.departureTransportType === 'bus' && (
                    <Field>
                      <Label>출발 버스 탑승 시각 <RequiredAsterisk>*</RequiredAsterisk></Label>
                      <RadioGroup>
                        <RadioLabel checked={formData.departureBusTime === '오후 2시(선발대)'}><input type="radio" name="departureBusTime" value="오후 2시(선발대)" onChange={handleChange} required checked={formData.departureBusTime === '오후 2시(선발대)'} /> [선발대] 오후 2시</RadioLabel>
                        <RadioLabel checked={formData.departureBusTime === '오후 6시'}><input type="radio" name="departureBusTime" value="오후 6시" onChange={handleChange} checked={formData.departureBusTime === '오후 6시'} /> [1차] 오후 6시</RadioLabel>
                        <RadioLabel checked={formData.departureBusTime === '오후 6시 30분'}><input type="radio" name="departureBusTime" value="오후 6시 30분" onChange={handleChange} checked={formData.departureBusTime === '오후 6시 30분'} /> [2차] 오후 6시 30분</RadioLabel>
                        <RadioLabel checked={formData.departureBusTime === '오후 7시'}><input type="radio" name="departureBusTime" value="오후 7시" onChange={handleChange} checked={formData.departureBusTime === '오후 7시'} /> [3차] 오후 7시</RadioLabel>
                        <RadioLabel checked={formData.departureBusTime === '오후 8시'}><input type="radio" name="departureBusTime" value="오후 8시" onChange={handleChange} checked={formData.departureBusTime === '오후 8시'} /> [4차] 오후 8시</RadioLabel>
                      </RadioGroup>
                    </Field>
                  )}

                  <Divider />

                  <Field>
                    <Label>[5/26] 복귀 탑승 수단 <RequiredAsterisk>*</RequiredAsterisk></Label>
                    <RadioGroup>
                      <RadioLabel checked={formData.returnTransportType === 'bus'}>
                        <input type="radio" name="returnTransportType" value="bus" onChange={handleChange} required checked={formData.returnTransportType === 'bus'} /> 버스 탑승
                      </RadioLabel>
                      <RadioLabel checked={formData.returnTransportType === 'car'}>
                        <input type="radio" name="returnTransportType" value="car" onChange={handleChange} checked={formData.returnTransportType === 'car'} /> 자차/대중교통 이용
                      </RadioLabel>
                    </RadioGroup>
                  </Field>

                  {formData.returnTransportType === 'bus' && (
                    <Field>
                      <Label>복귀 버스 탑승 시각 <RequiredAsterisk>*</RequiredAsterisk></Label>
                      <RadioGroup>
                        <RadioLabel checked={formData.returnBusTime === '7:00'}><input type="radio" name="returnBusTime" value="7:00" onChange={handleChange} required checked={formData.returnBusTime === '7:00'} /> 7:00 (차세대 및 예배섬김)</RadioLabel>
                        <RadioLabel checked={formData.returnBusTime === '11:30'}><input type="radio" name="returnBusTime" value="11:30" onChange={handleChange} checked={formData.returnBusTime === '11:30'} /> 11:30</RadioLabel>
                      </RadioGroup>
                    </Field>
                  )}

                  {needsCarDetails && (
                    <CarDetailsBox>
                      <WarningText>! 자차/대중교통 이용자 추가 정보</WarningText>
                      <Field>
                        <Label>운전자/동승자/택시 여부 <RequiredAsterisk>*</RequiredAsterisk></Label>
                        <RadioGroup>
                          <RadioLabel checked={formData.carDetails.role === '자가운전자'}><input type="radio" name="carDetails.role" value="자가운전자" onChange={handleChange} required checked={formData.carDetails.role === '자가운전자'} /> 자가운전자 (주차 필요)</RadioLabel>
                          <RadioLabel checked={formData.carDetails.role === '동승자'}><input type="radio" name="carDetails.role" value="동승자" onChange={handleChange} checked={formData.carDetails.role === '동승자'} /> 동승자 (주차 필요X)</RadioLabel>
                          <RadioLabel checked={formData.carDetails.role === '택시 및 대중교통'}><input type="radio" name="carDetails.role" value="택시 및 대중교통" onChange={handleChange} checked={formData.carDetails.role === '택시 및 대중교통'} /> 택시 및 대중교통 이동</RadioLabel>
                        </RadioGroup>
                      </Field>
                      <Field>
                        <Label>소망 수양관 입소 예정 시각</Label>
                        <Input type="text" name="carDetails.entryTime" value={formData.carDetails.entryTime} onChange={handleChange} required placeholder="예시 | 5/24, 20:00" />
                      </Field>
                      <Field>
                        <Label>소망 수양관 퇴소 예정 시각</Label>
                        <Input type="text" name="carDetails.exitTime" value={formData.carDetails.exitTime} onChange={handleChange} required placeholder="예시 | 5/26, 8:00" />
                      </Field>
                    </CarDetailsBox>
                  )}
                </Section>
              )}

              {step === 4 && (
                <Section>
                  <SectionTitle>자원봉사 신청</SectionTitle>
                  <DescriptionBox>
                    자원봉사를 원하시는 분들을 위한 조사입니다.<br />
                    각 부문별 1, 2, 3순위를 선택해주세요. 지원을 원치 않으시면 "지원 안함"을 선택해주세요.
                  </DescriptionBox>
                  <Field>
                    <Label>1지망 <RequiredAsterisk>*</RequiredAsterisk></Label>
                    <Select name="volunteerChoice1" value={formData.volunteerChoice1} onChange={handleChange} required>
                      <option value="">선택</option>
                      <option value="안내">안내</option>
                      <option value="주차">주차</option>
                      <option value="식당">식당</option>
                      <option value="의료">의료</option>
                      <option value="미디어">미디어</option>
                      <option value="지원 안함">지원 안함</option>
                    </Select>
                  </Field>
                  {formData.volunteerChoice1 && formData.volunteerChoice1 !== "지원 안함" && (
                    <>
                      <Field>
                        <Label>2지망</Label>
                        <Select name="volunteerChoice2" value={formData.volunteerChoice2} onChange={handleChange}>
                          <option value="">선택</option>
                          <option value="안내">안내</option>
                          <option value="주차">주차</option>
                          <option value="식당">식당</option>
                          <option value="의료">의료</option>
                          <option value="미디어">미디어</option>
                          <option value="지원 안함">해당 없음</option>
                        </Select>
                      </Field>
                      <Field>
                        <Label>3지망</Label>
                        <Select name="volunteerChoice3" value={formData.volunteerChoice3} onChange={handleChange}>
                          <option value="">선택</option>
                          <option value="안내">안내</option>
                          <option value="주차">주차</option>
                          <option value="식당">식당</option>
                          <option value="의료">의료</option>
                          <option value="미디어">미디어</option>
                          <option value="지원 안함">해당 없음</option>
                        </Select>
                      </Field>
                    </>
                  )}
                </Section>
              )}

              {step === 5 && (
                <Section>
                  <SectionTitle>중보기도자 신청 (CAP)</SectionTitle>
                  <DescriptionBox>
                    2024 허브업 중보기도팀 Come&Pray, "CAP"팀을 모집합니다.<br /><br />
                    단톡방을 통해 허브업 30일 전부터 공유된 기도문으로 함께 기도합니다.<br />
                    허브업이 진행되는 기간 동안 릴레이 중보기도가 이어질 예정입니다.
                  </DescriptionBox>
                  <Field>
                    <Label>CAP 지원 여부 <RequiredAsterisk>*</RequiredAsterisk></Label>
                    <RadioGroup>
                      <RadioLabel checked={formData.capApplication === '지원함'}><input type="radio" name="capApplication" value="지원함" onChange={handleChange} required checked={formData.capApplication === '지원함'} /> 지원함</RadioLabel>
                      <RadioLabel checked={formData.capApplication === '지원 안함'}><input type="radio" name="capApplication" value="지원 안함" onChange={handleChange} checked={formData.capApplication === '지원 안함'} /> 지원 안함</RadioLabel>
                    </RadioGroup>
                  </Field>
                </Section>
              )}

              {step === 6 && (
                <Section>
                  <SectionTitle>추가 정보 및 결제</SectionTitle>
                  <Field>
                    <Label>크리스천으로써 세상을 살아갈 때 마주하는 고민들을 나누어주세요! <RequiredAsterisk>*</RequiredAsterisk><SubLabel>Companion 2는 렌토토크쇼로 진행될 예정입니다.</SubLabel></Label>
                    <TextArea name="question1" value={formData.question1} onChange={handleChange} required rows={4} placeholder="고민을 자유롭게 작성해주세요." />
                  </Field>
                  <Field>
                    <Label>평소 연애를 하면서 생겼던 질문이나 어려웠던 점을 나누어주세요! <RequiredAsterisk>*</RequiredAsterisk><SubLabel>Companion 3은 사랑,연애 주제로 진행될 예정입니다.</SubLabel></Label>
                    <TextArea name="question2" value={formData.question2} onChange={handleChange} required rows={4} placeholder="질문이나 어려웠던 점을 작성해주세요." />
                  </Field>

                  <NoticeBox>
                    <strong>입금을 하신 후에 신청서 제출 부탁드립니다 <RequiredAsterisk>*</RequiredAsterisk></strong><br />
                    ✔ 하나 573-910022-19605 온누리교회(허브행사)<br />
                    * 입금시 연락처 끝 네자리 기입 요망
                  </NoticeBox>
                  <Field>
                    <RadioGroup>
                      <RadioLabel checked={formData.depositStatus === '입금완료'}><input type="radio" name="depositStatus" value="입금완료" onChange={handleChange} required checked={formData.depositStatus === '입금완료'} /> 입금했습니다</RadioLabel>
                    </RadioGroup>
                  </Field>

                  <Field>
                    <Label>개인정보 수집 및 이용에 대한 동의 <RequiredAsterisk>*</RequiredAsterisk></Label>
                    <SubLabel>수집한 개인정보는 향후 안내 및 공지에 사용하며, 수련회 이후 파기됩니다</SubLabel>
                    <RadioGroup>
                      <RadioLabel checked={formData.privacyConsent === '동의'}><input type="radio" name="privacyConsent" value="동의" onChange={handleChange} required checked={formData.privacyConsent === '동의'} /> 동의</RadioLabel>
                    </RadioGroup>
                  </Field>
                </Section>
              )}
            </StepWrapper>

            <ButtonGroup>
              <Button type="button" onClick={prevStep} variant="secondary">이전</Button>
              {step < totalSteps ? (
                <Button type="submit" variant="primary">다음으로</Button>
              ) : (
                <Button type="submit" variant="submit">제출하기</Button>
              )}
            </ButtonGroup>
          </form>
        </>
      )}
    </FormContainer>
  );
}

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled Components
const FormContainer = styled.div`
  width: 100%;
`;

const StepWrapper = styled.div`
  animation: ${fadeIn} 0.3s ease-out;
`;

// --- Text Notice (Step 0) Styles ---
const NoticeSection = styled.div`
  background: white;
  border-top: 8px solid #278f5a;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
`;

const NoticeHeader = styled.div`
  background: #f0f8f4;
  padding: 32px 24px;
  text-align: center;
  border-bottom: 1px solid #e2eee7;
`;

const NoticeTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1e7046;
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
  &:last-of-type {
    margin-bottom: 0;
  }
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
  border-left: 3px solid #278f5a;
`;

const CheckboxLabel = styled.label<{ checked: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: ${(props) => (props.checked ? 'rgba(39, 143, 90, 0.08)' : '#f8f9fa')};
  border: 2px solid ${(props) => (props.checked ? '#278f5a' : '#dadce0')};
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
  color: ${(props) => (props.checked ? '#1e7046' : '#202124')};
  transition: all 0.2s;
  margin-bottom: 24px;

  input[type="checkbox"] {
    width: 22px;
    height: 22px;
    accent-color: #278f5a;
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
  background: #278f5a;
  color: white;

  &:disabled {
    background: #dadce0;
    color: #9aa0a6;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: #1e7046;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(39, 143, 90, 0.2);
  }
`;

// --- Form Styles ---
const TitleBlock = styled.div`
  background: white;
  border-top: 8px solid #278f5a;
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
  background: #278f5a;
  border-radius: 3px;
  width: ${(props) => props.fill}%;
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
  background: #278f5a;
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
  &:last-child {
    margin-bottom: 0;
  }
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

const Input = styled.input`
  width: 100%;
  border: 1px solid #dadce0;
  border-radius: 8px;
  padding: 14px 16px;
  font-size: 15px;
  outline: none;
  background: #fafafa;
  transition: all 0.2s;
  
  &:focus {
    border-color: #278f5a;
    background: white;
    box-shadow: 0 0 0 3px rgba(39, 143, 90, 0.1);
  }
  
  &::placeholder {
    color: #9aa0a6;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  border: 1px solid #dadce0;
  border-radius: 8px;
  padding: 14px 16px;
  font-size: 15px;
  outline: none;
  background: #fafafa;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s;
  
  &:focus {
    border-color: #278f5a;
    background: white;
    box-shadow: 0 0 0 3px rgba(39, 143, 90, 0.1);
  }

  &::placeholder {
    color: #9aa0a6;
  }
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
    border-color: #278f5a;
    background: white;
    box-shadow: 0 0 0 3px rgba(39, 143, 90, 0.1);
  }
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const RadioLabel = styled.label<{ checked?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid ${(props) => (props.checked ? '#278f5a' : '#dadce0')};
  border-radius: 8px;
  background: ${(props) => (props.checked ? 'rgba(39, 143, 90, 0.04)' : 'white')};
  cursor: pointer;
  transition: all 0.2s;
  font-size: 15px;
  font-weight: ${(props) => (props.checked ? '600' : '400')};
  color: ${(props) => (props.checked ? '#1e7046' : '#202124')};

  &:hover {
    background: ${(props) => (props.checked ? 'rgba(39, 143, 90, 0.06)' : '#f8f9fa')};
  }

  input[type="radio"] {
    accent-color: #278f5a;
    width: 20px;
    height: 20px;
    margin: 0;
    cursor: pointer;
  }
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
  background: rgba(39, 143, 90, 0.08);
  border: 1px solid rgba(39, 143, 90, 0.2);
  padding: 20px;
  border-radius: 8px;
  font-size: 15px;
  color: #1e7046;
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

  ${(props) => props.variant === 'primary' && `
    background: #278f5a;
    color: white;
    max-width: fit-content;
    margin-left: auto;
    &:hover { background: #1e7046; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(39, 143, 90, 0.2); }
  `}

  ${(props) => props.variant === 'submit' && `
    background: #1a73e8;
    color: white;
    max-width: fit-content;
    margin-left: auto;
    &:hover { background: #1557b0; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(26, 115, 232, 0.2); }
  `}

  ${(props) => props.variant === 'secondary' && `
    background: white;
    color: #5f6368;
    border: 1px solid #dadce0;
    max-width: fit-content;
    &:hover { background: #f8f9fa; color: #202124; }
  `}
`;