import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useMemo } from "react";
import type { User } from "../types";
import "./app-shell.css";
import { Button } from "../ui/Button";
import { ThemeToggle } from "../components/ThemeToggle";

// Icons for mobile navigation
const icons = {
  leaderboard: "🏆",
  matches: "📋",
  submit: "➕",
  admin: "⚙️",
  profile: "👤",
  settings: "🔧",
};

export function AppShell({
  user,
  onLogout,
}: {
  user: User | null;
  onLogout: () => void;
}) {
  const location = useLocation();
  const nav = useMemo(
    () => {
      const items = [
        { name: "Leaderboard", to: "/leaderboard/table_tennis", matchPath: "/leaderboard", icon: icons.leaderboard },
        { name: "Matches", to: "/matches", icon: icons.matches },
        { name: "Submit", to: "/submit", icon: icons.submit },
      ];
      // Add admin link for admin users
      if (user?.is_admin) {
        items.push({ name: "Admin", to: "/admin", icon: icons.admin });
      }
      return items;
    },
    [user]
  );

  const renderNavLinks = (isMobile: boolean) => (
    <>
      {nav.map((item) => {
        const isActive = item.matchPath
          ? location.pathname.startsWith(item.matchPath)
          : location.pathname === item.to || location.pathname.startsWith(item.to + '/');
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={isActive ? "nav__link nav__link--active" : "nav__link"}
          >
            {isMobile && <span className="nav__icon">{item.icon}</span>}
            <span className="nav__label">{item.name}</span>
          </NavLink>
        );
      })}
    </>
  );

  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar__inner">
          <NavLink to="/" className="brand">
            <div className="brand__text">
              <div className="brand__name">ELO Leaderboard</div>
              <div className="brand__tag">Table Tennis · Table Football</div>
            </div>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="nav--desktop" aria-label="Primary">
            {renderNavLinks(false)}
          </nav>

          <div className="topbar__right">
            <ThemeToggle />
            {user ? (
              <>
                <NavLink to={`/players/${user.id}`} className="userchip">
                  <img className="userchip__avatar" src={user.avatar_url} alt={user.display_name} />
                  <div className="userchip__meta">
                    <div className="userchip__name">{user.display_name}</div>
                    <div className="userchip__sub">TT {user.table_tennis_elo} · TF {user.table_football_elo}</div>
                  </div>
                </NavLink>
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <NavLink to="/login" className="nav__cta">
                Sign in
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container main__inner">
          <Outlet />
        </div>
        {/* Mobile Legal Links - GDPR compliance requires these to be accessible */}
        <div className="footer__legal--mobile" aria-label="Legal links">
          <NavLink to="/impressum">Impressum</NavLink>
          <NavLink to="/privacy">Datenschutz</NavLink>
          <NavLink to="/terms">AGB</NavLink>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="nav--mobile" aria-label="Primary mobile navigation">
        {renderNavLinks(true)}
        {user && (
          <>
            <NavLink
              to={`/players/${user.id}`}
              className={location.pathname.startsWith('/players/') ? "nav__link nav__link--active" : "nav__link"}
            >
              <span className="nav__icon">{icons.profile}</span>
              <span className="nav__label">Profile</span>
            </NavLink>
            <NavLink
              to="/settings"
              className={location.pathname === '/settings' ? "nav__link nav__link--active" : "nav__link"}
            >
              <span className="nav__icon">{icons.settings}</span>
              <span className="nav__label">Settings</span>
            </NavLink>
            <button
              onClick={onLogout}
              className="nav__link nav__link--logout"
            >
              <span className="nav__icon">🚪</span>
              <span className="nav__label">Logout</span>
            </button>
          </>
        )}
        {!user && (
          <NavLink
            to="/login"
            className="nav__link"
          >
            <span className="nav__icon">🔑</span>
            <span className="nav__label">Sign in</span>
          </NavLink>
        )}
      </nav>

      <footer className="footer">
        <div className="container footer__inner">
          <span>
            Built by
            <a
              href="https://profile.intra.42.fr/users/nweber"
              target="_blank"
              rel="noreferrer noopener"
              className="footer__link"
            >
              @nweber
            </a>
          </span>
          <nav className="footer__legal" aria-label="Legal links">
            <NavLink to="/impressum" className="footer__link">Impressum</NavLink>
            <NavLink to="/privacy" className="footer__link">Datenschutz</NavLink>
            <NavLink to="/terms" className="footer__link">Nutzungsbedingungen</NavLink>
          </nav>
          <span className="faint">Fast · Clean · Fair</span>
        </div>
      </footer>
    </div>
  );
}
