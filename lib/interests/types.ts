export interface Interest {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: "active" | "paused" | "archived";
  progress: number;
  color: string;
  created_at: string;
  updated_at: string;
}
