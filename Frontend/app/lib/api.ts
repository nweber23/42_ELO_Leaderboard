import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:8081/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Player {
  id: number;
  name: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  rank: number;
  created: string;
  last_game: string;
}

export interface Match {
  id: number;
  player1_id: number;
  player2_id: number;
  player1: Player;
  player2: Player;
  result: 'player1_wins' | 'player2_wins' | 'draw';
  player1_elo_before: number;
  player2_elo_before: number;
  player1_elo_after: number;
  player2_elo_after: number;
  played_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  player: Player;
  games: number;
  win_rate: number;
}

export interface Stats {
  total_players: number;
  total_matches: number;
  avg_elo: number;
  top_player: Player;
}

// Players API
export const playersApi = {
  getAll: () => api.get<Player[]>('/players'),
  create: (player: { name: string }) => api.post<Player>('/players', player),
  getById: (id: number) => api.get<Player>(`/players/${id}`),
  update: (id: number, player: Partial<Player>) => api.put<Player>(`/players/${id}`, player),
  delete: (id: number) => api.delete(`/players/${id}`),
};

// Matches API
export const matchesApi = {
  getAll: () => api.get<Match[]>('/matches'),
  create: (match: { player1_id: number; player2_id: number; result: string }) => 
    api.post<Match>('/matches', match),
  getById: (id: number) => api.get<Match>(`/matches/${id}`),
};

// Leaderboard API
export const leaderboardApi = {
  get: () => api.get<LeaderboardEntry[]>('/leaderboard'),
  getStats: () => api.get<Stats>('/stats'),
};

// Health API
export const healthApi = {
  check: () => api.get('/health'),
};

export default api;