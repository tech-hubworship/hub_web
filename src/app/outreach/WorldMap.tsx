"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { Map as MlMap, StyleSpecification } from "maplibre-gl";
import * as topojson from "topojson-client";
import styled from "@emotion/styled";
import { TEXT, BG, VISIT_1, VISIT_2, VISIT_3, LAND, OCEAN, BORDER } from "./_components/shared";

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
  if (count >= 3) return VISIT_3;
  if (count === 2) return VISIT_2;
  return VISIT_1;
}

const INITIAL_ZOOM = 1.4;

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

function pinSvg(selected: boolean, zoom = 1.4): string {
  const base = Math.round(Math.max(16, Math.min(44, 20 + zoom * 6)));
  const w = selected ? 32 : base;
  const h = Math.round(w * 1.619);
  return `<svg width="${w}" height="${h}" viewBox="0 0 32 51.8095" xmlns="http://www.w3.org/2000/svg" style="display:block">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M16 0C24.8366 0 32 7.16344 32 16C32 24.3226 25.6456 31.1611 17.5238 31.9284V48.7619C17.5238 49.6035 16.8416 50.2857 16 50.2857C15.1584 50.2857 14.4762 49.6035 14.4762 48.7619V31.9284C6.35439 31.1611 0 24.3226 0 16C0 7.16344 7.16344 0 16 0Z" fill="${TEXT}"/>
    <path d="M21.3333 16C21.3333 13.0545 18.9455 10.6667 16 10.6667C13.0545 10.6667 10.6667 13.0545 10.6667 16C10.6667 18.9455 13.0545 21.3333 16 21.3333C18.9455 21.3333 21.3333 18.9455 21.3333 16Z" fill="${BG}"/>
    <path opacity="0.3" d="M16 51.8095C18.1039 51.8095 19.8095 50.9567 19.8095 49.9048C19.8095 48.8528 18.1039 48 16 48C13.896 48 12.1904 48.8528 12.1904 49.9048C12.1904 50.9567 13.896 51.8095 16 51.8095Z" fill="${TEXT}"/>
  </svg>`;
}

// 일부 국가는 표준 국기 대신 전용 이미지를 사용 (예: 튀르키예&그리스 → 합본 국기)
const FLAG_OVERRIDE: Record<string, string> = { TUR: "gr_tr" };

// 미선택 핀: 해당 국가 국기 원형(기본 24×24px) + 아래 갈색 막대
// 전용(합본) 국기는 원형 크롭 대신 원본 가로 비율 그대로 표시
function flagMarker(iso: string): string {
  const wide = iso.toUpperCase() in FLAG_OVERRIDE;
  const file = FLAG_OVERRIDE[iso.toUpperCase()] ?? toAlpha2(iso).toLowerCase();
  const src = `/images/outreach/flags/${file}.png`;
  // 합본 PNG는 투명 영역이 있어 box-shadow(사각 박스 기준) 대신 drop-shadow(알파 모양 기준)를 사용
  const imgStyle = wide
    ? "display:block;height:24px;width:auto;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.45))"
    : "display:block;width:24px;height:24px;border-radius:50%;object-fit:cover;box-shadow:0 2px 6px rgba(0,0,0,0.55)";
  return `<div style="display:flex;flex-direction:column;align-items:center">
    <img src="${src}" alt="" style="${imgStyle}" />
    <div style="width:2px;height:10px;background:${TEXT}"></div>
  </div>`;
}

// 선택 → 갈색 도넛 핀, 미선택 → 국기 원형
function markerHtml(selected: boolean, iso: string, zoom = INITIAL_ZOOM): string {
  return selected ? pinSvg(true, zoom) : flagMarker(iso);
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
  const markersRef = useRef<Map<number, { marker: maplibregl.Marker; el: HTMLDivElement; iso: string }>>(new Map());
  // 현재 갈색 도넛으로 렌더된(선택된) 핀 id — 선택 전환 시 이전 핀만 국기로 복귀시키기 위함
  const renderedSelRef = useRef<number | null>(null);
  // 콜백/선택값을 ref로 보관해 맵 재생성 없이 최신값 참조
  const onClickRef = useRef(onCountryClick);
  onClickRef.current = onCountryClick;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  // ── 맵 생성 (마운트 1회) ──────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const style: StyleSpecification = {
      version: 8,
      sources: {
        countries: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
        // 바다 배경 이미지를 전 세계 좌표(웹 메르카토르 범위)에 배치 → 지도와 함께 팬/줌
        ocean: {
          type: "image",
          url: "/images/outreach/ocean.png",
          coordinates: [
            [-180, 85.051129],
            [180, 85.051129],
            [180, -85.051129],
            [-180, -85.051129],
          ],
        },
      },
      layers: [
        { id: "ocean", type: "raster", source: "ocean", paint: { "raster-opacity": 1, "raster-fade-duration": 0 } },
        { id: "land", type: "fill", source: "countries", paint: { "fill-color": ["get", "fillColor"] } },
        { id: "border", type: "line", source: "countries", paint: { "line-color": ["get", "borderColor"], "line-width": 0.5 } },
      ],
    };

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: [60, 25],
      zoom: INITIAL_ZOOM,
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
    map.on("zoom", () => {
      // 선택된(갈색 도넛) 핀만 줌에 맞춰 크기 갱신. 국기 핀은 24×24 고정이라 갱신 불필요(이미지 깜빡임 방지).
      const sel = selectedIdRef.current;
      if (sel == null) return;
      const entry = markersRef.current.get(sel);
      if (entry) entry.el.innerHTML = markerHtml(true, entry.iso, map.getZoom());
    });

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
          borderColor: c ? VISIT_3 : BORDER,
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
        el.innerHTML = markerHtml(c.id === selectedIdRef.current, c.iso_code);
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          onClickRef.current(c.id);
        });
        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([c.lng, c.lat])
          .addTo(map);
        markersRef.current.set(c.id, { marker, el, iso: c.iso_code });
      }
      renderedSelRef.current = selectedIdRef.current;

      // 방문 지역에 맞춰 프레이밍
      const bounds = new maplibregl.LngLatBounds();
      countries.forEach((c) => bounds.extend([c.lng, c.lat]));
      map.fitBounds(bounds, { padding: 60, animate: false, maxZoom: 6 });
    };

    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);

    return () => { cancelled = true; };
  }, [countries]);

  // ── 선택 상태에 따라 핀 크기 갱신 + 줌 동작 ──────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const zoom = map?.getZoom() ?? INITIAL_ZOOM;
    // 이전 선택 핀 → 국기로 복귀
    const prev = renderedSelRef.current;
    if (prev != null && prev !== selectedId) {
      const e = markersRef.current.get(prev);
      if (e) e.el.innerHTML = markerHtml(false, e.iso, zoom);
    }
    // 새 선택 핀 → 갈색 도넛
    if (selectedId != null) {
      const e = markersRef.current.get(selectedId);
      if (e) e.el.innerHTML = markerHtml(true, e.iso, zoom);
    }
    renderedSelRef.current = selectedId;
    if (selectedId === null) {
      map?.flyTo({ zoom: INITIAL_ZOOM, duration: 600 });
    } else {
      const entry = markersRef.current.get(selectedId);
      if (entry && map) {
        const { lng, lat } = entry.marker.getLngLat();
        map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 3), duration: 800 });
      }
    }
  }, [selectedId]);

  return (
    <Wrapper>
      <MapDiv ref={containerRef} />
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
  /* 이미지 범위 밖(극지방 등)에 보일 폴백 색. 바다 이미지는 GL raster 레이어로 렌더 */
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
