import { useState, useEffect, useRef } from "react";
import { leaderboardAPI, matchAPI } from "../api/client";
import type { User, Match, LeaderboardEntry } from "../types";
import { getSports, getSportLabel, type SportConfig } from "../config/sports";
import "./player-panel.css";

interface PlayerPanelProps {
  playerId: number;
  sport: string;
  onClose: () => void;
  currentUser: User | null;
}

interface PlayerStats {
  user: User;
  sportStats: Record<string, LeaderboardEntry>;
}

export function PlayerPanel({
  playerId,
  sport,
  onClose,
  currentUser,
}: PlayerPanelProps) {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSport, setActiveSport] = useState(sport);
  const [sports, setSports] = useState<SportConfig[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load sports configuration
  useEffect(() => {
    getSports().then(setSports).catch(console.error);
  }, []);

  // Fetch player data
  useEffect(() => {
    setLoading(true);

    // Fetch sports first, then fetch leaderboards for all sports
    const fetchData = async () => {
      const sportsConfig = await getSports();

      const leaderboardPromises = sportsConfig.map(async (s) => {
        const leaderboard = await leaderboardAPI.get(s.id);
        return { sportId: s.id, leaderboard };
      });

      const leaderboards = await Promise.all(leaderboardPromises);

      // Only fetch matches if user is authenticated
      let allMatches: Match[] = [];
      if (currentUser) {
        try {
          allMatches = await matchAPI.list({ status: "confirmed" });
        } catch (error) {
          // Silently handle auth errors - user is not logged in
          console.debug("Could not fetch matches (not authenticated)");
        }
      }

      // Build sport stats map
      const sportStats: Record<string, LeaderboardEntry> = {};
      let foundUser: User | null = null;

      leaderboards.forEach(({ sportId, leaderboard }) => {
        const entry = leaderboard.find(
          (e: LeaderboardEntry) => e.user.id === playerId
        );
        if (entry) {
          sportStats[sportId] = entry;
          if (!foundUser) foundUser = entry.user;
        }
      });

      if (foundUser) {
        setStats({
          user: foundUser,
          sportStats,
        });
      }

      // Filter matches for this player
      const playerMatches = allMatches.filter(
        (m: Match) => m.player1_id === playerId || m.player2_id === playerId
      );
      setMatches(playerMatches.slice(0, 10));
    };

    fetchData()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [playerId, currentUser]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const activeStats = stats?.sportStats[activeSport] || null;

  const isCurrentUser = currentUser?.id === playerId;

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="panel" ref={panelRef}>
        <div className="panel__header">
          <button className="panel__close" onClick={onClose}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="panel__loading">Loading…</div>
        ) : stats ? (
          <div className="panel__content">
            {/* Player header */}
            <div className="panel__player">
              <img
                src={stats.user.avatar_url}
                alt=""
                className="panel__avatar"
              />
              <div className="panel__player-info">
                <h2 className="panel__name">
                  {stats.user.display_name}
                  {isCurrentUser && <span className="panel__you">You</span>}
                </h2>
                <span className="panel__login">@{stats.user.login}</span>
              </div>
            </div>

            {/* Sport tabs */}
            <div className="panel__tabs">
              {sports.map((s) => (
                <button
                  key={s.id}
                  className={`panel__tab ${activeSport === s.id ? "panel__tab--active" : ""}`}
                  onClick={() => setActiveSport(s.id)}
                  data-sport={s.id}
                >
                  {s.display_name}
                </button>
              ))}
            </div>

            {/* Stats grid */}
            {activeStats ? (
              <div className="panel__stats">
                <div className="panel__stat">
                  <span className="panel__stat-label">Rank</span>
                  <span className="panel__stat-value data">
                    #{activeStats.rank}
                  </span>
                </div>
                <div className="panel__stat">
                  <span className="panel__stat-label">ELO</span>
                  <span className="panel__stat-value data">
                    {activeStats.elo}
                  </span>
                </div>
                <div className="panel__stat">
                  <span className="panel__stat-label">Games</span>
                  <span className="panel__stat-value data">
                    {activeStats.matches_played}
                  </span>
                </div>
                <div className="panel__stat">
                  <span className="panel__stat-label">Win Rate</span>
                  <span className="panel__stat-value data">
                    {activeStats.win_rate.toFixed(0)}%
                  </span>
                </div>
                <div className="panel__stat panel__stat--wide">
                  <span className="panel__stat-label">Record</span>
                  <span className="panel__stat-value">
                    <span className="text-positive">{activeStats.wins}W</span>
                    <span className="panel__stat-sep">/</span>
                    <span className="text-negative">{activeStats.losses}L</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="panel__no-stats">
                No {getSportLabel(activeSport)} matches yet
              </div>
            )}

            {/* Recent matches */}
            <div className="panel__section">
              <h3 className="panel__section-title">Recent Matches</h3>
              {matches.length > 0 ? (
                <div className="panel__matches">
                  {matches
                    .filter((m) => m.sport === activeSport)
                    .slice(0, 5)
                    .map((match) => {
                      const isPlayer1 = match.player1_id === playerId;
                      const won = match.winner_id === playerId;
                      const myScore = isPlayer1
                        ? match.player1_score
                        : match.player2_score;
                      const theirScore = isPlayer1
                        ? match.player2_score
                        : match.player1_score;
                      const eloDelta = isPlayer1
                        ? match.player1_elo_delta
                        : match.player2_elo_delta;

                      return (
                        <div
                          key={match.id}
                          className={`panel__match ${won ? "panel__match--win" : "panel__match--loss"}`}
                        >
                          <span className="panel__match-result">
                            {won ? "W" : "L"}
                          </span>
                          <span className="panel__match-score data">
                            {myScore}–{theirScore}
                          </span>
                          {eloDelta !== undefined && (
                            <span
                              className={`panel__match-elo data ${eloDelta > 0 ? "text-positive" : "text-negative"}`}
                            >
                              {eloDelta > 0 ? "+" : ""}
                              {eloDelta}
                            </span>
                          )}
                          <span className="panel__match-date">
                            {new Date(match.created_at).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric" }
                            )}
                          </span>
                        </div>
                      );
                    })}
                  {matches.filter((m) => m.sport === activeSport).length ===
                    0 && (
                    <div className="panel__no-matches">
                      No recent {getSportLabel(activeSport)} matches
                    </div>
                  )}
                </div>
              ) : (
                <div className="panel__no-matches">No matches yet</div>
              )}
            </div>
          </div>
        ) : (
          <div className="panel__error">Player not found</div>
        )}
      </div>
    </>
  );
}
