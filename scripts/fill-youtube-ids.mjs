// YouTube Data API v3로 찬양 영상 ID를 채우는 1회성 스크립트.
//   - data.ts 의 SONGS 각 곡을 "제목 아티스트 찬양"으로 검색
//   - 공식/아티스트 채널 추정 + 제목 유사도로 최적 영상 선택
//   - data.ts 의 youtubeID 값을 "제목+아티스트" 키 기준으로 교체 (파일 구조 유지)
//
// 사용: node scripts/fill-youtube-ids.mjs
// 환경변수: YOUTUBE_API_KEY (.env)

import fs from "node:fs";
import path from "node:path";

// --- .env 로드 (dotenv 없이 간단 파싱) ---
function loadEnv() {
  const envPath = path.resolve(".env");
  const txt = fs.readFileSync(envPath, "utf8");
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2];
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      process.env[m[1]] = v;
    }
  }
}
loadEnv();

const API_KEY = process.env.YOUTUBE_API_KEY;
if (!API_KEY) {
  console.error("YOUTUBE_API_KEY가 .env에 없습니다.");
  process.exit(1);
}

const DATA_PATH = path.resolve("src/views/EvangelismPage/data.ts");
const raw = fs.readFileSync(DATA_PATH, "utf8");

// data.ts에서 { title: "...", artist: "...", ... } 라인을 추출
const songLineRe =
  /\{\s*title:\s*"([^"]+)",\s*artist:\s*"([^"]+)"(?:\s*,\s*youtubeID:\s*"[^"]*")?\s*\}/g;

const songs = [];
let m;
while ((m = songLineRe.exec(raw)) !== null) {
  songs.push({ title: m[1], artist: m[2], full: m[0] });
}
console.log(`찾은 곡: ${songs.length}개`);

function scoreCandidate(item, song) {
  const title = (item.snippet.title || "").toLowerCase();
  const channel = (item.snippet.channelTitle || "").toLowerCase();
  const t = song.title.toLowerCase();
  const a = song.artist.toLowerCase();

  let score = 0;
  if (title.includes(t)) score += 5; // 제목에 곡명 포함
  if (channel.includes(a) || title.includes(a)) score += 4; // 아티스트 매칭
  // 공식/대표 채널 힌트
  if (/official|officia|vevo|lyric|music/i.test(channel)) score += 1;
  // 커버/리액션/쇼츠성 제외 감점
  if (/cover|reaction|teaser|shorts|메들리|모음|playlist|플레이리스트/i.test(title))
    score -= 3;
  if (/live|실황|예배실황/i.test(title)) score -= 1; // 라이브는 약간 감점(음원 우선)
  return score;
}

async function searchOne(song) {
  const q = `${song.title} ${song.artist} 찬양`;
  const url =
    "https://www.googleapis.com/youtube/v3/search?" +
    new URLSearchParams({
      key: API_KEY,
      part: "snippet",
      q,
      type: "video",
      maxResults: "5",
      videoEmbeddable: "true",
      regionCode: "KR",
      relevanceLanguage: "ko",
    });

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const items = (data.items || []).filter((it) => it.id && it.id.videoId);
  if (items.length === 0) return null;

  items.sort((x, y) => scoreCandidate(y, song) - scoreCandidate(x, song));
  const best = items[0];
  return {
    id: best.id.videoId,
    title: best.snippet.title,
    channel: best.snippet.channelTitle,
  };
}

const results = [];
for (const song of songs) {
  try {
    const r = await searchOne(song);
    if (r) {
      results.push({ ...song, id: r.id, pickedTitle: r.title, channel: r.channel });
      console.log(`✓ ${song.title} / ${song.artist} -> ${r.id}  (${r.channel} | ${r.pickedTitle})`);
    } else {
      console.log(`✗ ${song.title} / ${song.artist} -> 결과 없음`);
    }
  } catch (e) {
    console.log(`! ${song.title} / ${song.artist} -> ${e.message}`);
  }
}

// data.ts 치환: 각 곡의 원본 라인을 새 youtubeID로 교체
let out = raw;
let replaced = 0;
for (const r of results) {
  if (!r.id) continue;
  const newLine = `{ title: "${r.title}", artist: "${r.artist}", youtubeID: "${r.id}" }`;
  if (out.includes(r.full)) {
    out = out.replace(r.full, newLine);
    replaced++;
  }
}

fs.writeFileSync(DATA_PATH, out, "utf8");
console.log(`\n교체 완료: ${replaced}/${songs.length}곡`);

// 매칭 리포트 저장 (사람이 검수용)
const report = results
  .map((r) => `${r.title}\t${r.artist}\t${r.id}\t${r.channel}\t${r.pickedTitle}`)
  .join("\n");
fs.writeFileSync("scripts/_youtube_report.tsv", "title\tartist\tid\tchannel\tpickedTitle\n" + report, "utf8");
console.log("리포트: scripts/_youtube_report.tsv");
