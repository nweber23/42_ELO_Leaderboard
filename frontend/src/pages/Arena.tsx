import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { leaderboardAPI, matchAPI, usersAPI } from "../api/client";
import type { LeaderboardEntry, User } from "../types";
import { useDebounce } from "../hooks";
import { calculateELOChange, formatEloDelta } from "../utils/eloUtils";
import { PlayerPanel } from "../components/PlayerPanel";
import "./arena.css";

type SortField = "rank" | "elo" | "matches" | "wins" | "winrate";
type SortDirection = "asc" | "desc";

interface OutletContext {
  user: User | null;
  openPlayer: (id: number) => void;
  panelPlayerId: number | null;
  closePanel: () => void;
}

export default function Arena() {
  const { sport = "table_tennis" } = useParams();
  const { user, openPlayer, panelPlayerId, closePanel } =
    useOutletContext<OutletContext>();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Quick log state
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [opponent, setOpponent] = useState<User | null>(null);
  const [playerScore, setPlayerScore] = useState("");
  const [opponentScore, setOpponentScore] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const isMounted = useRef(true);
  const quickLogRef = useRef<HTMLDivElement>(null);

  // Fetch leaderboard
  useEffect(() => {
    isMounted.current = true;
    setLoading(true);
    setError(null);

    leaderboardAPI
      .get(sport)
      .then((data) => {
        if (isMounted.current) {
          setLeaderboard(data || []);
        }
      })
      .catch((err) => {
        if (isMounted.current) {
          console.error("Failed to load leaderboard:", err);
          setError("Failed to load leaderboard");
        }
      })
      .finally(() => {
        if (isMounted.current) {
          setLoading(false);
        }
      });

    return () => {
      isMounted.current = false;
    };
  }, [sport, user?.id]);

  // Fetch all users for opponent selection
  useEffect(() => {
    if (user) {
      usersAPI.getAll().then((users) => {
        setAllUsers(users.filter((u) => u.id !== user.id));
      });
    }
  }, [user]);

  // Handle sort
  const handleSort = useCallback((field: SortField) => {
    setSortField((current) => {
      if (current === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        return field;
      }
      setSortDirection(field === "rank" ? "asc" : "desc");
      return field;
    });
  }, []);

  // Filter and sort
  const filteredLeaderboard = useMemo(() => {
    let result = leaderboard;

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      result = result.filter(
        (entry) =>
          entry.user.login.toLowerCase().includes(query) ||
          entry.user.display_name.toLowerCase().includes(query)
      );
    }

    result = [...result].sort((a, b) => {
      let aVal: number;
      let bVal: number;

      switch (sortField) {
        case "rank":
          aVal = a.rank;
          bVal = b.rank;
          break;
        case "elo":
          aVal = a.elo;
          bVal = b.elo;
          break;
        case "matches":
          aVal = a.matches_played;
          bVal = b.matches_played;
          break;
        case "wins":
          aVal = a.wins;
          bVal = b.wins;
          break;
        case "winrate":
          aVal = a.win_rate;
          bVal = b.win_rate;
          break;
        default:
          return 0;
      }

      const diff = aVal - bVal;
      return sortDirection === "asc" ? diff : -diff;
    });

    return result;
  }, [leaderboard, debouncedSearchQuery, sortField, sortDirection]);

  // Find user's rank
  const userRank = useMemo(() => {
    if (!user) return null;
    const entry = leaderboard.find((e) => e.user.id === user.id);
    return entry?.rank || null;
  }, [leaderboard, user]);

  const userElo = useMemo(() => {
    return sport === "table_tennis"
      ? user?.table_tennis_elo
      : user?.table_football_elo;
  }, [user, sport]);

  // ELO prediction for quick log
  const eloPrediction = useMemo(() => {
    if (!user || !opponent || !playerScore || !opponentScore) return null;

    const pScore = Number(playerScore);
    const oScore = Number(opponentScore);
    if (isNaN(pScore) || isNaN(oScore) || pScore === oScore) return null;

    const playerELO = userElo || 1000;
    const opponentELO =
      sport === "table_tennis"
        ? opponent.table_tennis_elo
        : opponent.table_football_elo;

    const playerWins = pScore > oScore;
    return calculateELOChange(playerELO, opponentELO, playerWins);
  }, [user, opponent, playerScore, opponentScore, userElo, sport]);

  // Quick log submit
  const handleQuickLog = async () => {
    if (!opponent) return;

    const pScore = Number(playerScore);
    const oScore = Number(opponentScore);

    if (pScore === oScore) {
      setSubmitError("No ties allowed");
      return;
    }

    if (pScore < 0 || oScore < 0) {
      setSubmitError("Invalid scores");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      await matchAPI.submit({
        sport: sport as "table_tennis" | "table_football",
        opponent_id: opponent.id,
        player_score: pScore,
        opponent_score: oScore,
      });

      setSubmitSuccess(true);
      setPlayerScore("");
      setOpponentScore("");
      setOpponent(null);

      // Refresh leaderboard
      const data = await leaderboardAPI.get(sport);
      setLeaderboard(data || []);

      setTimeout(() => {
        setSubmitSuccess(false);
        setQuickLogOpen(false);
      }, 2000);
    } catch (err) {
      setSubmitError("Failed to submit match");
    } finally {
      setSubmitting(false);
    }
  };

  // Quick log opponent from row
  const handleRowQuickLog = (entry: LeaderboardEntry) => {
    if (!user || entry.user.id === user.id) return;
    setOpponent(entry.user);
    setQuickLogOpen(true);
    setTimeout(() => {
      quickLogRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return (
      <span className="arena__sort-icon">
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="arena">
        <div className="arena__loading">Loading rankings…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="arena">
        <div className="arena__error">{error}</div>
      </div>
    );
  }

  return (
    <div className="arena">
      {/* Personal status bar */}
      {user && (
        <div className="arena__status">
          <div className="arena__status-inner">
            <div className="arena__status-left">
              <span className="arena__status-label">Your Rank</span>
              <span className="arena__status-value data">
                {userRank ? `#${userRank}` : "—"}
              </span>
            </div>
            <div className="arena__status-center">
              <span className="arena__status-label">ELO</span>
              <span className="arena__status-value data">{userElo || 1000}</span>
            </div>
            <div className="arena__status-right">
              <button
                className={`arena__quick-log-trigger ${quickLogOpen ? "arena__quick-log-trigger--active" : ""}`}
                onClick={() => setQuickLogOpen(!quickLogOpen)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Log Match</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick log panel */}
      {user && quickLogOpen && (
        <div className="arena__quick-log" ref={quickLogRef}>
          <div className="arena__quick-log-inner">
            {submitSuccess ? (
              <div className="arena__quick-log-success">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Match submitted — awaiting confirmation</span>
              </div>
            ) : (
              <>
                <div className="arena__quick-log-field">
                  <label className="label">Opponent</label>
                  <select
                    className="arena__quick-log-select"
                    value={opponent?.id || ""}
                    onChange={(e) => {
                      const u = allUsers.find(
                        (u) => u.id === Number(e.target.value)
                      );
                      setOpponent(u || null);
                    }}
                  >
                    <option value="">Select opponent…</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.display_name} (@{u.login})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="arena__quick-log-scores">
                  <div className="arena__quick-log-field arena__quick-log-field--score">
                    <label className="label">You</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="arena__quick-log-input"
                      value={playerScore}
                      onChange={(e) => setPlayerScore(e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <span className="arena__quick-log-vs">vs</span>
                  <div className="arena__quick-log-field arena__quick-log-field--score">
                    <label className="label">
                      {opponent?.display_name || "Opponent"}
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="arena__quick-log-input"
                      value={opponentScore}
                      onChange={(e) => setOpponentScore(e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                {eloPrediction && (
                  <div className="arena__quick-log-prediction">
                    <span
                      className={
                        eloPrediction.playerDelta > 0
                          ? "text-positive"
                          : "text-negative"
                      }
                    >
                      {formatEloDelta(eloPrediction.playerDelta)}
                    </span>
                    <span className="text-faint">→</span>
                    <span className="data">{eloPrediction.playerNewELO}</span>
                  </div>
                )}

                {submitError && (
                  <div className="arena__quick-log-error">{submitError}</div>
                )}

                <button
                  className="arena__quick-log-submit"
                  onClick={handleQuickLog}
                  disabled={!opponent || !playerScore || !opponentScore || submitting}
                >
                  {submitting ? "Submitting…" : "Submit Match"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="arena__search">
        <input
          type="text"
          className="arena__search-input"
          placeholder="Search players…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="arena__search-clear"
            onClick={() => setSearchQuery("")}
          >
            ×
          </button>
        )}
      </div>

      {/* Rankings table */}
      <div className="arena__table-wrap">
        <table className="arena__table">
          <thead>
            <tr>
              <th
                className="arena__th arena__th--rank"
                onClick={() => handleSort("rank")}
              >
                <span>#</span>
                <SortIcon field="rank" />
              </th>
              <th className="arena__th arena__th--player">Player</th>
              <th
                className="arena__th arena__th--elo"
                onClick={() => handleSort("elo")}
              >
                <span>ELO</span>
                <SortIcon field="elo" />
              </th>
              <th
                className="arena__th arena__th--num"
                onClick={() => handleSort("matches")}
              >
                <span>Games</span>
                <SortIcon field="matches" />
              </th>
              <th
                className="arena__th arena__th--num arena__th--hide-mobile"
                onClick={() => handleSort("wins")}
              >
                <span>W/L</span>
                <SortIcon field="wins" />
              </th>
              <th
                className="arena__th arena__th--num"
                onClick={() => handleSort("winrate")}
              >
                <span>Win%</span>
                <SortIcon field="winrate" />
              </th>
              {user && <th className="arena__th arena__th--action"></th>}
            </tr>
          </thead>
          <tbody>
            {filteredLeaderboard.map((entry) => (
              <tr
                key={entry.user.id}
                className={`arena__row ${user?.id === entry.user.id ? "arena__row--you" : ""}`}
                onClick={() => openPlayer(entry.user.id)}
              >
                <td className="arena__td arena__td--rank">
                  <span
                    className={`arena__rank ${entry.rank <= 3 ? `arena__rank--${entry.rank}` : ""}`}
                  >
                    {entry.rank}
                  </span>
                </td>
                <td className="arena__td arena__td--player">
                  <img
                    src={entry.user.avatar_url}
                    alt=""
                    className="arena__avatar"
                    loading="lazy"
                  />
                  <div className="arena__player-info">
                    <span className="arena__player-name">
                      {entry.user.display_name}
                    </span>
                    <span className="arena__player-login">
                      @{entry.user.login}
                    </span>
                  </div>
                </td>
                <td className="arena__td arena__td--elo data">
                  {entry.elo}
                </td>
                <td className="arena__td arena__td--num data">
                  {entry.matches_played}
                </td>
                <td className="arena__td arena__td--num arena__td--hide-mobile data">
                  <span className="text-positive">{entry.wins}</span>
                  <span className="arena__wl-sep">/</span>
                  <span className="text-negative">{entry.losses}</span>
                </td>
                <td className="arena__td arena__td--num data">
                  {entry.win_rate.toFixed(0)}%
                </td>
                {user && (
                  <td className="arena__td arena__td--action">
                    {user.id !== entry.user.id && (
                      <button
                        className="arena__log-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowQuickLog(entry);
                        }}
                        title={`Log match vs ${entry.user.display_name}`}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLeaderboard.length === 0 && debouncedSearchQuery && (
          <div className="arena__empty">
            No players found matching "{debouncedSearchQuery}"
          </div>
        )}

        {leaderboard.length === 0 && !debouncedSearchQuery && (
          <div className="arena__empty">
            No matches yet. Be the first to log a match.
          </div>
        )}
      </div>

      {/* Player panel */}
      {panelPlayerId && (
        <PlayerPanel
          playerId={panelPlayerId}
          sport={sport}
          onClose={closePanel}
          currentUser={user}
        />
      )}
    </div>
  );
}
