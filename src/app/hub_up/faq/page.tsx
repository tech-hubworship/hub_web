"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';

const PRIMARY = '#2D478C';

const isAchachaVisible = new Date() >= new Date('2026-04-19T00:00:00+09:00');

const FAQ_SECTIONS = [
  {
    category: '접수 관련',
    items: [
      {
        q: '신청은 어떻게 하나요?',
        a: '허브 웹사이트 상단 신청하기 버튼을 누르시면 됩니다.\n신청 후 안내에 따라 입금까지 완료하셔야 접수됩니다.',
      },
      {
        q: '접수 완료는 어떻게 확인하나요?',
        a: '신청 + 입금 확인이 모두 완료되면 접수가 확정됩니다.\n접수 확인 문자는 아래 일정에 따라 순차 발송됩니다.\n\n📩 문자 발송 일정\n•1차:4월 15일(수) 오전9시\n•2차:4월 20일(월) 오전9시\n•3차:4월 27일(월) 오전9시',
      },
      {
        q: '입금자명이 다르게 들어가면 어떻게 하나요?',
        a: '위 링크로 입금자명과 신청자명을 알려주시면\n확인 후 처리해드리겠습니다.',
        tshirtLink: 'https://open.kakao.com/o/s9CV4ipi',
      },
      {
        q: '환불은 가능한가요?',
        a: '5월 3일(일) 자정까지 환불 가능합니다.\n이후에는 예약금 지불로 인해 환불이 불가합니다.',
        tshirtLink: 'https://open.kakao.com/o/s9CV4ipi',
      },
      {
        q: '입금 계좌는 어디인가요?',
        a: '하나은행 573-910022-19605\n(예금주 : 허브행사)\n\n입금자명은 반드시 이름 + 전화번호 뒷자리\n(ex. 김허브1285)로 기재해주세요.',
        copyAccount: true,
      },      {
        q: '부분 참여도 가능한가요?',
        a: '가능합니다. 다만, 회비는 동일하게 적용됩니다.',
      },
      {
        q: '온누리교회 / 허브대학부를 안 다녀도 허브업에 갈 수 있나요?',
        a: '가능합니다.\n접수 신청하실 때 타교회 / 타공동체로 신청해주세요.',
      },      {
        q: '할인이나 이벤트는 어떻게 참여하나요?',
        a: '얼리버드 이벤트 : 4월 12일 - 4월 18일에 신청+입금까지 완료한 사람에 한하여 회비 8만원\n\n아차차 이벤트 : 4월 19일 (하루) 1시 30분 ~ 1시 50분까지 성경책 지참 후 기쁨홀 앞 데스크에서 인증 받은 사람에 한하여 회비 8만원',
        achachaOnly: true,
      },
      {
        q: '기타 접수 문의는 어디로 하면 되나요?',
        a: '접수 문의 전용 카카오 오픈채팅으로 연락해주세요.',
        tshirtLink: 'https://open.kakao.com/o/sWl6bnpi',
      },    ],
  },
  {
    category: '숙소 관련',
    items: [
      {
        q: '숙소 배정은 어떻게 이루어지나요?',
        a: '다락방 단위로 배정되나, 숙소 최대 수용 인원, 침구류 \n제한으로 인해 타 다락방과 함께 사용할 수 있습니다.',
      },
      {
        q: '숙소 변경 요청이 가능한가요?',
        a: '최대한 다락방 별로 배정하지만 원하는대로 \n배정이 되지 않을 수 있습니다.\n\n숙소는 임의로 변경이 불가한 점 양해 부탁드립니다.',
      },
    ],
  },
  {
    category: '티셔츠 관련',
    items: [
      {
        q: '티셔츠 사이즈를 변경하고 싶어요!',
        a: '예약 수량 만큼 제작하여 4/27(월)까지만 변경이 가능하며,\n티셔츠 오픈채팅으로 문의해주세요.',
        tshirtLink: 'https://open.kakao.com/o/scWel1ph',
      },
      {
        q: '티셔츠 구매를 취소하고 환불 받고 싶어요.',
        a: '취소 및 환불은 4/26(일)까지만 가능합니다.\n티셔츠 오픈채팅으로 문의해주세요.',
        tshirtLink: 'https://open.kakao.com/o/scWel1ph',
      },
      {
        q: '티셔츠는 언제, 어디서 받을 수 있나요?',
        a: '5/9(토) OD 후, 5/10(일) 허브 2시예배 전후로\n기쁨홀 앞에서 배부합니다.',
      },
    ],
  },
  {
    category: '차량 관련',
    items: [
      {
        q: '몇 시까지 도착하면 되나요?',
        a: '선탑자는 탑승 시간 20분 전까지,\n그 외 모든 인원은 탑승 시간 15분 전까지 집합해 주세요.',
      },
      {
        q: '늦으면 어떻게 되나요?',
        a: '기존에 배정된 차량에 탑승이 어려울 경우, \n다음 시간대 차량으로 순차적으로 배정됩니다.\n다만, 이후 차량도 모두 만석일 경우 탑승이 어려울 수 있으며, 이 경우 대중교통 이용을 안내드릴 수 있습니다.',
      },
      {
        q: '버스 좌석은 지정되어 있나요?',
        a: '별도의 지정석은 없습니다 :)',
      },
      {
        q: '앞자리에 앉을 수 있나요? (멀미 등)',
        a: '필요하신 경우 선탑자에게 미리 말씀해 주세요!',
      },
      {
        q: '캐리어를 가져가도 되나요?',
        a: '허브업 특성상 캐리어는 반입이 어렵습니다. \n배낭이나 간편한 가방으로 준비해 주시면 감사하겠습니다.',
      },
      {
        q: '짐은 어디에 보관하나요?',
        a: '짐은 직접 들고 탑승하시거나, \n버스 하단 트렁크에 보관하실 수 있습니다.',
      },
      {
        q: '당일에 신청한 시간대 말고 다른 시간대 버스를 타도 되나요?',
        a: '당일 혼선을 방지하기 위해 배정된 차량에만 탑승 \n부탁드립니다.',
      },
      {
        q: '늦을 것 같아요.',
        a: '지각이 예상될 경우, 선탑자에게 미리 알려주세요!',
      },
      {
        q: '제가 몇 번 버스인지 어떻게 알 수 있나요?',
        a: '당일 아침, 선탑자를 통해 안내될 예정입니다. \n톡방 공지를 통해 집합 장소, 시간, 호차를 \n확인하실 수 있습니다.',
      },
      {
        q: '버스 명단은 어디서 확인하나요?',
        a: '선탑자를 통해 별도로 안내드릴 예정입니다.',
      },
    ],
  },
];

