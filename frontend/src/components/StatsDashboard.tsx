import { useMemo } from 'react';
import type { Match, User } from '../types';
import { Card, CardContent } from '../ui/Card';
import './StatsDashboard.css';

interface StatsDashboardProps {
  player: User;
  matches: Match[];
  sport: string | null;
  users: User[]; // Add users list to look up opponent names
}

interface HeadToHeadRecord {
  opponentId: number;
  opponentName: string;
  wins: number;
  losses: number;
  total: number;
}

interface ELODataPoint {
  date: string;
  elo: number;
  matchId: number;
}

interface StreakInfo {
  current: number;
  longest: number;
  type: 'win' | 'loss' | 'none';
}

function StatsDashboard({ player, matches, sport, users }: StatsDashboardProps) {
  // Helper to get user name by ID
  const getUserName = (userId: number): string => {
    const user = users.find(u => u.id === userId);
    return user ? user.display_name : `Player #${userId}`;
  };

  // Filter confirmed matches only
  const confirmedMatches = useMemo(() => {
    let filtered = matches.filter(m => m.status === 'confirmed');
    if (sport) {
      filtered = filtered.filter(m => m.sport === sport);
    }
    return filtered.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [matches, sport]);

  // Calculate ELO history over time
  const eloHistory = useMemo((): ELODataPoint[] => {
    const history: ELODataPoint[] = [];

    confirmedMatches.forEach(match => {
      const isPlayer1 = match.player1_id === player.id;
      const eloAfter = isPlayer1 ? match.player1_elo_after : match.player2_elo_after;

      if (eloAfter !== undefined && eloAfter !== null) {
        history.push({
          date: new Date(match.created_at).toLocaleDateString(),
          elo: eloAfter,
          matchId: match.id,
        });
      }
    });

    return history;
  }, [confirmedMatches, player.id]);

  // Calculate streak information
  const streakInfo = useMemo((): StreakInfo => {
    if (confirmedMatches.length === 0) {
      return { current: 0, longest: 0, type: 'none' };
    }

    const sortedMatches = [...confirmedMatches].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Current streak
    let currentStreak = 0;
    let currentType: 'win' | 'loss' | 'none' = 'none';

    for (const match of sortedMatches) {
      const won = match.winner_id === player.id;
      if (currentStreak === 0) {
        currentType = won ? 'win' : 'loss';
        currentStreak = 1;
      } else if ((currentType === 'win' && won) || (currentType === 'loss' && !won)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Longest win streak
    let longestWinStreak = 0;
    let tempStreak = 0;

    for (const match of confirmedMatches) {
      if (match.winner_id === player.id) {
        tempStreak++;
        longestWinStreak = Math.max(longestWinStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return {
      current: currentStreak,
      longest: longestWinStreak,
      type: currentType,
    };
  }, [confirmedMatches, player.id]);

  // Calculate head-to-head records
  const headToHeadRecords = useMemo((): HeadToHeadRecord[] => {
    const records: Map<number, HeadToHeadRecord> = new Map();

    confirmedMatches.forEach(match => {
      const isPlayer1 = match.player1_id === player.id;
      const opponentId = isPlayer1 ? match.player2_id : match.player1_id;
      const won = match.winner_id === player.id;

      if (!records.has(opponentId)) {
        records.set(opponentId, {
          opponentId,
          opponentName: getUserName(opponentId),
          wins: 0,
          losses: 0,
          total: 0,
        });
      }

      const record = records.get(opponentId)!;
      record.total++;
      if (won) {
        record.wins++;
      } else {
        record.losses++;
      }
    });

    return Array.from(records.values()).sort((a, b) => b.total - a.total);
  }, [confirmedMatches, player.id, users]);

  // Performance by day of week
  const performanceByDay = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayStats = days.map(day => ({ day, wins: 0, losses: 0, total: 0 }));

    confirmedMatches.forEach(match => {
      const dayIndex = new Date(match.created_at).getDay();
      dayStats[dayIndex].total++;
      if (match.winner_id === player.id) {
        dayStats[dayIndex].wins++;
      } else {
        dayStats[dayIndex].losses++;
      }
    });

    return dayStats;
  }, [confirmedMatches, player.id]);

  // Calculate ELO graph dimensions
  const eloGraphData = useMemo(() => {
    if (eloHistory.length < 2) return null;

    const minElo = Math.min(...eloHistory.map(d => d.elo));
    const maxElo = Math.max(...eloHistory.map(d => d.elo));
    const range = maxElo - minElo || 100; // Avoid division by zero

    const width = 100;
    const height = 50;
    const padding = 5;

    const points = eloHistory.map((d, i) => {
      const x = padding + (i / (eloHistory.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((d.elo - minElo) / range) * (height - 2 * padding);
      return { x, y, ...d };
    });

    const pathD = points.map((p, i) =>
      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');

    return { points, pathD, minElo, maxElo, width, height };
  }, [eloHistory]);

  if (confirmedMatches.length === 0) {
    return (
      <Card className="stats-dashboard">
        <CardContent>
          <div className="stats-empty">
            No match data available for statistics.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="stats-dashboard">
      {/* Streak Cards */}
      <div className="stats-row">
        <Card className="stats-card stats-card--streak">
          <CardContent>
            <div className="stats-card__header">Current Streak</div>
            <div className={`stats-card__value stats-card__value--${streakInfo.type}`}>
              {streakInfo.current}
              <span className="stats-card__badge">
                {streakInfo.type === 'win' ? '🔥 Wins' : streakInfo.type === 'loss' ? '❄️ Losses' : '-'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card stats-card--streak">
          <CardContent>
            <div className="stats-card__header">Longest Win Streak</div>
            <div className="stats-card__value stats-card__value--win">
              {streakInfo.longest}
              <span className="stats-card__badge">🏆 Best</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ELO History Graph */}
      {eloGraphData && (
        <Card className="stats-card stats-card--graph">
          <CardContent>
            <div className="stats-card__header">ELO History</div>
            <div className="elo-graph">
              <svg viewBox={`0 0 ${eloGraphData.width} ${eloGraphData.height}`} className="elo-graph__svg">
                {/* Grid lines */}
                <line x1="5" y1="5" x2="5" y2="45" stroke="var(--border)" strokeWidth="0.5" />
                <line x1="5" y1="45" x2="95" y2="45" stroke="var(--border)" strokeWidth="0.5" />

                {/* ELO line */}
                <path
                  d={eloGraphData.pathD}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                {eloGraphData.points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="1.5"
                    fill="var(--primary)"
                  />
                ))}
              </svg>
              <div className="elo-graph__labels">
                <span className="elo-graph__label">{eloGraphData.maxElo}</span>
                <span className="elo-graph__label">{eloGraphData.minElo}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance by Day */}
      <Card className="stats-card stats-card--days">
        <CardContent>
          <div className="stats-card__header">Performance by Day</div>
          <div className="day-performance">
            {performanceByDay.map(day => (
              <div key={day.day} className="day-bar">
                <div className="day-bar__label">{day.day}</div>
                <div className="day-bar__container">
                  {day.total > 0 && (
                    <>
                      <div
                        className="day-bar__fill day-bar__fill--win"
                        style={{ width: `${(day.wins / day.total) * 100}%` }}
                      />
                      <div
                        className="day-bar__fill day-bar__fill--loss"
                        style={{ width: `${(day.losses / day.total) * 100}%` }}
                      />
                    </>
                  )}
                </div>
                <div className="day-bar__count">{day.total}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Head-to-Head Records */}
      {headToHeadRecords.length > 0 && (
        <Card className="stats-card stats-card--h2h">
          <CardContent>
            <div className="stats-card__header">Most Played Opponents</div>
            <div className="h2h-list">
              {headToHeadRecords.slice(0, 5).map(record => (
                <div key={record.opponentId} className="h2h-item">
                  <div className="h2h-item__info">
                    <span className="h2h-item__name">{record.opponentName}</span>
                    <span className="h2h-item__games">{record.total} games</span>
                  </div>
                  <div className="h2h-item__record">
                    <span className="h2h-item__wins">{record.wins}W</span>
                    <span className="h2h-item__separator">-</span>
                    <span className="h2h-item__losses">{record.losses}L</span>
                  </div>
                  <div className="h2h-item__bar">
                    <div
                      className="h2h-item__bar-fill"
                      style={{ width: `${(record.wins / record.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default StatsDashboard;
