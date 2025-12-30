import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { matchAPI } from '../api/client';
import type { Match, User } from '../types';
import { SPORT_LABELS } from '../types';
import { Page } from '../layout/Page';
import { Card } from '../ui/Card';
import { StatusPill } from '../ui/StatusPill';
import Reactions from '../components/Reactions';
import Comments from '../components/Comments';
import { getErrorMessage } from '../utils/errorUtils';
import { useUsers, findUserById } from '../hooks';
import './Matches.css';

interface MatchesProps {
  user: User;
}

// Date range presets
type DateRangePreset = 'all' | 'today' | 'week' | 'month' | 'custom';

function Matches({ user }: MatchesProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [dateRange, setDateRange] = useState<DateRangePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Use the shared useUsers hook to prevent N+1 queries and get proper isMounted handling
  const { users } = useUsers();

  // Track mounted state to prevent state updates after unmount
  const isMounted = useRef(true);

  const loadMatches = useCallback(() => {
    setLoading(true);
    const params = filter === 'all' ? {} : { status: filter };
    matchAPI.list(params)
      .then(data => {
        if (isMounted.current) {
          setMatches(data || []);
        }
      })
      .catch(err => {
        if (isMounted.current) {
          console.error('Failed to load matches:', err);
        }
      })
      .finally(() => {
        if (isMounted.current) {
          setLoading(false);
        }
      });
  }, [filter]);

  // Filter matches by date range
  const filteredMatches = useMemo(() => {
    if (dateRange === 'all') return matches;

    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        startDate = customStartDate ? new Date(customStartDate) : new Date(0);
        endDate = customEndDate ? new Date(customEndDate + 'T23:59:59') : new Date();
        break;
      default:
        return matches;
    }

    return matches.filter(m => {
      const matchDate = new Date(m.created_at);
      return matchDate >= startDate && matchDate <= endDate;
    });
  }, [matches, dateRange, customStartDate, customEndDate]);

  useEffect(() => {
    isMounted.current = true;
    loadMatches();

    return () => {
      isMounted.current = false;
    };
  }, [loadMatches]);

  const handleConfirm = useCallback(async (matchId: number) => {
    try {
      await matchAPI.confirm(matchId);
      loadMatches();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  }, [loadMatches]);

  const handleDeny = useCallback(async (matchId: number) => {
    try {
      await matchAPI.deny(matchId);
      loadMatches();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  }, [loadMatches]);

  const handleCancel = useCallback(async (matchId: number) => {
    try {
      await matchAPI.cancel(matchId);
      loadMatches();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  }, [loadMatches]);

  if (loading) {
    return (
      <Page title="Match History" subtitle="View and manage your matches">
        <Card>
          <div className="loading">Loading matches...</div>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title="Match History"
      subtitle="View and manage your matches"
      actions={
        <div className="matches-filters">
          {/* Status Filter */}
          <div className="filters">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={filter === 'pending' ? 'active' : ''}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
            <button
              className={filter === 'confirmed' ? 'active' : ''}
              onClick={() => setFilter('confirmed')}
            >
              Confirmed
            </button>
          </div>

          {/* Date Range Filter */}
          <div className="filters">
            <button
              className={dateRange === 'all' ? 'active' : ''}
              onClick={() => setDateRange('all')}
            >
              All Time
            </button>
            <button
              className={dateRange === 'today' ? 'active' : ''}
              onClick={() => setDateRange('today')}
            >
              Today
            </button>
            <button
              className={dateRange === 'week' ? 'active' : ''}
              onClick={() => setDateRange('week')}
            >
              7 Days
            </button>
            <button
              className={dateRange === 'month' ? 'active' : ''}
              onClick={() => setDateRange('month')}
            >
              30 Days
            </button>
            <button
              className={dateRange === 'custom' ? 'active' : ''}
              onClick={() => setDateRange('custom')}
            >
              Custom
            </button>
          </div>

          {/* Custom Date Range Inputs */}
          {dateRange === 'custom' && (
            <div className="date-range-inputs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
              <span>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          )}
        </div>
      }
    >
      {filteredMatches.length === 0 ? (
        <Card>
          <div className="empty">
            {matches.length === 0 ? 'No matches found' : 'No matches in selected date range'}
          </div>
        </Card>
      ) : (
        <div className="matches-list">
          {filteredMatches.map((match) => {
            const isPending = match.status === 'pending';
            const isOpponent = match.player2_id === user.id || match.player1_id === user.id;
            const canRespond = isPending && match.submitted_by !== user.id && isOpponent;
            const canCancel = isPending && match.submitted_by === user.id;
            const sportLabel = SPORT_LABELS[match.sport as keyof typeof SPORT_LABELS];

            const player1 = findUserById(users, match.player1_id);
            const player2 = findUserById(users, match.player2_id);

            return (
              <div key={match.id} className="match-card">
                <div className="match-header">
                  <span className="sport">{sportLabel}</span>
                  <StatusPill tone={match.status}>{match.status}</StatusPill>
                </div>

                <div className="match-details">
                  <div className="scores">
                    {player1 ? (
                      <Link to={`/players/${player1.id}`}>
                        {player1.display_name}
                      </Link>
                    ) : 'Player 1'}: {match.player1_score} — {player2 ? (
                      <Link to={`/players/${player2.id}`}>
                        {player2.display_name}
                      </Link>
                    ) : 'Player 2'}: {match.player2_score}
                  </div>
                  {match.status === 'confirmed' && match.player1_elo_delta !== undefined && (
                    <div className="elo-changes">
                      {player1?.display_name || 'P1'} {match.player1_elo_delta > 0 ? '+' : ''}{match.player1_elo_delta} · {player2?.display_name || 'P2'} {match.player2_elo_delta! > 0 ? '+' : ''}{match.player2_elo_delta}
                    </div>
                  )}
                </div>

                {canRespond && (
                  <div className="match-actions">
                    <button onClick={() => handleConfirm(match.id)} className="confirm">
                      ✓ Confirm
                    </button>
                    <button onClick={() => handleDeny(match.id)} className="deny">
                      ✗ Deny
                    </button>
                  </div>
                )}

                {canCancel && (
                  <div className="match-actions">
                    <button onClick={() => handleCancel(match.id)} className="cancel">
                      ✗ Cancel
                    </button>
                  </div>
                )}

                {match.status === 'confirmed' && (
                  <>
                    <Reactions matchId={match.id} userId={user.id} />
                    <Comments matchId={match.id} userId={user.id} />
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Page>
  );
}

export default Matches;
