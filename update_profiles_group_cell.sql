-- profiles 테이블의 group_id와 cell_id를 모두 NULL로 업데이트
UPDATE public.profiles 
SET 
  group_id = NULL,
  cell_id = NULL;

-- 업데이트된 행 수 확인
SELECT COUNT(*) as updated_rows
FROM public.profiles
WHERE group_id IS NULL AND cell_id IS NULL;

