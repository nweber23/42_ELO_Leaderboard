export interface User {
  id: number;
  intra_id: number;
  login: string;
  display_name: string;
  avatar_url: string;
  campus: string;
  table_tennis_elo: number;
  table_football_elo: number;
  is_admin?: boolean;
  is_banned?: boolean;
  ban_reason?: string;
  banned_at?: string;
  banned_by?: number;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: number;
  sport: string;
  player1_id: number;
  player2_id: number;
  player1_score: number;
  player2_score: number;
  winner_id: number;
  status: 'pending' | 'confirmed' | 'denied' | 'cancelled' | 'disputed';
  player1_elo_before?: number;
  player1_elo_after?: number;
  player1_elo_delta?: number;
  player2_elo_before?: number;
  player2_elo_after?: number;
  player2_elo_delta?: number;
  submitted_by: number;
  confirmed_at?: string;
  denied_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
  elo: number;
  matches_played: number;
  wins: number;
  losses: number;
  win_rate: number;
}

export interface Reaction {
  id: number;
  match_id: number;
  user_id: number;
  emoji: string;
  created_at: string;
}

export interface Comment {
  id: number;
  match_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface SubmitMatchRequest {
  sport: 'table_tennis' | 'table_football';
  opponent_id: number;
  player_score: number;
  opponent_score: number;
}

export const SPORTS = {
  TABLE_TENNIS: 'table_tennis',
  TABLE_FOOTBALL: 'table_football',
} as const;

export const SPORT_LABELS = {
  table_tennis: 'Table Tennis',
  table_football: 'Table Football',
} as const;

// Admin types
export interface SystemHealth {
  total_users: number;
  total_matches: number;
  pending_matches: number;
  disputed_matches: number;
  banned_users: number;
  matches_today: number;
  users_today: number;
}

export interface ELOAdjustment {
  id: number;
  user_id: number;
  sport: string;
  old_elo: number;
  new_elo: number;
  reason: string;
  adjusted_by: number;
  created_at: string;
  user_login?: string;
  admin_login?: string;
}

export interface AdminAuditLog {
  id: number;
  admin_id: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  details?: Record<string, unknown>;
  created_at: string;
  admin_login?: string;
}

export interface AdjustELORequest {
  user_id: number;
  sport: 'table_tennis' | 'table_football';
  new_elo: number;
  reason: string;
}

export interface BanUserRequest {
  user_id: number;
  reason: string;
}
