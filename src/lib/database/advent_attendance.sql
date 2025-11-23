-- 대림절 출석 테이블
CREATE TABLE IF NOT EXISTS advent_attendance (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    post_dt VARCHAR(8) NOT NULL, -- YYYYMMDD 형식
    day_number INTEGER NOT NULL, -- 1일차부터 시작
    reg_dt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mod_dt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_dt)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_advent_attendance_user_id ON advent_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_advent_attendance_post_dt ON advent_attendance(post_dt);
CREATE INDEX IF NOT EXISTS idx_advent_attendance_day_number ON advent_attendance(day_number);
CREATE INDEX IF NOT EXISTS idx_advent_attendance_user_day ON advent_attendance(user_id, day_number);
