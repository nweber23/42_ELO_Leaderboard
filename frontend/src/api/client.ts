import axios from 'axios';
import type { User, Match, LeaderboardEntry, Reaction, Comment, SubmitMatchRequest } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const client = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
