import { useState, useEffect, useCallback, useRef } from 'react';
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

interface MatchesProps {
  user: User;
}

function Matches({ user }: MatchesProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');

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
      }
    >
      {matches.length === 0 ? (
        <Card>
          <div className="empty">No matches found</div>
        </Card>
      ) : (
        <div className="matches-list">
          {matches.map((match) => {
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
