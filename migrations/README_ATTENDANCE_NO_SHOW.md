# OD 결석 사유 구분: 미인정 결석 / 무단 결석

## 배경
교역자님 요청으로 오디(OD) 결석을 다음 기준으로 분리 입력/집계할 수 있도록 함.

### 오디 불참 사유 기준
- **인정 사유** (`excused_absence`): 몸살, 출근, 가족행사, 결혼식, 면접, 시험 당일 등 스케줄 조정이 불가피하거나, 여행·본가 방문 등 물리적으로 참여가 어려운 경우. → 벌금/보고서 없음, 출석율 분모에서 제외.
- **미인정 사유** (`unexcused_absence`, 미인정 결석): 개인적인 약속, 시험공부, 순 아웃팅 등 스케줄 조정이 **가능한** 경우. 사전에 사유를 **제출**했으나 인정되지 않는 경우. → 벌금 5,000원 + OD 보고서.
- **무단 결석** (`no_show`): 사전에 사유를 **제출하지 않은** 경우(예: 늦잠). → 벌금 5,000원 + OD 보고서.

### 미인정 결석 vs 무단 결석의 차이
- **사전에 사유를 말했는지 여부**로 구분.
- 둘 다 벌금 및 OD 보고서 제출 대상이므로 금액/보고서 로직은 동일.
- 지각비 통계와 오디 출석 통계에서 **별도 컬럼/색상으로 분리 표시**.

## DB 변경 사항
`weekly_attendance.status` 컬럼은 text 타입이므로 **스키마 변경(마이그레이션) 불필요**.
새로운 status 값 `no_show`가 추가되었을 뿐이며, 기존 데이터는 영향 없음.

### status 값 정리
| status | 의미 | late_fee | is_report_required | 출석율 분모 |
|--------|------|----------|--------------------|-------------|
| present | 정상 출석 | 0 | false | 포함 |
| late | 지각 | 1,000~4,000 | 4,000원만 true | 포함 |
| excused_absence | 인정 결석 | 0 | false | **제외** |
| unexcused_absence | 미인정 결석 | 5,000 | true | 포함(결석) |
| no_show | 무단 결석 | 5,000 | true | 포함(결석) |

## 영향 받은 코드
- `src/lib/attendance/late-fee.ts` — AttendanceStatus 타입, 라벨/헬퍼 추가
- `src/app/api/admin/attendance/update-status/route.ts` — `no_show` 처리
- `src/app/api/admin/attendance/bulk-paste/route.ts` — 붙여넣기 값 `6`=무단결석 추가 (`5`=미인정결석)
- `src/app/api/attendance/list/route.ts` — `no_show_count` 통계 추가
- `src/views/AdminPage/attendance/AttendanceList.tsx` — 입력 버튼/필터/통계/엑셀 분리
- `src/views/AdminPage/attendance/AttendanceOverallStats.tsx` — 잔디 색상/범례 분리 (미인정=주황, 무단=빨강)
- `src/app/attendance/my/ClientPage.tsx`, `src/app/attendance/check-OD/AttendanceResultView.tsx` — 사용자 화면 라벨

## 붙여넣기(bulk-paste) 값 규칙
`0`=정상, `1~4`=지각비(천 단위), `5`=미인정결석, `6`=무단결석, `예외`/사유텍스트=인정결석+예외.
