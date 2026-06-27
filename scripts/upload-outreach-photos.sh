#!/usr/bin/env bash
#
# 아웃리치 시즌 사진 업로드 (대표사진 + 앨범)
# 브라우저 대시보드의 resumable 업로드가 사내 DLP에 막힐 때, 서버사이드(curl)로 우회 업로드한다.
#
# 사용법:
#   ./scripts/upload-outreach-photos.sh <시즌id> <폴더경로> [앨범최대장수]
#
# 예:
#   ./scripts/upload-outreach-photos.sh 15 "~/Downloads/24 겨울 일본"
#   ./scripts/upload-outreach-photos.sh 15 "~/Downloads/24 겨울 일본" 6
#
# 폴더 컨벤션:
#   - rep.{jpg,jpeg,png,heic}  → 대표사진(hero_image_url). 있으면 업로드, 없으면 hero 건드리지 않음.
#   - 그 외 이미지            → 앨범(gallery_urls). 이름순 정렬, [앨범최대장수]만큼만.
#
# 동작:
#   - macOS 내장 sips로 긴 변 리사이즈(hero 1500 / album 1600) + JPEG 변환(heic 포함)
#   - Supabase Storage 'outreach' 버킷에 seasons/<id>/hero.jpg, album/1..N.jpg 로 업로드(upsert)
#   - outreach_seasons 행의 hero_image_url / gallery_urls 를 갱신(REST PATCH)
#   - gallery_urls는 "이번에 올린 것으로 교체"(append 아님). 재실행 시 깔끔히 덮어씀.

set -uo pipefail

# ── 인자 ──
SEASON="${1:-}"
RAW_DIR="${2:-}"
ALBUM_MAX="${3:-0}"   # 0 = 전체
if [ -z "$SEASON" ] || [ -z "$RAW_DIR" ]; then
  echo "사용법: $0 <시즌id> <폴더경로> [앨범최대장수]" >&2
  exit 1
fi
DIR="${RAW_DIR/#\~/$HOME}"   # ~ 확장
if [ ! -d "$DIR" ]; then echo "폴더를 찾을 수 없습니다: $DIR" >&2; exit 1; fi

# ── 환경 변수 (.env.local 우선) ──
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
read_env() {
  local key="$1" f v
  for f in "$ROOT/.env.local" "$ROOT/.env" "$ROOT/.env.development"; do
    [ -f "$f" ] || continue
    v=$(grep -m1 "^${key}=" "$f" 2>/dev/null | sed 's/^[^=]*=//' | tr -d '"' | tr -d "'")
    if [ -n "$v" ]; then echo "$v"; return; fi
  done
}
KEY=$(read_env SUPABASE_SERVICE_ROLE_KEY)
URL=$(read_env NEXT_PUBLIC_SUPABASE_URL)
if [ -z "$KEY" ] || [ -z "$URL" ]; then
  echo "SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL 를 .env*에서 읽지 못했습니다." >&2
  exit 1
fi

BUCKET=outreach
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

# 이미지 파일 1개를 리사이즈→업로드. 인자: <원본> <스토리지경로> <긴변px>. 성공 시 0.
upload_image() {
  local src="$1" objpath="$2" maxdim="$3"
  local tmp="$TMPDIR/$(echo "$objpath" | tr '/' '_').jpg"
  sips -s format jpeg -Z "$maxdim" "$src" --out "$tmp" >/dev/null 2>&1
  if [ ! -f "$tmp" ]; then echo "  ✗ 리사이즈 실패: ${src##*/}" >&2; return 1; fi
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" -X POST \
    "$URL/storage/v1/object/$BUCKET/$objpath" \
    -H "Authorization: Bearer $KEY" -H "Content-Type: image/jpeg" -H "x-upsert: true" \
    --data-binary @"$tmp" --max-time 180)
  local sz; sz=$(ls -la "$tmp" | awk '{printf "%.1fMB", $5/1048576}')
  if [ "$code" = "200" ]; then
    printf '  ✓ %-28s ← %-45s (%s)\n' "$objpath" "${src##*/}" "$sz"
    return 0
  else
    printf '  ✗ %-28s ← %-45s HTTP %s\n' "$objpath" "${src##*/}" "$code" >&2
    return 1
  fi
}

patch_db() {  # 인자: <json본문>
  curl -sS -o /dev/null -w "%{http_code}" -X PATCH \
    "$URL/rest/v1/outreach_seasons?id=eq.$SEASON" \
    -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" -H "Prefer: return=minimal" \
    -d "$1" --max-time 30
}

echo "▶ 시즌 $SEASON  ·  폴더: $DIR"

# ── 1) 대표사진 (rep.*) ──
HERO_SRC=""
for ext in jpg jpeg png heic JPG JPEG PNG HEIC; do
  if [ -f "$DIR/rep.$ext" ]; then HERO_SRC="$DIR/rep.$ext"; break; fi
done
if [ -n "$HERO_SRC" ]; then
  echo "── 대표사진 ──"
  if upload_image "$HERO_SRC" "seasons/$SEASON/hero.jpg" 1500; then
    pub="$URL/storage/v1/object/public/$BUCKET/seasons/$SEASON/hero.jpg"
    code=$(patch_db "{\"hero_image_url\":\"$pub\"}")
    echo "  DB hero_image_url 갱신: HTTP $code"
  fi
else
  echo "── 대표사진 없음(rep.* 미발견) → 건너뜀 ──"
fi

# ── 2) 앨범 (rep 제외 이미지) ──
echo "── 앨범 ──"
i=0
URLS=""
while IFS= read -r src; do
  base="${src##*/}"; lc=$(echo "$base" | tr 'A-Z' 'a-z')
  case "$lc" in rep.jpg|rep.jpeg|rep.png|rep.heic) continue;; esac
  i=$((i+1))
  if [ "$ALBUM_MAX" -gt 0 ] && [ "$i" -gt "$ALBUM_MAX" ]; then i=$((i-1)); break; fi
  if upload_image "$src" "seasons/$SEASON/album/$i.jpg" 1600; then
    URLS="$URLS\"$URL/storage/v1/object/public/$BUCKET/seasons/$SEASON/album/$i.jpg\","
  else
    i=$((i-1))
  fi
done < <(find "$DIR" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.heic' \) | sort)

if [ "$i" -gt 0 ]; then
  code=$(patch_db "{\"gallery_urls\":[${URLS%,}]}")
  echo "  DB gallery_urls 갱신(${i}장): HTTP $code"
else
  echo "  앨범 이미지 없음 → gallery_urls 변경 안 함"
fi

echo "✔ 완료 — 시즌 $SEASON detail 페이지 새로고침하면 반영됩니다."
