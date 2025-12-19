import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { leaderboardAPI } from '../api/client';
import type { LeaderboardEntry } from '../types';
import { SPORT_LABELS } from '../types';

interface LeaderboardProps {
  sport?: string;
}

function Leaderboard({ sport: propSport }: LeaderboardProps) {
  const { sport: paramSport } = useParams();
  const sport = propSport || paramSport || 'table_tennis';
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaderboardAPI.get(sport)
      .then(data => setLeaderboard(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sport]);

  if (loading) {
    return <div className="loading">Loading leaderboard...</div>;
  }

  const sportLabel = SPORT_LABELS[sport as keyof typeof SPORT_LABELS] || sport;

  return (
    <div className="leaderboard-page">
      <h1>{sportLabel} Leaderboard</h1>
      
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>ELO</th>
            <th>Matches</th>
            <th>W/L</th>
            <th>Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry) => (
            <tr key={entry.user.id}>
              <td className="rank">{entry.rank}</td>
              <td className="player">
                <img src={entry.user.avatar_url} alt={entry.user.display_name} className="avatar" />
                <span>{entry.user.display_name}</span>
              </td>
              <td className="elo">{entry.elo}</td>
              <td>{entry.matches_played}</td>
              <td>{entry.wins} / {entry.losses}</td>
              <td>{entry.win_rate.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {leaderboard.length === 0 && (
        <p className="empty">No matches yet. Be the first to play!</p>
      )}
    </div>
  );
}

export default Leaderboard;
