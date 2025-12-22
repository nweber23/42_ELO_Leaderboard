import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authAPI } from './api/client';
import type { User } from './types';
import Login from './pages/Login';
import Leaderboard from './pages/Leaderboard';
import Matches from './pages/Matches';
import SubmitMatch from './pages/SubmitMatch';
import PlayerProfile from './pages/PlayerProfile';
import { AppShell } from './layout/AppShell';

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

  if (loading) return <div className="container" style={{ padding: '64px 0' }}>Loading…</div>;

  return (
    <Router>
      <Routes>
        <Route element={<AppShell user={user} onLogout={handleLogout} />}>
          <Route index element={<Navigate to="/leaderboard/table_tennis" replace />} />
          <Route path="/leaderboard/:sport" element={<Leaderboard />} />
          <Route path="/players/:id" element={<PlayerProfile />} />
          <Route path="/matches" element={user ? <Matches user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/submit" element={user ? <SubmitMatch user={user} /> : <Navigate to="/login" replace />} />
        </Route>
        <Route path="/login" element={<Login onLogin={setUser} />} />
      </Routes>
    </Router>
  );
}

export default App;
