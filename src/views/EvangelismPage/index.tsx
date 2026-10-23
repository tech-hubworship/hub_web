"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import { useRouter, useSearchParams } from "next/navigation";
import Hero from "./sections/Hero";
import GospelCarousel from "./sections/GospelCarousel";
import Songs from "./sections/Songs";
import QnA from "./sections/QnA";
import ChurchFinder from "./sections/ChurchFinder";
import {
  Explore,
  Why,
  CgnVideos,
  HurrayTeam,
  EvangelismFooter,
} from "./sections/StaticSections";
import { Page, Wrap, C } from "./styles";
import { TABS, DEFAULT_TAB, isTabKey, TabKey } from "./data";

const TabBarOuter = styled.div`
  position: sticky;
  top: 0;
  z-index: 20;
  background: ${C.cream};
  border-bottom: 1px solid ${C.line};
`;

const TabBar = styled.div`
  display: flex;
  gap: 6px;
  overflow-x: auto;
  /* 좌우 안쪽 여백으로 첫/마지막 탭이 가장자리에 붙어 잘리지 않게.
     Wrap의 측면 여백과 겹치지 않도록 음수 마진으로 전체폭까지 확장 후 패딩. */
  padding: 10px 18px;
  margin: 0 -18px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  scroll-padding-inline: 18px;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabButton = styled.button<{ active: boolean }>`
  flex: 0 0 auto;
  border: 1px solid ${(p) => (p.active ? C.green : C.line)};
  background: ${(p) => (p.active ? C.green : "#fff")};
  color: ${(p) => (p.active ? "#fff" : "#47544b")};
  border-radius: 999px;
  padding: 9px 15px;
  font: inherit;
  font-size: 13px;
  font-weight: ${(p) => (p.active ? 750 : 500)};
  white-space: nowrap;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;

  &:hover {
    border-color: #9eb6a3;
  }

  @media (max-width: 768px) {
    padding: 10px 16px;
  }
`;

function TabPanel({ tab, onSelectTab }: { tab: TabKey; onSelectTab: (t: TabKey) => void }) {
  switch (tab) {
    case "explore":
      return <Explore onSelectTab={onSelectTab} />;
    case "why":
      return <Why />;
    case "gospel":
      return <GospelCarousel onSelectTab={onSelectTab} />;
    case "qna":
      return <QnA />;
    case "songs":
      return <Songs />;
    case "cgn":
      return <CgnVideos />;
    case "church":
      return <ChurchFinder />;
    case "hurray":
      return <HurrayTeam />;
    default:
      return null;
  }
}

export default function EvangelismPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabKey>(
    isTabKey(paramTab) ? paramTab : DEFAULT_TAB
  );

  // 뒤로가기/링크 등으로 URL이 바뀌면 탭 상태 동기화
  useEffect(() => {
    if (isTabKey(paramTab) && paramTab !== activeTab) {
      setActiveTab(paramTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramTab]);

  const selectTab = useCallback(
    (tab: TabKey) => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`/evangelism?${params.toString()}`, { scroll: false });
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [router, searchParams]
  );

  // 선택된 탭이 탭바에서 보이도록 자동 스크롤 (모바일에서 탭이 화면 밖일 때)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  useEffect(() => {
    const el = tabRefs.current[activeTab];
    el?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeTab]);

  return (
    <>
      <Page>
        <Hero onSelectTab={selectTab} />

        <TabBarOuter>
          <Wrap>
            <TabBar role="tablist" aria-label="전도 페이지 섹션">
              {TABS.map((t) => (
                <TabButton
                  key={t.key}
                  ref={(el) => {
                    tabRefs.current[t.key] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === t.key}
                  active={activeTab === t.key}
                  onClick={() => selectTab(t.key)}
                >
                  {t.label}
                </TabButton>
              ))}
            </TabBar>
          </Wrap>
        </TabBarOuter>

        <TabPanel tab={activeTab} onSelectTab={selectTab} />
      </Page>
      <EvangelismFooter />
    </>
  );
}