function fallbackCopy(text: string) {
  const el = document.createElement('textarea');
  el.value = text;
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.focus();
  el.select();
  try { document.execCommand('copy'); } catch {}
  document.body.removeChild(el);
}

export default function FaqPage() {
  const router = useRouter();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState(false);

  const doCopy = (text: string) => {
    const done = () => { setCopyToast(true); setTimeout(() => setCopyToast(false), 2000); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => { fallbackCopy(text); done(); });
    } else { fallbackCopy(text); done(); }
  };

  return (
    <Wrap>
      <TopNav>
        <BackBtn onClick={() => router.back()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 19L8 12L15 5" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </BackBtn>
        <NavTitle>자주 묻는 질문</NavTitle>
      </TopNav>

      <Content>
        {FAQ_SECTIONS.map((section) => (
          <Section key={section.category}>
            <SectionTitle>{section.category}</SectionTitle>
            {section.items
              .filter(faq => !('achachaOnly' in faq && faq.achachaOnly && !isAchachaVisible))
              .map((faq, i) => {
                const key = `${section.category}-${i}`;
                const isOpen = openKey === key;
                const hasCopy = 'copyAccount' in faq && faq.copyAccount;
                const hasTshirtLink = 'tshirtLink' in faq && faq.tshirtLink;
                return (
                  <FaqItem key={key} onClick={() => setOpenKey(isOpen ? null : key)}>
                    <FaqQuestion>
                      <QMark>Q.</QMark>
                      <QText>{faq.q}</QText>
                      <Arrow open={isOpen}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M6 9L12 15L18 9" stroke="#949494" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Arrow>
                    </FaqQuestion>
                    {isOpen && (
                      <FaqAnswer>
                        <AMark>A.</AMark>
                        <div style={{ flex: 1 }}>
                          <AText>{faq.a}</AText>
                          {hasCopy && (
                            <AccountCopyRow onClick={(e) => { e.stopPropagation(); doCopy('573-910022-19605'); }}>
                              <span style={{ color: '#2D478C', fontWeight: 700 }}>573-910022-19605</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#2D478C', fontSize: 12 }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                  <rect x="9" y="9" width="13" height="13" rx="2" stroke="#2D478C" strokeWidth="2"/>
                                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="#2D478C" strokeWidth="2"/>
                                </svg>
                                복사
                              </span>
                            </AccountCopyRow>
                          )}
                          {hasTshirtLink && (
                            <a
                              href={(faq as any).tshirtLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: 'inline-block', marginTop: '12px',
                                padding: '8px 16px', background: '#D9D9D9',
                                borderRadius: '16px', fontSize: '14px', fontWeight: 500,
                                color: '#000', textDecoration: 'none',
                              }}
                            >
                              오픈채팅 문의하기 →
                            </a>
                          )}
                        </div>
                      </FaqAnswer>
                    )}
                  </FaqItem>
                );
              })}
          </Section>
        ))}
      </Content>
      {copyToast && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '10px 20px',
          borderRadius: 20, fontSize: 13, fontWeight: 500, zIndex: 9999, whiteSpace: 'nowrap',
        }}>
          계좌번호가 복사되었습니다 ✓
        </div>
      )}
    </Wrap>
  );
}

