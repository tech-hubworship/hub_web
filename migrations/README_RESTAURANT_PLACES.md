# 허브 맛집지도 (restaurant_places)

## 테이블

- `restaurant_places`: 맛집 장소 (이름, 카테고리, 주소, 위도/경도, 설명, 이미지, 전화, 영업시간, 승인 여부, 인기 지정)

## 적용 방법

Supabase SQL Editor에서 `migrations/add_restaurant_places.sql` 내용을 실행하세요.

## 카테고리

한식, 양식, 중식, 일식, 카페, 기타

## 공개 노출

- `is_approved = true` 인 행만 공개 API(`/api/public/restaurant`)에 노출됩니다.
- 관리자 페이지(`/admin/apps/restaurant`)에서 맛집 등록·수정·삭제, 승인/거부, 인기 맛집 지정을 할 수 있습니다.
