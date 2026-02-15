# OD 출석 대상 테이블 (영구 명단)

## 개요
OD 출석 체크 대상 명단을 **날짜 없이 영구**로 저장합니다.
이 명단에 있는 사용자는 리더십 권한 없이 QR 코드로 출석체크할 수 있습니다.

## 실행 방법
- **신규 설치**: Supabase SQL Editor에서 `add_attendance_od_targets.sql` 실행
- **기존에 날짜별 구조로 사용 중이었던 경우**: `alter_od_targets_permanent.sql` 실행

## 테이블 구조
- `attendance_od_targets`
  - category: 출석 카테고리 (기본 OD)
  - user_id: 사용자 ID (profiles와 매칭)
  - name: 이름 (참조용)
  - created_by: 등록한 관리자 ID
  - 유니크: (user_id, category) — 회원당 OD 1건만 유지

## 사용 흐름
1. 관리자가 **OD 명단 관리** 화면에서 엑셀 업로드 또는 회원 추가
2. 엑셀의 '이름' 컬럼으로 profiles와 매칭
3. 명단에 있는 사용자는 QR 스캔 시 출석체크 가능 (리더십 불필요)
