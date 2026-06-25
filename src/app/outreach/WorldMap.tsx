"use client";

import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import styled from "@emotion/styled";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ISO alpha-2 → world-atlas numeric id
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

function visitFill(count: number): string {
  if (count >= 3) return "#FFB732";
  if (count === 2) return "#FFDB99";
  return "#EBD5AD";
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
  const toAlpha2 = (iso: string) => {
    const u = iso.toUpperCase();
    return u.length === 2 ? u : (ISO3_FIX[u] ?? u.substring(0, 2));
  };

  const visited = new Map(
    countries.map((c) => {
      const key = ISO_NUM[toAlpha2(c.iso_code)];
      return [key, c];
    })
  );

  return (
    <Wrapper>
      <ComposableMap
        projectionConfig={{ scale: 155, center: [20, 10] }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const c = visited.get(geo.id as string);
              const fill = c ? visitFill(c.season_count) : "#C8BEA8";
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={c ? () => onCountryClick(c.id) : undefined}
                  style={{
                    default: { fill, stroke: "#EDE8DE", strokeWidth: 0.5, outline: "none" },
                    hover:   { fill: c ? fill : "#BEB09A", stroke: "#EDE8DE", strokeWidth: 0.5, outline: "none" },
                    pressed: { fill, outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>

        {countries.map((c) => (
          <Marker
            key={c.id}
            coordinates={[c.lng, c.lat]}
            onClick={() => onCountryClick(c.id)}
          >
            <text
              textAnchor="middle"
              dominantBaseline="central"
              style={{
                fontSize: selectedId === c.id ? "26px" : "20px",
                cursor: "pointer",
                userSelect: "none",
                transition: "font-size 0.15s",
                filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.25))",
              }}
            >
              👣
            </text>
          </Marker>
        ))}
      </ComposableMap>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: absolute;
  inset: 0;
`;
