import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usersAPI, matchAPI } from '../api/client';
import type { User, Match } from '../types';
import { SPORT_LABELS } from '../types';

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
        
        // Load player's matches
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
    return <div className="loading">Loading profile...</div>;
  }

  if (!player) {
    return (
      <div className="empty">
        <p>Player not found</p>
        <Link to="/leaderboard/table_tennis" style={{ color: 'var(--accent)', marginTop: '16px', display: 'inline-block' }}>
          Back to Leaderboard
        </Link>
      </div>
    );
  }

  // Calculate statistics
  const confirmedMatches = matches.filter(m => m.status === 'confirmed');
  const ttMatches = confirmedMatches.filter(m => m.sport === 'table_tennis');
  const tfMatches = confirmedMatches.filter(m => m.sport === 'table_football');
  
  const wins = confirmedMatches.filter(m => m.winner_id === player.id);

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const sortedMatches = [...confirmedMatches].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  sortedMatches.forEach(match => {
    if (match.winner_id === player.id) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      if (currentStreak === 0 && tempStreak > 0) {
        currentStreak = 0;
      }
      tempStreak = 0;
    }
  });

  if (sortedMatches.length > 0 && sortedMatches[0].winner_id === player.id) {
    currentStreak = tempStreak;
  }

  // Most played rival
  const opponents = confirmedMatches.reduce((acc, m) => {
    const oppId = m.player1_id === player.id ? m.player2_id : m.player1_id;
    acc[oppId] = (acc[oppId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const mostPlayedRivalId = Object.entries(opponents).sort((a, b) => b[1] - a[1])[0]?.[0];
  const rivalMatchCount = mostPlayedRivalId ? opponents[parseInt(mostPlayedRivalId)] : 0;

  // Filter matches
  const filteredMatches = sportFilter
    ? confirmedMatches.filter(m => m.sport === sportFilter)
    : confirmedMatches;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      <Link to="/leaderboard/table_tennis" style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', display: 'inline-block' }}>
        ← Back to Leaderboard
      </Link>

      {/* Player Header */}
      <div style={{ background: 'var(--bg-secondary)', padding: '32px', borderRadius: 'var(--radius-lg)', marginBottom: '24px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <img src={player.avatar_url} alt={player.display_name} className="avatar" style={{ width: '80px', height: '80px' }} />
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
              {player.display_name}
            </h1>
            <div style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
              @{player.login} · {player.campus}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>TABLE TENNIS ELO</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent)' }}>{player.table_tennis_elo}</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>TABLE FOOTBALL ELO</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent)' }}>{player.table_football_elo}</div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: 'var(--radius-lg)', marginBottom: '24px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-subtle)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>Statistics</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Win Streak</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>{currentStreak}</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Longest Streak</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>{longestStreak}</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Table Tennis</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>{ttMatches.length} matches</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Table Football</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>{tfMatches.length} matches</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Win Rate</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--success)' }}>
              {confirmedMatches.length > 0 ? Math.round((wins.length / confirmedMatches.length) * 100) : 0}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Most Played Rival</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {rivalMatchCount > 0 ? `${rivalMatchCount} matches` : 'None'}
            </div>
          </div>
        </div>
      </div>

      {/* Match History */}
      <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>Match History</h2>
          
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

        {filteredMatches.length === 0 ? (
          <div className="empty">No matches found</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredMatches.map(match => {
              const isWin = match.winner_id === player.id;
              const isPlayer1 = match.player1_id === player.id;
              const myScore = isPlayer1 ? match.player1_score : match.player2_score;
              const oppScore = isPlayer1 ? match.player2_score : match.player1_score;
              const eloDelta = isPlayer1 ? match.player1_elo_delta : match.player2_elo_delta;

              return (
                <div key={match.id} style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: `2px solid ${isWin ? 'var(--success)' : 'var(--error)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        {SPORT_LABELS[match.sport as keyof typeof SPORT_LABELS]} · {formatDate(match.created_at)}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {isWin ? '🏆 Victory' : '⚔️ Defeat'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {myScore} - {oppScore}
                      </div>
                      {eloDelta !== undefined && (
                        <div style={{ fontSize: '13px', color: eloDelta > 0 ? 'var(--success)' : 'var(--error)' }}>
                          {eloDelta > 0 ? '+' : ''}{eloDelta} ELO
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerProfile;
