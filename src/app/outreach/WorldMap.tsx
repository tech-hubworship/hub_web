"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, GeoJSON, Marker, useMap } from "react-leaflet";
import type { Map as LeafletMap, PathOptions, Layer } from "leaflet";
import L from "leaflet";
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

function pinIcon(selected: boolean): L.DivIcon {
  const w = selected ? 44 : 32;
  const h = Math.round(w * 1.4);
  return L.divIcon({
    html: `<svg width="${w}" height="${h}" viewBox="0 0 24 34" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">
      <path d="M12 0C5.4 0 0 5.4 0 12C0 18.6 12 34 12 34C12 34 24 18.6 24 12C24 5.4 18.6 0 12 0Z" fill="#E53935"/>
      <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    className: "",
  });
}

// 마운트 직후 컨테이너 크기를 재계산하고 전 세계를 화면에 맞춤
function MapInit() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.fitWorld({ padding: [4, 4] });
  }, [map]);
  return null;
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
  const mapRef = useRef<LeafletMap | null>(null);
  const [geoJson, setGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);

  const visited = new Map(
    countries.map((c) => [ISO_NUM[toAlpha2(c.iso_code)], c])
  );

  useEffect(() => {
    fetch(TOPO_URL)
      .then((r) => r.json())
      .then((topo) => {
        const geo = topojson.feature(
          topo,
          topo.objects.countries
        ) as unknown as GeoJSON.FeatureCollection;
        setGeoJson(geo);
      });
  }, []);

  const countryStyle = (feature?: GeoJSON.Feature): PathOptions => {
    const c = visited.get(String(feature?.id));
    return {
      fillColor: c ? visitFill(c.season_count) : "#C8BEA8",
      fillOpacity: 1,
      color: "#EDE8DE",
      weight: 0.5,
    };
  };

  const onEachCountry = (feature: GeoJSON.Feature, layer: Layer) => {
    const c = visited.get(String(feature?.id));
    if (c) layer.on("click", () => onCountryClick(c.id));
  };

  return (
    <Wrapper>
      <MapContainer
        ref={mapRef}
        center={[15, 70]}
        zoom={0}
        minZoom={0}
        maxZoom={10}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
        scrollWheelZoom
        attributionControl={false}
        maxBounds={[[-85, -180], [85, 180]]}
        maxBoundsViscosity={0.8}
      >
        <MapInit />
        {geoJson && (
          <GeoJSON
            key="world"
            data={geoJson}
            style={countryStyle}
            onEachFeature={onEachCountry}
          />
        )}
        {countries.map((c) => (
          <Marker
            key={`${c.id}-${selectedId === c.id}`}
            position={[c.lat, c.lng]}
            icon={pinIcon(selectedId === c.id)}
            eventHandlers={{ click: () => onCountryClick(c.id) }}
          />
        ))}
      </MapContainer>

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

  .leaflet-container {
    background: #EDE8DE;
    width: 100%;
    height: 100%;
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
