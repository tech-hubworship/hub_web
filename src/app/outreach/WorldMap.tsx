"use client";

import { useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import styled from "@emotion/styled";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface Country {
  id: number;
  name_ko: string;
  name_en: string;
  iso_code: string;
  lat: number;
  lng: number;
  season_count: number;
}

interface Props {
  countries: Country[];
  onCountryClick: (id: number) => void;
}

export default function WorldMap({ countries, onCountryClick }: Props) {
  const [tooltip, setTooltip] = useState<{ name: string; seasons: number } | null>(null);

  return (
    <Wrapper>
      <ComposableMap
        projectionConfig={{ scale: 155, center: [20, 10] }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: { fill: "#C8BEA8", stroke: "#F5F0E8", strokeWidth: 0.5, outline: "none" },
                  hover:   { fill: "#B5A992", stroke: "#F5F0E8", strokeWidth: 0.5, outline: "none" },
                  pressed: { fill: "#B5A992", outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {countries.map((c) => (
          <Marker
            key={c.id}
            coordinates={[c.lng, c.lat]}
            onClick={() => onCountryClick(c.id)}
            onMouseEnter={() => setTooltip({ name: c.name_ko, seasons: c.season_count })}
            onMouseLeave={() => setTooltip(null)}
          >
            {/* 핀 크기: 방문 횟수에 비례 (모바일 터치 쉽게 12px 최소) */}
            <PinCircle r={Math.min(4 + c.season_count * 1.5, 10)} />
            <PinRing r={Math.min(4 + c.season_count * 1.5, 10) + 3} />
          </Marker>
        ))}
      </ComposableMap>

      {tooltip && (
        <Tooltip>
          <b>{tooltip.name}</b> &nbsp;·&nbsp; {tooltip.seasons}시즌
        </Tooltip>
      )}
    </Wrapper>
  );
}

const TERRA = "#C45C3A";

const Wrapper = styled.div`
  position: relative;
`;

const PinCircle = styled.circle`
  fill: ${TERRA};
  cursor: pointer;
  transition: r 0.15s;
  &:hover { r: 8px; }
`;

const PinRing = styled.circle`
  fill: none;
  stroke: ${TERRA};
  stroke-width: 1;
  opacity: 0.35;
  pointer-events: none;
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: #2D2A24ee;
  color: #F5F0E8;
  font-size: 12px;
  padding: 6px 14px;
  border-radius: 2px;
  white-space: nowrap;
  pointer-events: none;
  font-family: "Noto Serif KR", serif;
`;
