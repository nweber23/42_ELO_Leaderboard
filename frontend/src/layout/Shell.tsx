import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState, useCallback, useEffect, createContext, useContext } from "react";
import type { User } from "../types";
import { ThemeToggle } from "../components/ThemeToggle";
import { getSports, type SportConfig } from "../config/sports";
import "./shell.css";

// Panel context for triggering player panel from anywhere
interface PanelContextType {
  openPlayer: (id: number) => void;
  closePanel: () => void;
}

const PanelContext = createContext<PanelContextType>({
  openPlayer: () => {},
  closePanel: () => {},
});

export const usePanel = () => useContext(PanelContext);

interface ShellProps {
  user: User | null;
  onLogout: () => void;
}

export function Shell({ user, onLogout }: ShellProps) {
  const location = useLocation();
  const [panelPlayerId, setPanelPlayerId] = useState<number | null>(null);
  const [sports, setSports] = useState<SportConfig[]>([]);

  const openPlayer = useCallback((id: number) => {
    setPanelPlayerId(id);
  }, []);

  const closePanel = useCallback(() => {
    setPanelPlayerId(null);
  }, []);

  // Load sports configuration
  useEffect(() => {
    getSports().then(setSports);
  }, []);

  // Determine current sport from URL
  const currentSport = sports.find(s => location.pathname.includes(s.id))?.id
    || sports[0]?.id
    || "table_tennis";

  const isArena =
    location.pathname.startsWith("/leaderboard") ||
    location.pathname === "/" ||
    location.pathname.startsWith("/arena");

  const isPersonal =
    location.pathname.startsWith("/me") ||
    location.pathname.startsWith("/matches") ||
    location.pathname.startsWith("/settings");

  const isAdmin = location.pathname.startsWith("/admin");

  // Count pending matches for badge (would come from API in real implementation)
  const pendingCount = 0; // Placeholder

  return (
    <PanelContext.Provider value={{ openPlayer, closePanel }}>
      <div className="shell" data-sport={currentSport}>
        {/* Top Bar - Minimal, contextual */}
        <header className="shell__header">
          <div className="shell__header-inner">
            {/* Left: Context indicator */}
            <div className="shell__context">
              {isArena && (
                <div className="shell__sport-switch">
                  {sports.map(sport => (
                    <NavLink
                      key={sport.id}
                      to={`/leaderboard/${sport.id}`}
                      className={`shell__sport ${currentSport === sport.id ? "shell__sport--active" : ""}`}
                      data-sport={sport.id.substring(0, 2)}
                    >
                      <span className="shell__sport-label">{sport.display_name}</span>
                      <span className="shell__sport-abbr">
                        {sport.display_name.split(' ').map(w => w[0]).join('').toUpperCase()}
                      </span>
                    </NavLink>
                  ))}
                </div>
              )}
              {isPersonal && (
                <div className="shell__section-title">Your Activity</div>
              )}
              {isAdmin && (
                <div className="shell__section-title">Administration</div>
              )}
            </div>

            {/* Center: Brand (hidden on mobile) */}
            <NavLink to="/" className="shell__brand">
              <span className="shell__brand-mark">42</span>
              <span className="shell__brand-text">ELO</span>
            </NavLink>

            {/* Right: User actions */}
            <div className="shell__actions">
              <ThemeToggle />

              {user ? (
                <>
                  {/* Personal area link */}
                  <NavLink
                    to="/matches"
                    className={`shell__action shell__action--personal ${isPersonal ? "shell__action--active" : ""}`}
                    title="Your activity"
                  >
                    <span className="shell__action-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    {pendingCount > 0 && (
                      <span className="shell__badge">{pendingCount}</span>
                    )}
                  </NavLink>

                  {/* Admin link */}
                  {user.is_admin && (
                    <NavLink
                      to="/admin"
                      className={`shell__action ${isAdmin ? "shell__action--active" : ""}`}
                      title="Admin"
                    >
                      <span className="shell__action-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                        </svg>
                      </span>
                    </NavLink>
                  )}

                  {/* User chip */}
                  <button
                    className="shell__user"
                    onClick={() => openPlayer(user.id)}
                  >
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="shell__user-avatar"
                    />
                  </button>

                  {/* Logout */}
                  <button
                    onClick={onLogout}
                    className="shell__action shell__action--logout"
                    title="Logout"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </button>
                </>
              ) : (
                <NavLink to="/login" className="shell__login">
                  Sign in
                </NavLink>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="shell__main">
          <Outlet context={{ user, openPlayer, panelPlayerId, closePanel }} />
        </main>

        {/* Mobile bottom nav - Only for logged in users */}
        {user && (
          <nav className="shell__mobile-nav">
            <NavLink
              to={`/leaderboard/${currentSport}`}
              className={`shell__nav-item ${isArena ? "shell__nav-item--active" : ""}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 21h8m-4-4v4m-4.5-8h9a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 0 0 7Z" />
              </svg>
              <span>Arena</span>
            </NavLink>
            <NavLink
              to="/matches"
              className={`shell__nav-item ${isPersonal ? "shell__nav-item--active" : ""}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Activity</span>
              {pendingCount > 0 && (
                <span className="shell__nav-badge">{pendingCount}</span>
              )}
            </NavLink>
          </nav>
        )}

        {/* Footer - Desktop only */}
        <footer className="shell__footer">
          <div className="shell__footer-inner">
            <div className="shell__footer-links">
              <NavLink to="/impressum">Imprint</NavLink>
              <NavLink to="/privacy">Privacy</NavLink>
              <NavLink to="/terms">Terms</NavLink>
            </div>
            <span className="shell__footer-credit">
              Built by{" "}
              <a
                href="https://profile.intra.42.fr/users/nweber"
                target="_blank"
                rel="noreferrer"
              >
                @nweber
              </a>
            </span>
          </div>
        </footer>
      </div>
    </PanelContext.Provider>
  );
}
