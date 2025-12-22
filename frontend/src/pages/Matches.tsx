import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { matchAPI, usersAPI } from '../api/client';
import type { Match, User } from '../types';
import { SPORT_LABELS } from '../types';
import { Page } from '../layout/Page';
import { Card } from '../ui/Card';
import { StatusPill } from '../ui/StatusPill';
import Reactions from '../components/Reactions';
import Comments from '../components/Comments';

interface MatchesProps {
  user: User;
}

function Matches({ user }: MatchesProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');

  const loadMatches = () => {
    const params = filter === 'all' ? {} : { status: filter };
    matchAPI.list(params)
      .then(data => setMatches(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    usersAPI.getAll().then(setUsers).catch(console.error);
  }, []);

  useEffect(() => {
    loadMatches();
  }, [filter]);

  const handleConfirm = async (matchId: number) => {
    try {
      await matchAPI.confirm(matchId);
      loadMatches();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to confirm match');
    }
  };

  const handleDeny = async (matchId: number) => {
    try {
      await matchAPI.deny(matchId);
      loadMatches();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to deny match');
    }
  };

  const handleCancel = async (matchId: number) => {
    try {
      await matchAPI.cancel(matchId);
      loadMatches();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel match');
    }
  };

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

            const player1 = users.find(u => u.id === match.player1_id);
            const player2 = users.find(u => u.id === match.player2_id);

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
