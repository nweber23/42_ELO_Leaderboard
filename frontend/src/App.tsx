import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { authAPI } from './api/client';
import type { User } from './types';
import { AppShell } from './layout/AppShell';
import { Spinner } from './ui';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CookieConsentBanner } from './components/CookieConsent';

// Lazy load pages for code splitting
const Login = lazy(() => import('./pages/Login'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Matches = lazy(() => import('./pages/Matches'));
const SubmitMatch = lazy(() => import('./pages/SubmitMatch'));
const PlayerProfile = lazy(() => import('./pages/PlayerProfile'));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));

// Legal pages (GDPR / DSGVO compliance)
const Impressum = lazy(() => import('./pages/Impressum'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Settings = lazy(() => import('./pages/Settings'));

// SECURITY: Extract and clear sensitive params from URL immediately, before any rendering
// This minimizes the time the token is visible in the browser's URL bar
function extractAndClearUrlParams(): { token: string | null; error: string | null; authSuccess: boolean } {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const error = params.get('error');
  const authSuccess = params.get('auth') === 'success';

  // Clear sensitive params immediately
  if (token || error || authSuccess) {
    window.history.replaceState({}, '', window.location.pathname);
  }

  return { token, error, authSuccess };
}

// Extract params synchronously before component renders
const initialUrlParams = extractAndClearUrlParams();

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { token: tokenFromUrl, error, authSuccess } = initialUrlParams;

    if (error) {
      alert('Login failed: ' + error);
      setLoading(false);
      return;
    }

    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
    }

    const token = localStorage.getItem('token');
    if (token || authSuccess) {
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

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  if (loading) return <Spinner />;

  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route element={<AppShell user={user} onLogout={handleLogout} />}>
              <Route index element={<Navigate to="/leaderboard/table_tennis" replace />} />
              <Route path="/leaderboard/:sport" element={<Leaderboard user={user} />} />
              <Route path="/players/:id" element={<PlayerProfile user={user} />} />
              <Route path="/matches" element={user ? <Matches user={user} /> : <Navigate to="/login" replace />} />
              <Route path="/submit" element={user ? <SubmitMatch user={user} /> : <Navigate to="/login" replace />} />
              <Route path="/admin" element={user ? <Admin user={user} /> : <Navigate to="/login" replace />} />
              <Route path="/settings" element={user ? <Settings user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
              {/* Legal pages (GDPR / DSGVO compliance) */}
              <Route path="/impressum" element={<Impressum />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
            </Route>
            <Route path="/login" element={<Login onLogin={setUser} />} />
          </Routes>
        </Suspense>
        {/* Cookie consent banner - GDPR requirement */}
        <CookieConsentBanner />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
