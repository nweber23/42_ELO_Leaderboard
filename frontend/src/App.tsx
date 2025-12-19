import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authAPI } from './api/client';
import type { User } from './types';
import Login from './pages/Login';
import Leaderboard from './pages/Leaderboard';
import Matches from './pages/Matches';
import SubmitMatch from './pages/SubmitMatch';
import './App.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle OAuth callback token from URL
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    const error = params.get('error');

    if (error) {
      alert('Login failed: ' + error);
      window.history.replaceState({}, '', '/');
      setLoading(false);
      return;
    }

    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      window.history.replaceState({}, '', '/');
    }

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.me()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-content">
            <Link to="/" className="nav-logo">🏓 42 ELO Leaderboard</Link>
            <div className="nav-links">
              <Link to="/leaderboard/table_tennis">Table Tennis</Link>
              <Link to="/leaderboard/table_football">Table Football</Link>
              {user ? (
                <>
                  <Link to="/matches">Matches</Link>
                  <Link to="/submit">Submit Match</Link>
                  <span className="user-info">
                    {user.display_name} ({user.table_tennis_elo} / {user.table_football_elo})
                  </span>
                  <button onClick={handleLogout}>Logout</button>
                </>
              ) : (
                <Link to="/login" className="login-link">Login with 42</Link>
              )}
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Leaderboard sport="table_tennis" />} />
            <Route path="/leaderboard/:sport" element={<Leaderboard />} />
            <Route path="/matches" element={user ? <Matches user={user} /> : <Login onLogin={setUser} />} />
            <Route path="/submit" element={user ? <SubmitMatch user={user} /> : <Login onLogin={setUser} />} />
            <Route path="/login" element={<Login onLogin={setUser} />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>Built with ❤️ for 42 Heilbronn</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
