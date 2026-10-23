"use client";

import React, { useMemo, useState } from "react";
import styled from "@emotion/styled";
import {
  FLAT_CAMPUSES,
  ONNURI_MAP_SEARCH_URL,
  campusMapEmbedUrl,
  campusNaverMapUrl,
} from "../data";
import { C, Section, Wrap, SectionHead, Kicker, H2, Btn, Small } from "../styles";

// 지역별 캠퍼스 목록을 담는 리스트 컨테이너
const List = styled.div`
  border: 1px solid ${C.line};
  border-radius: 20px;
  background: #fff;
  overflow: hidden;
`;

const RegionLabel = styled.div`
  padding: 14px 18px 8px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: ${C.green2};
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fbfcfa;

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${C.green2};
  }
`;

const Row = styled.button<{ active: boolean }>`
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 18px;
  border: none;
  border-top: 1px solid ${C.line};
  border-left: 3px solid ${(p) => (p.active ? C.green : "transparent")};
  background: ${(p) => (p.active ? "#f3f7f2" : "#fff")};
  font: inherit;
  cursor: pointer;
  transition: background 0.12s;

  &:hover {
    background: #f6f8f5;
  }

  .pin {
    flex: 0 0 22px;
    text-align: center;
    font-size: 15px;
  }
  .meta {
    min-width: 0;
    flex: 1;
  }
  strong {
    display: block;
    font-size: 15px;
    letter-spacing: -0.01em;
    color: ${(p) => (p.active ? C.green : C.ink)};
  }
  .addr {
    font-size: 12px;
    color: ${C.muted};
    line-height: 1.5;
    margin-top: 2px;
  }
  .chev {
    flex: 0 0 auto;
    color: ${C.muted};
    font-size: 16px;
    transform: rotate(${(p) => (p.active ? "180deg" : "0deg")});
    transition: transform 0.18s;
  }
`;

// 선택 시 펼쳐지는 지도 + 액션 패널
const Detail = styled.div`
  background: #f3f7f2;
  border-left: 3px solid ${C.green};
  padding: 14px 18px 20px;
`;

const MapArea = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 11;
  border-radius: 14px;
  overflow: hidden;
  background: radial-gradient(circle at 30% 30%, #e9eee6 0, #dde6dc 100%);
  border: 1px solid #e0e6dc;

  iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }
`;

const MapPlaceholder = styled.button`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: transparent;
  color: ${C.green2};
  font: inherit;

  .pin {
    font-size: 36px;
    filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.15));
  }
  .hint {
    font-size: 13px;
    font-weight: 700;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 999px;
    padding: 8px 14px;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 14px;

  a {
    flex: 1;
    text-align: center;
  }

  @media (max-width: 520px) {
    flex-direction: column;

    a {
      width: 100%;
    }
  }
`;

export default function ChurchFinder() {
  const campuses = FLAT_CAMPUSES;
  // 처음엔 첫 캠퍼스를 펼쳐둠
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [mapShown, setMapShown] = useState<boolean>(false);

  const toggle = (i: number) => {
    if (i === openIndex) {
      setOpenIndex(-1);
    } else {
      setOpenIndex(i);
      setMapShown(false); // 새 교회를 펼치면 지도는 다시 눌러서 로드
    }
  };

  // 지역이 바뀌는 지점에 라벨 삽입
  const rows = useMemo(() => {
    let lastRegion = "";
    return campuses.map((c, i) => {
      const showRegion = c.region !== lastRegion;
      lastRegion = c.region;
      return { campus: c, index: i, showRegion };
    });
  }, [campuses]);

  return (
    <Section>
      <Wrap>
        <SectionHead>
          <div>
            <Kicker>FIND A CAMPUS</Kicker>
            <H2>가까운 온누리교회 찾아보기</H2>
          </div>
          <p>교회를 선택하면 바로 아래에서 위치를 확인할 수 있어요.</p>
        </SectionHead>

        <List>
          {rows.map(({ campus, index: i, showRegion }) => {
            const active = i === openIndex;
            return (
              <React.Fragment key={campus.name}>
                {showRegion && (
                  <RegionLabel>
                    <span className="dot" />
                    {campus.region}
                  </RegionLabel>
                )}
                <Row
                  type="button"
                  active={active}
                  aria-expanded={active}
                  onClick={() => toggle(i)}
                >
                  <span className="pin" aria-hidden>
                    📍
                  </span>
                  <span className="meta">
                    <strong>{campus.name}</strong>
                    <span className="addr">{campus.address}</span>
                  </span>
                  <span className="chev" aria-hidden>
                    ⌄
                  </span>
                </Row>

                {active && (
                  <Detail>
                    <MapArea>
                      {mapShown ? (
                        <iframe
                          src={campusMapEmbedUrl(campus)}
                          title={`${campus.name} 위치`}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          allowFullScreen
                        />
                      ) : (
                        <MapPlaceholder
                          type="button"
                          onClick={() => setMapShown(true)}
                          aria-label={`${campus.name} 지도 보기`}
                        >
                          <span className="pin" aria-hidden>
                            📍
                          </span>
                          <span className="hint">지도에서 위치 보기</span>
                        </MapPlaceholder>
                      )}
                    </MapArea>

                    <Actions>
                      <Btn
                        variant="dark"
                        href={campus.href}
                        target="_blank"
                        rel="noopener"
                      >
                        예배 안내 ↗
                      </Btn>
                      <Btn
                        variant="outline"
                        href={campusNaverMapUrl(campus)}
                        target="_blank"
                        rel="noopener"
                      >
                        네이버 지도 ↗
                      </Btn>
                    </Actions>
                  </Detail>
                )}
              </React.Fragment>
            );
          })}
        </List>

        <Small style={{ marginTop: 16 }}>
          ‘예배 안내’는 공식 예배 안내 페이지로, ‘네이버 지도’는 길찾기가 가능한
          네이버 지도로 이동합니다. 방문 전 예배 시간과 장소를 공식 안내에서
          확인해 주세요.
        </Small>

        <div style={{ marginTop: 14 }}>
          <Btn href={ONNURI_MAP_SEARCH_URL} target="_blank" rel="noopener">
            전체 온누리교회 지도에서 보기 ↗
          </Btn>
        </div>
      </Wrap>
    </Section>
  );
}
