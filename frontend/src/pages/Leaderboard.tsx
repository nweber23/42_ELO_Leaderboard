import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { leaderboardAPI } from '../api/client';
import type { LeaderboardEntry, User } from '../types';
import { SPORT_LABELS } from '../types';
import { Page } from '../layout/Page';
import { Card, CardContent } from '../ui/Card';
import { SegmentedNav } from '../ui/Segmented';
import { LazyImage } from '../components/LazyImage';
import { useDebounce } from '../hooks';
import '../styles/leaderboard.css';

interface LeaderboardProps {
  sport?: string;
  user?: User | null;
}

type SortField = 'rank' | 'elo' | 'matches' | 'wins' | 'winrate';
type SortDirection = 'asc' | 'desc';

function Leaderboard({ sport: propSport, user }: LeaderboardProps) {
  const { sport: paramSport } = useParams();
  const sport = propSport || paramSport || 'table_tennis';

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Debounce search query for better performance (300ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Track mounted state to prevent state updates after unmount
  const isMounted = useRef(true);

  // Track if user is authenticated (use user?.id to detect auth state changes)
  const isAuthenticated = !!user;

  useEffect(() => {
    isMounted.current = true;
    setLoading(true);
    setError(null);

    leaderboardAPI.get(sport)
      .then(data => {
        if (isMounted.current) {
          setLeaderboard(data || []);
        }
      })
      .catch(err => {
        if (isMounted.current) {
          console.error('Failed to load leaderboard:', err);
          setError('Failed to load leaderboard');
        }
      })
      .finally(() => {
        if (isMounted.current) {
          setLoading(false);
        }
      });

    return () => {
      isMounted.current = false;
    };
  }, [sport, isAuthenticated]);

  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default direction
      setSortField(field);
      // Default to desc for most metrics (higher is better), asc for rank
      setSortDirection(field === 'rank' ? 'asc' : 'desc');
    }
  };

  // Sort indicator component
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return <span style={{ marginLeft: '4px' }}>{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  // Filter and sort leaderboard (memoized for performance)
  const filteredLeaderboard = useMemo(() => {
    let result = leaderboard;

    // Apply search filter using debounced query
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      result = result.filter(entry =>
        entry.user.login.toLowerCase().includes(query) ||
        entry.user.display_name.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      let aVal: number;
      let bVal: number;

      switch (sortField) {
        case 'rank':
          aVal = a.rank;
          bVal = b.rank;
          break;
        case 'elo':
          aVal = a.elo;
          bVal = b.elo;
          break;
        case 'matches':
          aVal = a.matches_played;
          bVal = b.matches_played;
          break;
        case 'wins':
          aVal = a.wins;
          bVal = b.wins;
          break;
        case 'winrate':
          aVal = a.win_rate;
          bVal = b.win_rate;
          break;
        default:
          return 0;
      }

      const diff = aVal - bVal;
      return sortDirection === 'asc' ? diff : -diff;
    });

    return result;
  }, [leaderboard, debouncedSearchQuery, sortField, sortDirection]);

  if (loading) {
    return (
      <Page title="Leaderboards" subtitle="Rankings update after confirmed matches.">
        <Card>
          <CardContent>
            <div className="lb__loading">Loading leaderboard…</div>
          </CardContent>
        </Card>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Leaderboards" subtitle="Rankings update after confirmed matches.">
        <Card>
          <CardContent>
            <div className="lb__error">{error}</div>
          </CardContent>
        </Card>
      </Page>
    );
  }

  const sportLabel = SPORT_LABELS[sport as keyof typeof SPORT_LABELS] || sport;

  return (
    <Page
      title={sportLabel}
      subtitle="Compare players, open profiles, and track win rates."
      actions={
        <SegmentedNav
          ariaLabel="Switch sport leaderboard"
          items={[
            { to: '/leaderboard/table_tennis', label: 'Table Tennis' },
            { to: '/leaderboard/table_football', label: 'Table Football' },
          ]}
        />
      }
    >
      <Card>
        <div className="lb">
          {/* Search input */}
          <div className="lb__search">
            <input
              type="text"
              className="lb__search-input"
              placeholder="Search by name or @login..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search players"
            />
            {searchQuery && (
              <button
                className="lb__search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="lb__head">
            <div
              className="lb__headcell lb__sortable"
              onClick={() => handleSort('rank')}
              style={{ cursor: 'pointer' }}
            >
              Rank<SortIndicator field="rank" />
            </div>
            <div className="lb__headcell">Player</div>
            <div
              className="lb__headcell lb__right lb__sortable"
              onClick={() => handleSort('elo')}
              style={{ cursor: 'pointer' }}
            >
              ELO<SortIndicator field="elo" />
            </div>
            <div
              className="lb__headcell lb__right lb__sortable"
              onClick={() => handleSort('matches')}
              style={{ cursor: 'pointer' }}
            >
              Matches<SortIndicator field="matches" />
            </div>
            <div
              className="lb__headcell lb__right lb__sortable"
              onClick={() => handleSort('wins')}
              style={{ cursor: 'pointer' }}
            >
              W/L<SortIndicator field="wins" />
            </div>
            <div
              className="lb__headcell lb__right lb__sortable"
              onClick={() => handleSort('winrate')}
              style={{ cursor: 'pointer' }}
            >
              Win rate<SortIndicator field="winrate" />
            </div>
          </div>

          <div className="lb__body">
            {filteredLeaderboard.map((entry) => (
              <div key={entry.user.id} className="lb__row">
                <div className="lb__cell lb__rank">{entry.rank}</div>
                <div className="lb__cell lb__player">
                  <LazyImage
                    src={entry.user.avatar_url}
                    alt={entry.user.display_name}
                    className="lb__avatar"
                  />
                  <div className="lb__playertext">
                    <Link className="lb__name" to={`/players/${entry.user.id}`}>
                      {entry.user.display_name}
                    </Link>
                    <div className="lb__meta muted">@{entry.user.login}</div>
                  </div>
                </div>
                <div className="lb__cell lb__right lb__elo">{entry.elo}</div>
                <div className="lb__cell lb__right">{entry.matches_played}</div>
                <div className="lb__cell lb__right">
                  {entry.wins} / {entry.losses}
                </div>
                <div className="lb__cell lb__right">{entry.win_rate.toFixed(1)}%</div>
              </div>
            ))}
          </div>

          {filteredLeaderboard.length === 0 && debouncedSearchQuery && (
            <div className="lb__empty">
              No players found matching "{debouncedSearchQuery}"
            </div>
          )}

          {leaderboard.length === 0 && !debouncedSearchQuery && (
            <div className="lb__empty">
              No matches yet. Submit the first match to start the ranking.
            </div>
          )}
        </div>
      </Card>
    </Page>
  );
}

export default Leaderboard;
