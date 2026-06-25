"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { Map as MlMap, StyleSpecification } from "maplibre-gl";
import * as topojson from "topojson-client";
import styled from "@emotion/styled";

const TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// alpha-2 → world-atlas numeric
const ISO_NUM: Record<string, string> = {
  AF: "4",   AL: "8",   DZ: "12",  AO: "24",  AR: "32",  AM: "51",  AU: "36",
  AT: "40",  AZ: "31",  BD: "50",  BE: "56",  BJ: "204", BR: "76",  BG: "100",
  BF: "854", MM: "104", BI: "108", KH: "116", CM: "120", CA: "124", CF: "140",
  TD: "148", CL: "152", CN: "156", CO: "170", CD: "180", CG: "178", CR: "188",
  HR: "191", CU: "192", CZ: "203", DK: "208", DO: "214", EC: "218", EG: "818",
  ET: "231", FI: "246", FR: "250", GA: "266", GE: "268", DE: "276", GH: "288",
  GR: "300", GT: "320", GN: "324", HT: "332", HN: "340", HU: "348", IN: "356",
  ID: "360", IR: "364", IQ: "368", IE: "372", IL: "376", IT: "380", JP: "392",
  JO: "400", KZ: "398", KE: "404", KP: "408", KR: "410", KG: "417", LA: "418",
  LB: "422", LY: "434", MK: "807", MG: "450", MW: "454", MY: "458", ML: "466",
  MR: "478", MX: "484", MD: "498", MN: "496", MA: "504", MZ: "508", NA: "516",
  NP: "524", NL: "528", NZ: "554", NI: "558", NE: "562", NG: "566", NO: "578",
  OM: "512", PK: "586", PA: "591", PY: "600", PE: "604", PH: "608", PL: "616",
  PT: "620", RO: "642", RU: "643", RW: "646", SA: "682", SN: "686", SO: "706",
  ZA: "710", SS: "728", ES: "724", LK: "144", SD: "736", SE: "752", CH: "756",
  SY: "760", TJ: "762", TZ: "834", TH: "764", TL: "626", TG: "768", TN: "788",
  TR: "792", TM: "795", UG: "800", UA: "804", AE: "784", GB: "826", US: "840",
  UY: "858", UZ: "860", VE: "862", VN: "704", YE: "887", ZM: "894", ZW: "716",
};

const ISO3_FIX: Record<string, string> = {
  TUR: "TR", POL: "PL", DEU: "DE", CHE: "CH", NLD: "NL", AUT: "AT",
  BEL: "BE", SWE: "SE", NOR: "NO", DNK: "DK", FIN: "FI", PRT: "PT",
  GBR: "GB", IRL: "IE", CZE: "CZ", HUN: "HU", BGR: "BG", HRV: "HR",
  UKR: "UA", KAZ: "KZ", UZB: "UZ", TJK: "TJ", TKM: "TM", KGZ: "KG",
  AZE: "AZ", ARM: "AM", GEO: "GE", MYS: "MY", KOR: "KR", KWT: "KW",
  QAT: "QA", BHR: "BH", OMN: "OM", YEM: "YE", AFG: "AF", SEN: "SN",
  NGA: "NG", ETH: "ET", KEN: "KE", TZA: "TZ", UGA: "UG", MOZ: "MZ",
  ZMB: "ZM", ZWE: "ZW", ZAF: "ZA", NAM: "NA", MDG: "MG", MWI: "MW",
  RWA: "RW", BEN: "BJ", TCD: "TD", CAF: "CF", COD: "CD", COG: "CG",
  NZL: "NZ", PRY: "PY", CHL: "CL", URY: "UY", GUY: "GY", SUR: "SR",
  SSD: "SS", CRI: "CR", DOM: "DO", JAM: "JM", ECU: "EC",
};

function toAlpha2(iso: string) {
  const u = iso.toUpperCase();
  return u.length === 2 ? u : (ISO3_FIX[u] ?? u.substring(0, 2));
}

function visitFill(count: number): string {
  if (count >= 3) return "#FFB732";
  if (count === 2) return "#FFDB99";
  return "#EBD5AD";
}

const LAND = "#C8BEA8";
const OCEAN = "#EDE8DE";
const BORDER = "#EDE8DE";

// 한 링(좌표 배열)이 날짜변경선(±180°)을 가로지르는지 — 연속 점의 경도차 > 180°
function ringCrossesAntimeridian(ring: number[][]): boolean {
  for (let i = 1; i < ring.length; i++) {
    if (Math.abs(ring[i][0] - ring[i - 1][0]) > 180) return true;
  }
  return false;
}

// 안티메리디안을 가로지르는 폴리곤 조각 제거 (평면 Mercator에서 화면을 가로지르는 띠 방지).
// 러시아 극동 파편·남극·피지 등 비방문 지역만 사라지고 본토는 유지된다.
function dropAntimeridian(geo: GeoJSON.FeatureCollection): GeoJSON.FeatureCollection {
  for (const f of geo.features) {
    const g = f.geometry;
    if (g.type === "Polygon") {
      if (ringCrossesAntimeridian(g.coordinates[0])) {
        f.geometry = { type: "Polygon", coordinates: [] };
      }
    } else if (g.type === "MultiPolygon") {
      g.coordinates = g.coordinates.filter((poly) => !ringCrossesAntimeridian(poly[0]));
    }
  }
  return geo;
}

