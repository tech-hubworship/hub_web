/** 영상 이벤트 범용 타입 */

export interface VideoEventPost {
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

export interface VideoEventComment {
  comment_id: number;
  post_dt: string;
  content: string;
  reg_id: string;
  reg_dt: string;
  mod_id: string;
  mod_dt: string;
  user_name?: string;
  user_affiliation?: string;
}

export interface PreviousPost {
  post_dt: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string | null;
}
