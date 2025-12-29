import axios, { AxiosError } from 'axios';
import type { User, Match, LeaderboardEntry, Reaction, Comment, SubmitMatchRequest } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public originalError?: AxiosError
  ) {
    super(message);
    this.name = 'APIError';
  }
}

const client = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
  withCredentials: true, // Enable sending cookies for httpOnly cookie auth
});

// Add token to requests (for localStorage mode - fallback when cookies not enabled)
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors with enhanced error wrapping
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    // Handle 401 errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on login page to avoid loops
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const message = retryAfter
        ? `Too many requests. Please try again in ${retryAfter} seconds.`
        : 'Too many requests. Please try again later.';
      return Promise.reject(new APIError(message, 429, 'RATE_LIMITED', error));
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject(
        new APIError(
          'Unable to connect to the server. Please check your internet connection.',
          undefined,
          'NETWORK_ERROR',
          error
        )
      );
    }

    // Extract error message from response
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      'An unexpected error occurred';

    return Promise.reject(
      new APIError(errorMessage, error.response?.status, undefined, error)
    );
  }
);

// Auth API
export const authAPI = {
  getLoginURL: async (): Promise<{ auth_url: string }> => {
    const { data } = await client.get('/auth/login');
    return data;
  },

  handleCallback: async (code: string): Promise<{ token: string; user: User }> => {
    const { data } = await client.get(`/auth/callback?code=${code}`);
    return data;
  },

  me: async (): Promise<User> => {
    const { data } = await client.get('/auth/me');
    return data;
  },

  // Logout - clears httpOnly cookie on server side
  logout: async (): Promise<void> => {
    await client.post('/auth/logout');
    // Also clear localStorage token if it exists (for backwards compatibility)
    localStorage.removeItem('token');
  },
};

// Users API
export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    const { data } = await client.get('/users');
    return data;
  },
};

// Match API
export const matchAPI = {
  submit: async (matchData: SubmitMatchRequest): Promise<Match> => {
    const { data } = await client.post('/matches', matchData);
    return data;
  },

  confirm: async (matchId: number): Promise<void> => {
    await client.post(`/matches/${matchId}/confirm`);
  },

  deny: async (matchId: number): Promise<void> => {
    await client.post(`/matches/${matchId}/deny`);
  },

  cancel: async (matchId: number): Promise<void> => {
    await client.post(`/matches/${matchId}/cancel`);
  },

  list: async (params?: {
    user_id?: number;
    sport?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Match[]> => {
    const { data } = await client.get('/matches', { params });
    return data;
  },

  getById: async (matchId: number): Promise<Match> => {
    const { data } = await client.get(`/matches/${matchId}`);
    return data;
  },
};

// Leaderboard API
export const leaderboardAPI = {
  get: async (sport: string): Promise<LeaderboardEntry[]> => {
    const { data } = await client.get(`/leaderboard/${sport}`);
    return data;
  },
};

// Reaction API
export const reactionAPI = {
  add: async (matchId: number, emoji: string): Promise<Reaction> => {
    const { data } = await client.post(`/matches/${matchId}/reactions`, { emoji });
    return data;
  },

  list: async (matchId: number): Promise<Reaction[]> => {
    const { data } = await client.get(`/matches/${matchId}/reactions`);
    return data;
  },

  remove: async (matchId: number, emoji: string): Promise<void> => {
    await client.delete(`/matches/${matchId}/reactions/${emoji}`);
  },
};

// Comment API
export const commentAPI = {
  add: async (matchId: number, content: string): Promise<Comment> => {
    const { data } = await client.post(`/matches/${matchId}/comments`, { content });
    return data;
  },

  list: async (matchId: number): Promise<Comment[]> => {
    const { data } = await client.get(`/matches/${matchId}/comments`);
    return data;
  },

  delete: async (matchId: number, commentId: number): Promise<void> => {
    await client.delete(`/matches/${matchId}/comments/${commentId}`);
  },
};

export default client;
