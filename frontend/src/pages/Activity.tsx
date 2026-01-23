import { useState, useEffect, useMemo } from "react";
import { NavLink, useOutletContext, useNavigate } from "react-router-dom";
import { matchAPI, usersAPI } from "../api/client";
import type { Match, User } from "../types";
import { getSports, getSportLabel, type SportConfig } from "../config/sports";
import "./activity.css";

interface OutletContext {
  user: User | null;
  openPlayer: (id: number) => void;
}

export default function Activity() {
  const { user, openPlayer } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<Map<number, User>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed">("all");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [sports, setSports] = useState<SportConfig[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Load sports configuration
  useEffect(() => {
    getSports().then(setSports);
  }, []);

  // Fetch matches and users
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    Promise.all([
      matchAPI.list(),
      usersAPI.getAll(),
    ])
      .then(([matchData, userData]) => {
        // Filter to only matches involving the user
        const userMatches = matchData.filter(
          (m: Match) =>
            m.player1_id === user.id || m.player2_id === user.id
        );
        setMatches(userMatches);

        // Create user map for quick lookup
        const userMap = new Map<number, User>();
        userData.forEach((u: User) => userMap.set(u.id, u));
        setUsers(userMap);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  // Separate pending matches that need user action
  const pendingAction = useMemo(() => {
    if (!user) return [];
    return matches.filter(
      (m) =>
        m.status === "pending" &&
        m.submitted_by !== user.id &&
        (m.player1_id === user.id || m.player2_id === user.id)
    );
  }, [matches, user]);

  // All filtered matches
  const filteredMatches = useMemo(() => {
    let result = matches;

    if (filter !== "all") {
      result = result.filter((m) => m.status === filter);
    }

    if (sportFilter !== "all") {
      result = result.filter((m) => m.sport === sportFilter);
    }

    return result.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [matches, filter, sportFilter]);

  // Handle confirm/deny
  const handleConfirm = async (matchId: number) => {
    setActionLoading(matchId);
    try {
      await matchAPI.confirm(matchId);
      // Refresh matches
      const updated = await matchAPI.list();
      const userMatches = updated.filter(
        (m: Match) => m.player1_id === user?.id || m.player2_id === user?.id
      );
      setMatches(userMatches);
    } catch (err) {
      console.error("Failed to confirm match:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (matchId: number) => {
    setActionLoading(matchId);
    try {
      await matchAPI.deny(matchId);
      const updated = await matchAPI.list();
      const userMatches = updated.filter(
        (m: Match) => m.player1_id === user?.id || m.player2_id === user?.id
      );
      setMatches(userMatches);
    } catch (err) {
      console.error("Failed to deny match:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (matchId: number) => {
    setActionLoading(matchId);
    try {
      await matchAPI.cancel(matchId);
      const updated = await matchAPI.list();
      const userMatches = updated.filter(
        (m: Match) => m.player1_id === user?.id || m.player2_id === user?.id
      );
      setMatches(userMatches);
    } catch (err) {
      console.error("Failed to cancel match:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const getOpponent = (match: Match): User | undefined => {
    if (!user) return undefined;
    const opponentId =
      match.player1_id === user.id ? match.player2_id : match.player1_id;
    return users.get(opponentId);
  };

  const getMatchInfo = (match: Match) => {
    if (!user) return { won: false, myScore: 0, theirScore: 0, eloDelta: 0 };

    const isPlayer1 = match.player1_id === user.id;
    const won = match.winner_id === user.id;
    const myScore = isPlayer1 ? match.player1_score : match.player2_score;
    const theirScore = isPlayer1 ? match.player2_score : match.player1_score;
    const eloDelta = isPlayer1
      ? match.player1_elo_delta
      : match.player2_elo_delta;

    return { won, myScore, theirScore, eloDelta };
  };

  if (!user) return null;

  return (
    <div className="activity">
      <div className="activity__container">
        {/* Header with stats */}
        <div className="activity__header">
          <div className="activity__user">
            <img
              src={user.avatar_url}
              alt=""
              className="activity__avatar"
              onClick={() => openPlayer(user.id)}
            />
            <div className="activity__user-info">
              <h1 className="activity__name">{user.display_name}</h1>
              <div className="activity__elo">
                <span className="activity__elo-item" data-sport="tt">
                  <span className="label">TT</span>
                  <span className="data">{user.table_tennis_elo}</span>
                </span>
                <span className="activity__elo-sep">·</span>
                <span className="activity__elo-item" data-sport="tf">
                  <span className="label">TF</span>
                  <span className="data">{user.table_football_elo}</span>
                </span>
              </div>
            </div>
          </div>
          <NavLink to="/settings" className="activity__settings">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </NavLink>
        </div>

        {/* Pending confirmations */}
        {pendingAction.length > 0 && (
          <div className="activity__pending">
            <h2 className="activity__section-title">
              <span className="activity__pending-badge">{pendingAction.length}</span>
              Pending Confirmations
            </h2>
            <div className="activity__pending-list">
              {pendingAction.map((match) => {
                const opponent = getOpponent(match);
                const { myScore, theirScore } = getMatchInfo(match);
                const isLoading = actionLoading === match.id;

                return (
                  <div key={match.id} className="activity__pending-item">
                    <div className="activity__pending-info">
                      <span
                        className="activity__pending-sport"
                        data-sport={match.sport.substring(0, 2)}
                      >
                        {getSportLabel(match.sport).split(' ').map(w => w[0]).join('').toUpperCase()}
                      </span>
                      <span
                        className="activity__pending-opponent"
                        onClick={() => opponent && openPlayer(opponent.id)}
                      >
                        {opponent?.display_name || "Unknown"}
                      </span>
                      <span className="activity__pending-score data">
                        {theirScore}–{myScore}
                      </span>
                    </div>
                    <div className="activity__pending-actions">
                      <button
                        className="activity__action activity__action--confirm"
                        onClick={() => handleConfirm(match.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? "…" : "Confirm"}
                      </button>
                      <button
                        className="activity__action activity__action--deny"
                        onClick={() => handleDeny(match.id)}
                        disabled={isLoading}
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="activity__filters">
          <div className="activity__filter-group">
            <button
              className={`activity__filter ${filter === "all" ? "activity__filter--active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              className={`activity__filter ${filter === "pending" ? "activity__filter--active" : ""}`}
              onClick={() => setFilter("pending")}
            >
              Pending
            </button>
            <button
              className={`activity__filter ${filter === "confirmed" ? "activity__filter--active" : ""}`}
              onClick={() => setFilter("confirmed")}
            >
              Confirmed
            </button>
          </div>
          <div className="activity__filter-group">
            <button
              className={`activity__filter ${sportFilter === "all" ? "activity__filter--active" : ""}`}
              onClick={() => setSportFilter("all")}
            >
              All
            </button>
            {sports.map(sport => (
              <button
                key={sport.id}
                className={`activity__filter ${sportFilter === sport.id ? "activity__filter--active" : ""}`}
                onClick={() => setSportFilter(sport.id)}
                data-sport={sport.id.substring(0, 2)}
              >
                {sport.display_name.split(' ').map(w => w[0]).join('').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Match list */}
        {loading ? (
          <div className="activity__loading">Loading matches…</div>
        ) : (
          <div className="activity__matches">
            {filteredMatches.map((match) => {
              const opponent = getOpponent(match);
              const { won, myScore, theirScore, eloDelta } = getMatchInfo(match);
              const isMySubmission = match.submitted_by === user.id;
              const isPending = match.status === "pending";
              const isLoading = actionLoading === match.id;

              return (
                <div
                  key={match.id}
                  className={`activity__match ${match.status === "confirmed" ? (won ? "activity__match--win" : "activity__match--loss") : ""} ${match.status === "pending" ? "activity__match--pending" : ""} ${match.status === "denied" ? "activity__match--denied" : ""}`}
                >
                  <div className="activity__match-left">
                    <span
                      className="activity__match-sport"
                      data-sport={match.sport.substring(0, 2)}
                    >
                      {getSportLabel(match.sport).split(' ').map(w => w[0]).join('').toUpperCase()}
                    </span>
                    <span
                      className="activity__match-opponent"
                      onClick={() => opponent && openPlayer(opponent.id)}
                    >
                      {opponent?.display_name || "Unknown"}
                    </span>
                  </div>

                  <div className="activity__match-center">
                    <span className="activity__match-score data">
                      {myScore}–{theirScore}
                    </span>
                    {match.status === "confirmed" && eloDelta !== undefined && (
                      <span
                        className={`activity__match-elo data ${eloDelta > 0 ? "text-positive" : "text-negative"}`}
                      >
                        {eloDelta > 0 ? "+" : ""}
                        {eloDelta}
                      </span>
                    )}
                    {match.status === "pending" && (
                      <span className="activity__match-status">
                        {isMySubmission ? "Awaiting" : "Confirm?"}
                      </span>
                    )}
                    {match.status === "denied" && (
                      <span className="activity__match-status activity__match-status--denied">
                        Denied
                      </span>
                    )}
                  </div>

                  <div className="activity__match-right">
                    {isPending && isMySubmission && (
                      <button
                        className="activity__match-cancel"
                        onClick={() => handleCancel(match.id)}
                        disabled={isLoading}
                        title="Cancel this match"
                      >
                        ×
                      </button>
                    )}
                    <span className="activity__match-date">
                      {new Date(match.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredMatches.length === 0 && (
              <div className="activity__empty">
                No matches found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
