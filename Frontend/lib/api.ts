const API_BASE_URL = '/api';

export interface User {
  user_id: number;
  login: string;
  email: string;
  first_name: string;
  last_name: string;
  image_url: string;
  campus: string;
}

export interface Player {
  id: number;
  name: string;
  email: string;
  elo_rating: number;
  wins: number;
  losses: number;
  total_matches: number;
  win_rate: number;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: number;
  player1_id: number;
  player2_id: number;
  player1_name: string;
  player2_name: string;
  winner_id: number;
  sport: string;
  player1_score: number;
  player2_score: number;
  created_at: string;
}

export interface LeaderboardEntry {
  id: number;
  name: string;
  elo_rating: number;
  wins: number;
  losses: number;
  total_matches: number;
  win_rate: number;
  rank: number;
}

export interface Stats {
  total_players: number;
  total_matches: number;
  most_active_player: string;
  highest_elo: number;
  average_elo: number;
}

// Helper function for making API requests
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: () => apiRequest<{ auth_url: string }>('/auth/login'),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  getMe: () => apiRequest<User>('/auth/me'),
};

// Players API
export const playersApi = {
  getAll: () => apiRequest<Player[]>('/players'),
  getById: (id: number) => apiRequest<Player>(`/players/${id}`),
  create: (player: Omit<Player, 'id' | 'created_at' | 'updated_at'>) =>
    apiRequest<Player>('/players', {
      method: 'POST',
      body: JSON.stringify(player),
    }),
  update: (id: number, player: Partial<Player>) =>
    apiRequest<Player>(`/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(player),
    }),
  delete: (id: number) =>
    apiRequest(`/players/${id}`, { method: 'DELETE' }),
};

// Matches API
export const matchesApi = {
  getAll: () => apiRequest<Match[]>('/matches'),
  getById: (id: number) => apiRequest<Match>(`/matches/${id}`),
  create: (match: {
    player1_id: number;
    player2_id: number;
    winner_id: number;
    sport: string;
    player1_score: number;
    player2_score: number;
  }) =>
    apiRequest<Match>('/matches', {
      method: 'POST',
      body: JSON.stringify(match),
    }),
};

// Leaderboard API
export const leaderboardApi = {
  get: (sport?: string) => {
    const params = sport ? `?sport=${encodeURIComponent(sport)}` : '';
    return apiRequest<LeaderboardEntry[]>(`/leaderboard${params}`);
  },
};

// Stats API
export const statsApi = {
  get: () => apiRequest<Stats>('/stats'),
};

// Health Check API
export const healthApi = {
  check: () => apiRequest('/health'),
};