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
    // Only show graph for specific sports, not "all"
    if (!sport || eloHistory.length < 2) return null;

    const elos = eloHistory.map(d => d.elo);
    const minElo = Math.min(...elos);
    const maxElo = Math.max(...elos);
    // Add 5% padding to min/max for visual breathing room
    const eloPadding = Math.max((maxElo - minElo) * 0.1, 10);
    const displayMin = Math.floor((minElo - eloPadding) / 10) * 10;
    const displayMax = Math.ceil((maxElo + eloPadding) / 10) * 10;
    const range = displayMax - displayMin;

    // Chart dimensions (will be scaled by CSS)
    const chartWidth = 400;
    const chartHeight = 160;
    const paddingLeft = 45;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 30;
    const graphWidth = chartWidth - paddingLeft - paddingRight;
    const graphHeight = chartHeight - paddingTop - paddingBottom;

    // Calculate points
    const points = eloHistory.map((d, i) => {
      const x = paddingLeft + (i / (eloHistory.length - 1)) * graphWidth;
      const y = paddingTop + (1 - (d.elo - displayMin) / range) * graphHeight;
      return { x, y, ...d };
    });

    // Generate smooth bezier curve path
    const getPath = (pts: Array<ELODataPoint & { x: number; y: number }>) => {
      if (pts.length === 0) return '';
      if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

      let d = `M ${pts[0].x} ${pts[0].y}`;

      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = i > 0 ? pts[i - 1] : pts[0];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      return d;
    };

    const pathD = getPath(points);

    // Create area path for gradient fill
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    const areaD = `${pathD} L ${lastPoint.x} ${paddingTop + graphHeight} L ${firstPoint.x} ${paddingTop + graphHeight} Z`;

    // Generate horizontal grid lines (5 lines)
    const gridLines = [];
    const numGridLines = 4;
    for (let i = 0; i <= numGridLines; i++) {
      const yPos = paddingTop + (i / numGridLines) * graphHeight;
      const eloValue = Math.round(displayMax - (i / numGridLines) * range);
      gridLines.push({ y: yPos, elo: eloValue });
    }

    return {
      points,
      pathD,
      areaD,
      minElo: displayMin,
      maxElo: displayMax,
      chartWidth,
      chartHeight,
      paddingLeft,
      paddingTop,
      graphWidth,
      graphHeight,
      gridLines,
    };
  }, [eloHistory, sport]);

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
            <div className="stats-card__header">
              ELO History
              <span className="stats-card__header-sub">{eloHistory.length} matches</span>
            </div>
            <div className="elo-graph">
              <svg
                viewBox={`0 0 ${eloGraphData.chartWidth} ${eloGraphData.chartHeight}`}
                className="elo-graph__svg"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient id="eloAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Horizontal grid lines with labels */}
                {eloGraphData.gridLines.map((line, i) => (
                  <g key={i}>
                    <line
                      x1={eloGraphData.paddingLeft}
                      y1={line.y}
                      x2={eloGraphData.paddingLeft + eloGraphData.graphWidth}
                      y2={line.y}
                      stroke="var(--border-subtle)"
                      strokeWidth="1"
                      strokeDasharray={i === eloGraphData.gridLines.length - 1 ? "0" : "4 4"}
                    />
                    <text
                      x={eloGraphData.paddingLeft - 8}
                      y={line.y + 4}
                      textAnchor="end"
                      className="elo-graph__axis-label"
                    >
                      {line.elo}
                    </text>
                  </g>
                ))}

                {/* Area fill */}
                <path
                  d={eloGraphData.areaD}
                  fill="url(#eloAreaGradient)"
                  stroke="none"
                />

                {/* ELO line with glow */}
                <path
                  d={eloGraphData.pathD}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />

                {/* Data points */}
                {eloGraphData.points.map((p, i) => (
                  <g key={i} className="elo-graph__point-group">
                    {/* Invisible hitbox for hover */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="12"
                      className="elo-graph__point-hitbox"
                    />
                    {/* Visible point */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      className="elo-graph__point"
                    />
                    {/* Tooltip */}
                    <g className="elo-graph__tooltip">
                      <rect
                        x={p.x - 30}
                        y={p.y - 36}
                        width="60"
                        height="28"
                        rx="6"
                        className="elo-graph__tooltip-bg"
                      />
                      <text
                        x={p.x}
                        y={p.y - 22}
                        textAnchor="middle"
                        className="elo-graph__tooltip-value"
                      >
                        {p.elo}
                      </text>
                      <text
                        x={p.x}
                        y={p.y - 12}
                        textAnchor="middle"
                        className="elo-graph__tooltip-date"
                      >
                        {p.date}
                      </text>
                    </g>
                  </g>
                ))}
              </svg>
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
