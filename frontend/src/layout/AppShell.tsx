import { NavLink, Outlet } from "react-router-dom";
import { useMemo } from "react";
import type { User } from "../types";
import "./app-shell.css";
import { Button } from "../ui/Button";

export function AppShell({
  user,
  onLogout,
}: {
  user: User | null;
  onLogout: () => void;
}) {
  const nav = useMemo(
    () => [
      { name: "Leaderboards", to: "/leaderboard/table_tennis" },
      { name: "Match history", to: "/matches" },
      { name: "Submit match", to: "/submit" },
    ],
    []
  );

  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar__inner">
          <div className="brand">
            <div className="brand__mark" aria-hidden>
              42
            </div>
            <div className="brand__text">
              <div className="brand__name">ELO Leaderboard</div>
              <div className="brand__tag muted">Table Tennis · Table Football</div>
            </div>
          </div>

          <nav className="nav" aria-label="Primary">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "nav__link nav__link--active" : "nav__link")}
              >
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="topbar__right">
            {user ? (
              <>
                <NavLink to={`/players/${user.id}`} className="userchip">
                  <img className="userchip__avatar" src={user.avatar_url} alt={user.display_name} />
                  <div className="userchip__meta">
                    <div className="userchip__name">{user.display_name}</div>
                    <div className="userchip__sub muted">TT {user.table_tennis_elo} · TF {user.table_football_elo}</div>
                  </div>
                </NavLink>
                <Button variant="ghost" onClick={onLogout} aria-label="Logout">
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
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <span className="muted">
            Built by{""}
            <a
              href="https://profile.intra.42.fr/users/nweber"
              target="_blank"
              rel="noreferrer noopener"
              className="footer__link"
              aria-label="Open @nweber 42 Intra profile"
            >
              @nweber
            </a>
            .
          </span>
          <span className="faint">Fast · Clean · Fair</span>
        </div>
      </footer>
    </div>
  );
}
