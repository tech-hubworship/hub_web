"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';

export default function HubUpSurvey() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 6;

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

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, send data to Supabase/API here
    console.log('Submitted Data:', formData);
    // Redirect to myinfo
    // Passed via query params just for prototype demonstration purposes
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
      <TitleBlock>
        <Title>[26 허브업] Companion</Title>
        <Description>
          허브업 등록을 위한 설문입니다. <br />
          * 표시는 필수 질문입니다.
        </Description>
      </TitleBlock>

      <ProgressBar>
        <Progress fill={(step / totalSteps) * 100} />
      </ProgressBar>
      <StepIndicator>Step {step} of {totalSteps}</StepIndicator>

      <form onSubmit={step === totalSteps ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
        {step === 1 && (
          <Section>
            <SectionTitle>기본정보</SectionTitle>
            <Field>
              <Label>소속 공동체 *</Label>
              <RadioGroup>
                <label><input type="radio" name="community" value="허브" onChange={handleChange} required /> 허브</label>
                <label><input type="radio" name="community" value="타공동체(온누리)" onChange={handleChange} /> 타공동체(온누리)</label>
                <label><input type="radio" name="community" value="타교회" onChange={handleChange} /> 타교회</label>
              </RadioGroup>
            </Field>
            <Field>
              <Label>이름 *</Label>
              <Input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="내 답변" />
            </Field>
            <Field>
              <Label>성별 *</Label>
              <RadioGroup>
                <label><input type="radio" name="gender" value="남" onChange={handleChange} required /> 남</label>
                <label><input type="radio" name="gender" value="여" onChange={handleChange} /> 여</label>
              </RadioGroup>
            </Field>
            <Field>
              <Label>생년월일 *<SubLabel>동명이인을 확인하기 위함입니다</SubLabel></Label>
              <Input type="date" name="birthdate" value={formData.birthdate} onChange={handleChange} required />
            </Field>
            <Field>
              <Label>연락처 *<SubLabel>ex. 010-1234-5678 (하이픈'-'을 꼭 넣어서 써주세요)</SubLabel></Label>
              <Input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="내 답변" />
            </Field>
          </Section>
        )}

        {step === 2 && (
          <Section>
            <SectionTitle>소속 상세</SectionTitle>
            <Field>
              <Label>그룹/다락방 *</Label>
              <Select name="group" value={formData.group} onChange={handleChange} required>
                <option value="">선택</option>
                <option value="그룹1-다락방A">그룹1-다락방A</option>
                <option value="그룹1-다락방B">그룹1-다락방B</option>
                <option value="그룹2-다락방C">그룹2-다락방C</option>
              </Select>
            </Field>
            <Field>
              <Label>순장님 성함을 기입해주세요 *<SubLabel>* 순모임에 참여하고 있지 않는 경우 "없음"이라고 적어주세요.</SubLabel></Label>
              <Input type="text" name="leaderName" value={formData.leaderName} onChange={handleChange} required placeholder="내 답변" />
            </Field>
          </Section>
        )}

        {step === 3 && (
          <Section>
            <SectionTitle>교통 수단</SectionTitle>

            <Field>
              <Label>[5/24] 출발 탑승 수단 *</Label>
              <RadioGroup>
                <label><input type="radio" name="departureTransportType" value="bus" onChange={handleChange} required /> 버스 탑승</label>
                <label><input type="radio" name="departureTransportType" value="car" onChange={handleChange} /> 자차/대중교통 이용</label>
              </RadioGroup>
            </Field>

            {formData.departureTransportType === 'bus' && (
              <Field>
                <Label>출발 버스 탑승 시각 *</Label>
                <RadioGroup>
                  <label><input type="radio" name="departureBusTime" value="오후 2시(선발대)" onChange={handleChange} required /> [선발대] 오후 2시</label>
                  <label><input type="radio" name="departureBusTime" value="오후 6시" onChange={handleChange} /> [1차] 오후 6시</label>
                  <label><input type="radio" name="departureBusTime" value="오후 6시 30분" onChange={handleChange} /> [2차] 오후 6시 30분</label>
                  <label><input type="radio" name="departureBusTime" value="오후 7시" onChange={handleChange} /> [3차] 오후 7시</label>
                  <label><input type="radio" name="departureBusTime" value="오후 8시" onChange={handleChange} /> [4차] 오후 8시</label>
                </RadioGroup>
              </Field>
            )}

            <Divider />

            <Field>
              <Label>[5/26] 복귀 탑승 수단 *</Label>
              <RadioGroup>
                <label><input type="radio" name="returnTransportType" value="bus" onChange={handleChange} required /> 버스 탑승</label>
                <label><input type="radio" name="returnTransportType" value="car" onChange={handleChange} /> 자차/대중교통 이용</label>
              </RadioGroup>
            </Field>

            {formData.returnTransportType === 'bus' && (
              <Field>
                <Label>복귀 버스 탑승 시각 *</Label>
                <RadioGroup>
                  <label><input type="radio" name="returnBusTime" value="7:00" onChange={handleChange} required /> 7:00 (차세대 및 예배섬김)</label>
                  <label><input type="radio" name="returnBusTime" value="11:30" onChange={handleChange} /> 11:30</label>
                </RadioGroup>
              </Field>
            )}

            {needsCarDetails && (
              <CarDetailsBox>
                <WarningText>! 자차/대중교통 이용자 추가 정보</WarningText>
                <Field>
                  <Label>운전자/동승자/택시 여부 *</Label>
                  <RadioGroup>
                    <label><input type="radio" name="carDetails.role" value="자가운전자" onChange={handleChange} required /> 자가운전자 (주차 필요)</label>
                    <label><input type="radio" name="carDetails.role" value="동승자" onChange={handleChange} /> 동승자 (주차 필요X)</label>
                    <label><input type="radio" name="carDetails.role" value="택시 및 대중교통" onChange={handleChange} /> 택시 및 대중교통 이동</label>
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
              <Label>1지망 *</Label>
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
              <Label>CAP 지원 여부 *</Label>
              <RadioGroup>
                <label><input type="radio" name="capApplication" value="지원함" onChange={handleChange} required /> 지원함</label>
                <label><input type="radio" name="capApplication" value="지원 안함" onChange={handleChange} /> 지원 안함</label>
              </RadioGroup>
            </Field>
          </Section>
        )}

        {step === 6 && (
          <Section>
            <SectionTitle>추가 정보 및 결제</SectionTitle>
            <Field>
              <Label>크리스천으로써 세상을 살아갈 때 마주하는 고민들을 나누어주세요! * <SubLabel>Companion 2는 렌토토크쇼로 진행될 예정입니다.</SubLabel></Label>
              <TextArea name="question1" value={formData.question1} onChange={handleChange} required rows={3} placeholder="내 답변" />
            </Field>
            <Field>
              <Label>평소 연애를 하면서 생겼던 질문이나 어려웠던 점을 나누어주세요! * <SubLabel>Companion 3은 사랑,연애 주제로 진행될 예정입니다.</SubLabel></Label>
              <TextArea name="question2" value={formData.question2} onChange={handleChange} required rows={3} placeholder="내 답변" />
            </Field>

            <NoticeBox>
              입금을 하신 후에 신청서 제출 부탁드립니다 *<br />
              ✔ 하나 573-910022-19605 온누리교회(허브행사)<br />
              * 입금시 연락처 끝 네자리 기입 요망
            </NoticeBox>
            <Field>
              <RadioGroup>
                <label><input type="radio" name="depositStatus" value="입금완료" onChange={handleChange} required /> 입금했습니다</label>
              </RadioGroup>
            </Field>

            <Field>
              <Label>개인정보 수집 및 이용에 대한 동의 *</Label>
              <SubLabel>수집한 개인정보는 향후 안내 및 공지에 사용하며, 수련회 이후 파기됩니다</SubLabel>
              <RadioGroup>
                <label><input type="radio" name="privacyConsent" value="동의" onChange={handleChange} required /> 동의</label>
              </RadioGroup>
            </Field>
          </Section>
        )}

        <ButtonGroup>
          {step > 1 && <Button type="button" onClick={prevStep} variant="secondary">이전</Button>}
          {step < totalSteps ? (
            <Button type="submit" variant="primary">다음</Button>
          ) : (
            <Button type="submit" variant="primary">제출</Button>
          )}
        </ButtonGroup>
      </form>
    </FormContainer>
  );
}

// Styled Components
const FormContainer = styled.div`
  width: 100%;
`;

const TitleBlock = styled.div`
  background: white;
  border-top: 8px solid #278f5a;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const Title = styled.h1`
  font-size: 24px;
  margin: 0 0 12px 0;
  font-weight: 600;
  color: #202124;
`;

const Description = styled.p`
  color: #5f6368;
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  margin-bottom: 8px;
`;

const Progress = styled.div<{ fill: number }>`
  height: 100%;
  background: #278f5a;
  border-radius: 2px;
  width: ${(props) => props.fill}%;
  transition: width 0.3s ease;
`;

const StepIndicator = styled.div`
  text-align: right;
  font-size: 12px;
  color: #5f6368;
  margin-bottom: 16px;
`;

const Section = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const SectionTitle = styled.h2`
  background: #52966f;
  color: white;
  margin: -24px -24px 24px -24px;
  padding: 16px 24px;
  font-size: 18px;
  font-weight: 500;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
`;

const Field = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #202124;
`;

const SubLabel = styled.span`
  display: block;
  font-size: 13px;
  color: #5f6368;
  font-weight: normal;
  margin-top: 4px;
`;

const Input = styled.input`
  width: 100%;
  border: none;
  border-bottom: 1px solid #dadce0;
  padding: 8px 0;
  font-size: 14px;
  outline: none;
  &:focus {
    border-bottom: 2px solid #278f5a;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  border: none;
  border-bottom: 1px solid #dadce0;
  padding: 8px 0;
  font-size: 14px;
  outline: none;
  resize: vertical;
  font-family: inherit;
  &:focus {
    border-bottom: 2px solid #278f5a;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  background: white;
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    cursor: pointer;
  }

  input[type="radio"] {
    accent-color: #278f5a;
    width: 18px;
    height: 18px;
  }
`;

const Divider = styled.hr`
  border: 0;
  height: 1px;
  background: #dadce0;
  margin: 24px 0;
`;

const CarDetailsBox = styled.div`
  background: #f8f9fa;
  border-left: 4px solid #f28b82;
  padding: 16px;
  border-radius: 4px;
  margin-top: 16px;
`;

const WarningText = styled.div`
  color: #d93025;
  font-weight: bold;
  margin-bottom: 16px;
  font-size: 14px;
`;

const DescriptionBox = styled.div`
  font-size: 14px;
  color: #3c4043;
  line-height: 1.6;
  margin-bottom: 24px;
`;

const NoticeBox = styled.div`
  background: #f1f3f4;
  padding: 16px;
  border-radius: 8px;
  font-size: 14px;
  color: #202124;
  line-height: 1.6;
  margin-bottom: 16px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
`;

const Button = styled.button<{ variant: 'primary' | 'secondary' }>`
  padding: 10px 24px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;

  ${(props) => props.variant === 'primary' && `
    background: #278f5a;
    color: white;
    margin-left: auto; /* Push to right if alone */
    &:hover { background: #1e7046; }
  `}

  ${(props) => props.variant === 'secondary' && `
    background: transparent;
    color: #278f5a;
    &:hover { background: rgba(39, 143, 90, 0.08); }
  `}
`;
