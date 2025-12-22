import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usersAPI, matchAPI } from '../api/client';
import type { User, Match } from '../types';
import { SPORT_LABELS } from '../types';
import { Page } from '../layout/Page';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import './PlayerProfile.css';

function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState<string | null>(null);

  // Prevent state updates after unmount
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const loadPlayerData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const users = await usersAPI.getAll();
        const foundPlayer = users.find(u => u.id === parseInt(id));
        if (foundPlayer && isMounted.current) {
          setPlayer(foundPlayer);
          const allMatches = await matchAPI.list({ user_id: parseInt(id) });
          if (isMounted.current) {
            setMatches(allMatches || []);
          }
        }
      } catch (err) {
        console.error('Failed to load player:', err);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    loadPlayerData();

    return () => {
      isMounted.current = false;
    };
  }, [id]);

  const [statsFilter, setStatsFilter] = useState<string | null>(null);

  // Memoize expensive calculations - must be called unconditionally (before any returns)
  const allConfirmedMatches = useMemo(() => {
    return matches.filter((m: Match) => m.status === 'confirmed');
  }, [matches]);

  // Calculate stats based on the selected filter
  const stats = useMemo(() => {
    if (!player) {
      return {
        totalMatches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        currentStreak: 0,
      };
    }

    // Filter matches based on stats filter
    const filteredMatches = statsFilter
      ? allConfirmedMatches.filter((m: Match) => m.sport === statsFilter)
      : allConfirmedMatches;

    const wins = filteredMatches.filter((m: Match) => m.winner_id === player.id).length;
    const losses = filteredMatches.length - wins;
    const winRate = filteredMatches.length > 0
      ? Math.round((wins / filteredMatches.length) * 100)
      : 0;

    // Calculate current win streak for filtered sport
    let currentStreak = 0;
    const sortedMatches = [...filteredMatches].sort((a: Match, b: Match) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    for (const match of sortedMatches) {
      if (match.winner_id === player.id) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      totalMatches: filteredMatches.length,
      wins,
      losses,
      winRate,
      currentStreak,
    };
  }, [allConfirmedMatches, player, statsFilter]);

  const filteredMatches = useMemo(() => {
    return sportFilter
      ? allConfirmedMatches.filter((m: Match) => m.sport === sportFilter)
      : allConfirmedMatches;
  }, [allConfirmedMatches, sportFilter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <Page title="Player Profile">
        <Card>
          <CardContent>
            <div className="loading">Loading profile...</div>
          </CardContent>
        </Card>
      </Page>
    );
  }

  if (!player) {
    return (
      <Page title="Player Not Found">
        <Card>
          <CardContent>
            <div className="empty">
              <p>Player not found</p>
              <Link to="/leaderboard/table_tennis">
                <Button variant="secondary" style={{ marginTop: 'var(--space-4)' }}>
                  Back to Leaderboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </Page>
    );
  }

  return (
    <div className="profile">
      <Link to="/leaderboard/table_tennis" className="profile__back">
        ← Back to Leaderboard
      </Link>

      {/* Header Card */}
      <Card className="profile__header-card">
        <CardContent>
          <div className="profile__header">
            <img src={player.avatar_url} alt={player.display_name} className="profile__avatar" />
            <div className="profile__info">
              <h1 className="profile__name">{player.display_name}</h1>
              <p className="profile__meta">@{player.login} · {player.campus}</p>
            </div>
          </div>

          <div className="profile__elo-grid">
            <div className="profile__elo-item">
              <span className="profile__elo-label">Table Tennis</span>
              <span className="profile__elo-value">{player.table_tennis_elo}</span>
            </div>
            <div className="profile__elo-item">
              <span className="profile__elo-label">Table Football</span>
              <span className="profile__elo-value">{player.table_football_elo}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Section */}
      <Card className="profile__stats-card">
        <div className="profile__stats-header">
          <h2 className="profile__section-title">Statistics</h2>
          <div className="filters">
            <button
              className={!statsFilter ? 'active' : ''}
              onClick={() => setStatsFilter(null)}
            >
              All
            </button>
            <button
              className={statsFilter === 'table_tennis' ? 'active' : ''}
              onClick={() => setStatsFilter('table_tennis')}
            >
              Table Tennis
            </button>
            <button
              className={statsFilter === 'table_football' ? 'active' : ''}
              onClick={() => setStatsFilter('table_football')}
            >
              Table Football
            </button>
          </div>
        </div>
        <CardContent>
          <div className="profile__stats">
            <div className="profile__stat-item">
              <span className="profile__stat-value">{stats.totalMatches}</span>
              <span className="profile__stat-label">Total Matches</span>
            </div>
            <div className="profile__stat-item">
              <span className="profile__stat-value profile__stat-value--success">{stats.wins}</span>
              <span className="profile__stat-label">Wins</span>
            </div>
            <div className="profile__stat-item">
              <span className="profile__stat-value profile__stat-value--danger">{stats.losses}</span>
              <span className="profile__stat-label">Losses</span>
            </div>
            <div className="profile__stat-item">
              <span className="profile__stat-value">{stats.winRate}%</span>
              <span className="profile__stat-label">Win Rate</span>
            </div>
            <div className="profile__stat-item">
              <span className="profile__stat-value">{stats.currentStreak}</span>
              <span className="profile__stat-label">Win Streak</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Match History */}
      <Card>
        <div className="profile__history-header">
          <h2 className="profile__section-title">Match History</h2>
          <div className="filters">
            <button
              className={!sportFilter ? 'active' : ''}
              onClick={() => setSportFilter(null)}
            >
              All
            </button>
            <button
              className={sportFilter === 'table_tennis' ? 'active' : ''}
              onClick={() => setSportFilter('table_tennis')}
            >
              Table Tennis
            </button>
            <button
              className={sportFilter === 'table_football' ? 'active' : ''}
              onClick={() => setSportFilter('table_football')}
            >
              Table Football
            </button>
          </div>
        </div>
        <CardContent>
          {filteredMatches.length === 0 ? (
            <div className="empty">No matches found</div>
          ) : (
            <div className="profile__matches">
              {filteredMatches.slice(0, 20).map(match => {
                const isWin = match.winner_id === player.id;
                const isPlayer1 = match.player1_id === player.id;
                const myScore = isPlayer1 ? match.player1_score : match.player2_score;
                const oppScore = isPlayer1 ? match.player2_score : match.player1_score;
                const eloDelta = isPlayer1 ? match.player1_elo_delta : match.player2_elo_delta;

                return (
                  <div key={match.id} className={`profile__match ${isWin ? 'profile__match--win' : 'profile__match--loss'}`}>
                    <div className="profile__match-result">
                      <span className="profile__match-icon">{isWin ? '🏆' : '⚔️'}</span>
                      <span className="profile__match-outcome">{isWin ? 'Victory' : 'Defeat'}</span>
                    </div>
                    <div className="profile__match-details">
                      <span className="profile__match-sport">
                        {SPORT_LABELS[match.sport as keyof typeof SPORT_LABELS]}
                      </span>
                      <span className="profile__match-date">{formatDate(match.created_at)}</span>
                    </div>
                    <div className="profile__match-score">
                      <span className="profile__match-score-value">{myScore} - {oppScore}</span>
                      {eloDelta !== undefined && (
                        <span className={`profile__match-elo ${eloDelta > 0 ? 'profile__match-elo--positive' : 'profile__match-elo--negative'}`}>
                          {eloDelta > 0 ? '+' : ''}{eloDelta}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PlayerProfile;
