import { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadPlayerData();
  }, [id]);

  const loadPlayerData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const users = await usersAPI.getAll();
      const foundPlayer = users.find(u => u.id === parseInt(id));
      if (foundPlayer) {
        setPlayer(foundPlayer);
        const allMatches = await matchAPI.list({ user_id: parseInt(id) });
        setMatches(allMatches || []);
      }
    } catch (err) {
      console.error('Failed to load player:', err);
    } finally {
      setLoading(false);
    }
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

  const confirmedMatches = matches.filter(m => m.status === 'confirmed');
  const ttMatches = confirmedMatches.filter(m => m.sport === 'table_tennis');
  const tfMatches = confirmedMatches.filter(m => m.sport === 'table_football');
  const wins = confirmedMatches.filter(m => m.winner_id === player.id);
  const losses = confirmedMatches.length - wins.length;
  const winRate = confirmedMatches.length > 0 ? Math.round((wins.length / confirmedMatches.length) * 100) : 0;

  // Calculate current win streak
  let currentStreak = 0;
  const sortedMatches = [...confirmedMatches].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  for (const match of sortedMatches) {
    if (match.winner_id === player.id) {
      currentStreak++;
    } else {
      break;
    }
  }

  const filteredMatches = sportFilter
    ? confirmedMatches.filter(m => m.sport === sportFilter)
    : confirmedMatches;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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

      {/* Stats Grid */}
      <div className="profile__stats">
        <Card className="profile__stat-card">
          <CardContent>
            <span className="profile__stat-value">{confirmedMatches.length}</span>
            <span className="profile__stat-label">Total Matches</span>
          </CardContent>
        </Card>
        <Card className="profile__stat-card">
          <CardContent>
            <span className="profile__stat-value profile__stat-value--success">{wins.length}</span>
            <span className="profile__stat-label">Wins</span>
          </CardContent>
        </Card>
        <Card className="profile__stat-card">
          <CardContent>
            <span className="profile__stat-value profile__stat-value--danger">{losses}</span>
            <span className="profile__stat-label">Losses</span>
          </CardContent>
        </Card>
        <Card className="profile__stat-card">
          <CardContent>
            <span className="profile__stat-value">{winRate}%</span>
            <span className="profile__stat-label">Win Rate</span>
          </CardContent>
        </Card>
        <Card className="profile__stat-card">
          <CardContent>
            <span className="profile__stat-value">{currentStreak}</span>
            <span className="profile__stat-label">Win Streak</span>
          </CardContent>
        </Card>
        <Card className="profile__stat-card">
          <CardContent>
            <span className="profile__stat-value">{ttMatches.length} / {tfMatches.length}</span>
            <span className="profile__stat-label">TT / TF</span>
          </CardContent>
        </Card>
      </div>

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
