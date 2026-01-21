export interface CalendarEvent {
  id: number;
  title: string;
  start_at: string; // ISO string
  end_at: string | null; // ISO string
  all_day: boolean;
  location: string | null;
  description: string | null;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

