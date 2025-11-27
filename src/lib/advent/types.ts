export interface AdventPost {
  post_dt: string;
  title: string;
  content: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  reg_id: string;
  reg_dt: string;
  mod_id: string;
  mod_dt: string;
}

export interface AdventComment {
  comment_id: number;
  post_dt: string;
  content: string;
  reg_id: string;
  reg_dt: string;
  mod_id: string;
  mod_dt: string;
  user_name?: string; // profile 테이블에서 가져온 이름 (마스킹)
  user_affiliation?: string; // 공동체/그룹/다락방
}

export interface PreviousPost {
  post_dt: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string | null;
}

