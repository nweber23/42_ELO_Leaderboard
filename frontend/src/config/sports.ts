/**
 * Sport configuration module
 * Fetches sport configurations from the API and provides caching
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface SportConfig {
  id: string;
  name: string;
  display_name: string;
  icon_url?: string;
  default_elo: number;
  k_factor: number;
  min_score: number;
  max_score: number;
  is_active: boolean;
  sort_order: number;
}

// Cache for sports configuration
let sportsCache: SportConfig[] | null = null;
let sportsCacheTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches all active sports from the API
 * Results are cached for 5 minutes
 */
export async function getSports(): Promise<SportConfig[]> {
  const now = Date.now();

  // Return cached data if still fresh
  if (sportsCache && (now - sportsCacheTime) < CACHE_TTL) {
    return sportsCache;
  }

  try {
    const response = await fetch(`${API_URL}/api/sports`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sports: ${response.status}`);
    }

    const sports: SportConfig[] = await response.json();

    // Update cache
    sportsCache = sports;
    sportsCacheTime = now;

    return sports;
  } catch (error) {
    // If we have cached data, return it even if stale
    if (sportsCache) {
      console.warn('Failed to refresh sports cache, using stale data:', error);
      return sportsCache;
    }

    // Fallback to hardcoded defaults if no cache and API fails
    console.error('Failed to fetch sports, using defaults:', error);
    return getDefaultSports();
  }
}

/**
 * Gets a specific sport by ID
 */
export async function getSport(sportId: string): Promise<SportConfig | null> {
  const sports = await getSports();
  return sports.find(s => s.id === sportId) || null;
}

/**
 * Gets the display name for a sport ID
 * Falls back to the ID if not found
 */
export async function getSportDisplayName(sportId: string): Promise<string> {
  const sport = await getSport(sportId);
  return sport?.display_name || sportId;
}

/**
 * Gets sport display name synchronously from cache
 * Returns the ID if not cached
 */
export function getSportLabel(sportId: string): string {
  if (sportsCache) {
    const sport = sportsCache.find(s => s.id === sportId);
    if (sport) return sport.display_name;
  }
  // Fallback labels for common sports
  const fallbackLabels: Record<string, string> = {
    'table_tennis': 'Table Tennis',
    'table_football': 'Table Football',
  };
  return fallbackLabels[sportId] || sportId;
}

/**
 * Gets the default sport ID (first active sport by sort order)
 */
export async function getDefaultSportId(): Promise<string> {
  const sports = await getSports();
  return sports[0]?.id || 'table_tennis';
}

/**
 * Invalidates the sports cache
 * Call this when you know the sports have changed
 */
export function invalidateSportsCache(): void {
  sportsCache = null;
  sportsCacheTime = 0;
}

/**
 * Returns default sports configuration for fallback
 * These should match the database seed values
 */
function getDefaultSports(): SportConfig[] {
  return [
    {
      id: 'table_tennis',
      name: 'Table Tennis',
      display_name: 'Table Tennis',
      default_elo: 1000,
      k_factor: 32,
      min_score: 0,
      max_score: 999,
      is_active: true,
      sort_order: 1,
    },
    {
      id: 'table_football',
      name: 'Table Football',
      display_name: 'Table Football',
      default_elo: 1000,
      k_factor: 32,
      min_score: 0,
      max_score: 999,
      is_active: true,
      sort_order: 2,
    },
  ];
}

/**
 * Preloads sports into cache
 * Call this early in app initialization
 */
export async function preloadSports(): Promise<void> {
  await getSports();
}
