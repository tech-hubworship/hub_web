"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';

const PRIMARY = '#2D478C';

interface FaqItem {
  q: string;
  a: string;
  tshirtLink?: string;
  copyAccount?: boolean;
  achachaOnly?: boolean;
}
interface FaqSection {
  category: string;
  items: FaqItem[];
}

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

export default function FaqClient({
  sections,
  showAchacha,
}: {
  sections: FaqSection[];
  showAchacha: boolean;
}) {
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
        {sections.map((section) => (
          <Section key={section.category}>
            <SectionTitle>{section.category}</SectionTitle>
            {section.items
              .filter(faq => !(faq.achachaOnly && !showAchacha))
              .map((faq, i) => {
                const key = `${section.category}-${i}`;
                const isOpen = openKey === key;
                return (
                  <FaqItemWrap key={key} onClick={() => setOpenKey(isOpen ? null : key)}>
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
                          {faq.copyAccount && (
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
                          {faq.tshirtLink && (
                            <a
                              href={faq.tshirtLink}
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
                  </FaqItemWrap>
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
const FaqItemWrap = styled.div`background: #fff; border-radius: 12px; margin-bottom: 6px; padding: 16px 18px; cursor: pointer;`;
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
