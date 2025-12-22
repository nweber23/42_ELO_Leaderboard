import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { leaderboardAPI } from '../api/client';
import type { LeaderboardEntry } from '../types';
import { SPORT_LABELS } from '../types';
import { Page } from '../layout/Page';
import { Card, CardContent } from '../ui/Card';
import { SegmentedNav } from '../ui/Segmented';
import '../styles/leaderboard.css';

interface LeaderboardProps {
  sport?: string;
}

function Leaderboard({ sport: propSport }: LeaderboardProps) {
  const { sport: paramSport } = useParams();
  const sport = propSport || paramSport || 'table_tennis';

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Track mounted state to prevent state updates after unmount
  const isMounted = useRef(true);

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
  }, [sport]);

  // Filter leaderboard based on search query (by login or display name)
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) {
      return leaderboard;
    }
    const query = searchQuery.toLowerCase().trim();
    return leaderboard.filter(entry =>
      entry.user.login.toLowerCase().includes(query) ||
      entry.user.display_name.toLowerCase().includes(query)
    );
  }, [leaderboard, searchQuery]);

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
            <div className="lb__headcell">Rank</div>
            <div className="lb__headcell">Player</div>
            <div className="lb__headcell lb__right">ELO</div>
            <div className="lb__headcell lb__right">Matches</div>
            <div className="lb__headcell lb__right">W/L</div>
            <div className="lb__headcell lb__right">Win rate</div>
          </div>

          <div className="lb__body">
            {filteredLeaderboard.map((entry) => (
              <div key={entry.user.id} className="lb__row">
                <div className="lb__cell lb__rank">{entry.rank}</div>
                <div className="lb__cell lb__player">
                  <img src={entry.user.avatar_url} alt={entry.user.display_name} className="lb__avatar" />
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

          {filteredLeaderboard.length === 0 && searchQuery && (
            <div className="lb__empty">
              No players found matching "{searchQuery}"
            </div>
          )}

          {leaderboard.length === 0 && !searchQuery && (
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
