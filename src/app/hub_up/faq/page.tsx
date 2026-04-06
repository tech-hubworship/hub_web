"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';

const FAQ_SECTIONS = [
  {
    category: '접수 관련',
    items: [
      { q: '질문', a: '답변' },
      { q: '질문', a: '답변' },
      { q: '질문', a: '답변' },
    ],
  },
  {
    category: '숙소 관련',
    items: [
      {
        q: '숙소 배정은 어떻게 이루어지나요?',
        a: '다락방 단위로 배정되나, 숙소 최대 수용 인원, 침구류 제한으로 인해 타 다락방과 함께 사용할 수 있습니다.',
      },
      {
        q: '숙소 변경 요청이 가능한가요?',
        a: '최대한 다락방 별로 배정하지만 원하는대로 배정이 되지 않을 수 있습니다. 숙소는 임의로 변경이 불가한 점 양해 부탁드립니다.',
      },
    ],
  },
  {
    category: '차량 관련',
    items: [
      { q: '질문', a: '답변' },
      { q: '질문', a: '답변' },
      { q: '질문', a: '답변' },
    ],
  },
  {
    category: '티셔츠 관련',
    items: [
      { q: '질문', a: '답변' },
      { q: '질문', a: '답변' },
      { q: '질문', a: '답변' },
    ],
  },
];

export default function FaqPage() {
  const router = useRouter();
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <Wrap>
      <TopNav>
        <BackBtn onClick={() => router.back()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 19L8 12L15 5" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </BackBtn>
        <NavTitle>자주 묻는 질문</NavTitle>
      </TopNav>

      <Content>
        {FAQ_SECTIONS.map((section) => (
          <Section key={section.category}>
            <SectionHeader>
              <SectionTitle>{section.category}</SectionTitle>
              <SectionContact>{section.contact}</SectionContact>
            </SectionHeader>

            {section.items.map((faq, i) => {
              const key = `${section.category}-${i}`;
              const isOpen = openKey === key;
              return (
                <FaqItem key={key} onClick={() => setOpenKey(isOpen ? null : key)}>
                  <FaqQuestion>
                    <QMark>Q.</QMark>
                    <QText>{faq.q}</QText>
                    <Arrow open={isOpen}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M6 9L12 15L18 9" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Arrow>
                  </FaqQuestion>
                  {isOpen && (
                    <FaqAnswer>
                      <AMark>A.</AMark>
                      <AText>{faq.a}</AText>
                    </FaqAnswer>
                  )}
                </FaqItem>
              );
            })}
          </Section>
        ))}
      </Content>
    </Wrap>
  );
}

const PRIMARY = '#F25246';
const Wrap = styled.div`width: 100%; min-height: 100vh; background: #FAFAFA; font-family: -apple-system, sans-serif;`;
const TopNav = styled.div`height: 56px; display: flex; align-items: center; padding: 0 16px; background: #fff; border-bottom: 1px solid #F0F0F0; gap: 8px;`;
const BackBtn = styled.button`background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center;`;
const NavTitle = styled.div`font-size: 17px; font-weight: 700; color: #111;`;
const Content = styled.div`padding: 16px 20px 40px;`;

const Section = styled.div`margin-bottom: 28px;`;
const SectionHeader = styled.div`display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding: 0 4px;`;
const SectionTitle = styled.div`font-size: 16px; font-weight: 700; color: #111;`;
const SectionContact = styled.div`font-size: 12px; color: #888;`;

const FaqItem = styled.div`
  background: #fff;
  border-radius: 12px;
  margin-bottom: 6px;
  padding: 16px 18px;
  cursor: pointer;
`;
const FaqQuestion = styled.div`display: flex; align-items: flex-start; gap: 8px;`;
const QMark = styled.span`font-size: 14px; font-weight: 700; color: ${PRIMARY}; flex-shrink: 0; margin-top: 1px;`;
const QText = styled.div`font-size: 14px; font-weight: 600; color: #111; line-height: 1.5; flex: 1;`;
const Arrow = styled.div<{ open: boolean }>`
  flex-shrink: 0;
  transform: ${p => p.open ? 'rotate(180deg)' : 'rotate(0)'};
  transition: transform 0.2s;
  margin-top: 2px;
`;
const FaqAnswer = styled.div`display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #F0F0F0;`;
const AMark = styled.span`font-size: 14px; font-weight: 700; color: #888; flex-shrink: 0; margin-top: 1px;`;
const AText = styled.div`font-size: 14px; color: #666; line-height: 1.6; white-space: pre-line;`;