const Wrap = styled.div`width: 100%; min-height: 100vh; background: #F2F2F2; font-family: 'Pretendard', -apple-system, sans-serif;`;
const TopNav = styled.div`height: 56px; display: flex; align-items: center; padding: 0 16px; background: #fff; border-bottom: 1px solid #E6E6E6; position: relative;`;
const BackBtn = styled.button`background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center;`;
const NavTitle = styled.div`font-size: 17px; font-weight: 600; color: #1A1A1A; position: absolute; left: 50%; transform: translateX(-50%);`;
const Content = styled.div`padding: 16px 20px 40px;`;
const Section = styled.div`margin-bottom: 24px;`;
const SectionTitle = styled.div`font-size: 14px; font-weight: 600; color: #949494; margin-bottom: 8px; padding: 0 4px; text-transform: uppercase; letter-spacing: 0.05em;`;
const FaqItem = styled.div`background: #fff; border-radius: 12px; margin-bottom: 6px; padding: 16px 18px; cursor: pointer;`;
const FaqQuestion = styled.div`display: flex; align-items: flex-start; gap: 8px;`;
const QMark = styled.span`font-size: 14px; font-weight: 700; color: ${PRIMARY}; flex-shrink: 0; margin-top: 1px;`;
const QText = styled.div`font-size: 14px; font-weight: 600; color: #1A1A1A; line-height: 1.5; flex: 1;`;
const Arrow = styled.div<{ open: boolean }>`
  flex-shrink: 0;
  transform: ${p => p.open ? 'rotate(180deg)' : 'rotate(0)'};
  transition: transform 0.2s;
  margin-top: 2px;
`;
const FaqAnswer = styled.div`display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #F2F2F2;`;
const AMark = styled.span`font-size: 14px; font-weight: 700; color: #949494; flex-shrink: 0; margin-top: 1px;`;
const AText = styled.div`font-size: 14px; color: #757575; line-height: 1.6; white-space: pre-line;`;
const AccountCopyRow = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 10px; padding: 10px 12px; background: #f0f4ff;
  border-radius: 8px; cursor: pointer;
  &:active { opacity: 0.7; }
`;