function pinSvg(selected: boolean): string {
  const w = selected ? 44 : 32;
  const h = Math.round(w * 1.4);
  return `<svg width="${w}" height="${h}" viewBox="0 0 24 34" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">
    <path d="M12 0C5.4 0 0 5.4 0 12C0 18.6 12 34 12 34C12 34 24 18.6 24 12C24 5.4 18.6 0 12 0Z" fill="#E53935"/>
    <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
  </svg>`;
}

interface Country {
  id: number;
  name_ko: string;
  iso_code: string;
  lat: number;
  lng: number;
  season_count: number;
}

interface Props {
  countries: Country[];
  selectedId: number | null;
  onCountryClick: (id: number) => void;
}

export default function WorldMap({ countries, selectedId, onCountryClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markersRef = useRef<Map<number, { marker: maplibregl.Marker; el: HTMLDivElement }>>(new Map());
  // 콜백/선택값을 ref로 보관해 맵 재생성 없이 최신값 참조
  const onClickRef = useRef(onCountryClick);
  onClickRef.current = onCountryClick;

  // ── 맵 생성 (마운트 1회) ──────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const style: StyleSpecification = {
      version: 8,
      sources: {
        countries: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
      },
      layers: [
        { id: "ocean", type: "background", paint: { "background-color": OCEAN } },
        { id: "land", type: "fill", source: "countries", paint: { "fill-color": ["get", "fillColor"] } },
        { id: "border", type: "line", source: "countries", paint: { "line-color": BORDER, "line-width": 0.5 } },
      ],
    };

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: [60, 25],
      zoom: 1.4,
      attributionControl: false,
      renderWorldCopies: false,
      dragRotate: false,
      pitchWithRotate: false,
      maxZoom: 10,
      minZoom: 0,
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;

    // 방문 국가 클릭 (fill 레이어)
    map.on("click", "land", (e) => {
      const f = e.features?.[0];
      const cid = f?.properties?._cid;
      if (cid != null) onClickRef.current(Number(cid));
    });
    map.on("mouseenter", "land", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "land", () => { map.getCanvas().style.cursor = ""; });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── GeoJSON 채색 + 마커 + 초기 프레이밍 (countries 변경 시) ──────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || countries.length === 0) return;

    const visited = new Map<string, Country>();
    for (const c of countries) {
      const key = ISO_NUM[toAlpha2(c.iso_code)];
      if (key) visited.set(key, c);
    }

    let cancelled = false;

    const apply = async () => {
      const res = await fetch(TOPO_URL);
      const topo = await res.json();
      const geo = dropAntimeridian(
        topojson.feature(topo, topo.objects.countries) as unknown as GeoJSON.FeatureCollection
      );
      if (cancelled) return;

      for (const f of geo.features) {
        const c = visited.get(String(f.id));
        f.properties = {
          ...(f.properties ?? {}),
          fillColor: c ? visitFill(c.season_count) : LAND,
          _cid: c ? c.id : null,
        };
      }

      const src = map.getSource("countries") as maplibregl.GeoJSONSource | undefined;
      if (src) src.setData(geo);

      // 마커 (재생성)
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current.clear();
      for (const c of countries) {
        const el = document.createElement("div");
        el.style.cursor = "pointer";
        el.innerHTML = pinSvg(false);
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          onClickRef.current(c.id);
        });
        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([c.lng, c.lat])
          .addTo(map);
        markersRef.current.set(c.id, { marker, el });
      }

      // 방문 지역에 맞춰 프레이밍
      const bounds = new maplibregl.LngLatBounds();
      countries.forEach((c) => bounds.extend([c.lng, c.lat]));
      map.fitBounds(bounds, { padding: 60, animate: false, maxZoom: 6 });
    };

    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);

    return () => { cancelled = true; };
  }, [countries]);

  // ── 선택 상태에 따라 핀 크기 갱신 ─────────────────────────────────────
  useEffect(() => {
    markersRef.current.forEach(({ el }, id) => {
      el.innerHTML = pinSvg(id === selectedId);
    });
  }, [selectedId]);

  return (
    <Wrapper>
      <MapDiv ref={containerRef} />
      <ZoomButtons>
        <ZoomBtn onClick={() => mapRef.current?.zoomIn()} aria-label="줌 인">+</ZoomBtn>
        <ZoomBtn onClick={() => mapRef.current?.zoomOut()} aria-label="줌 아웃">−</ZoomBtn>
      </ZoomButtons>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
`;

const MapDiv = styled.div`
  width: 100%;
  height: 100%;
  background: ${OCEAN};

  /* maplibre-gl.css가 App Router에서 주입 안 되는 경우 대비, 마커 위치잡기 핵심 규칙 직접 주입 */
  .maplibregl-marker {
    position: absolute;
    top: 0;
    left: 0;
    will-change: transform;
    pointer-events: auto;
  }
  .maplibregl-canvas-container,
  .maplibregl-canvas {
    position: absolute;
    top: 0;
    left: 0;
  }
`;

const ZoomButtons = styled.div`
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 1000;
`;

const ZoomBtn = styled.button`
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid #DDD6C8;
  border-radius: 8px;
  font-size: 18px;
  line-height: 1;
  color: #5A4A35;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  &:active { background: #F0EAE0; }
`;
