import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { authAPI } from './api/client';
import type { User } from './types';
import { Shell } from './layout/Shell';
import { Spinner } from './ui';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CookieConsentBanner } from './components/CookieConsent';
import { getDefaultSportId, preloadSports } from './config/sports';

// Lazy load pages for code splitting
const Login = lazy(() => import('./pages/Login'));
const Arena = lazy(() => import('./pages/Arena'));
const Activity = lazy(() => import('./pages/Activity'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));

// Legal pages (GDPR / DSGVO compliance)
const Impressum = lazy(() => import('./pages/Impressum'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));

// Legacy redirects - keep old routes working
const PlayerProfileRedirect = lazy(() => import('./pages/PlayerProfileRedirect'));

// Extract and clear sensitive params from URL immediately
function extractAndClearUrlParams(): { token: string | null; error: string | null } {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const error = params.get('error');

  if (token || error) {
    window.history.replaceState({}, '', window.location.pathname);
  }

  return { token, error };
}

const initialUrlParams = extractAndClearUrlParams();

// Default redirect component that uses dynamic sport configuration
function DefaultRedirect() {
  const [defaultSport, setDefaultSport] = useState<string | null>(null);

  useEffect(() => {
    getDefaultSportId().then(setDefaultSport);
  }, []);

  if (!defaultSport) {
    return <Spinner />;
  }

  return <Navigate to={`/leaderboard/${defaultSport}`} replace />;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { token: tokenFromUrl, error } = initialUrlParams;

    if (error) {
      alert('Login failed: ' + error);
      setLoading(false);
      return;
    }

    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
    }

    // Preload sports configuration and fetch user in parallel
    Promise.all([
      preloadSports(),
      authAPI.me()
        .then(setUser)
        .catch(() => {
          // Only remove token if we had one and auth failed
          localStorage.removeItem('token');
        })
    ]).finally(() => setLoading(false));
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
            {/* Main app routes */}
            <Route element={<Shell user={user} onLogout={handleLogout} />}>
              {/* Arena (Leaderboard) - Default route redirects to first active sport */}
              <Route index element={<DefaultRedirect />} />
              <Route path="/leaderboard/:sport" element={<Arena />} />

              {/* Activity (Personal) */}
              <Route path="/matches" element={user ? <Activity /> : <Navigate to="/login" replace />} />

              {/* Settings */}
              <Route path="/settings" element={user ? <Settings user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />

              {/* Admin */}
              <Route path="/admin" element={user?.is_admin ? <Admin user={user} /> : <Navigate to="/" replace />} />

              {/* Legacy routes - redirect to new structure */}
              <Route path="/players/:id" element={<PlayerProfileRedirect />} />
              <Route path="/submit" element={<Navigate to="/leaderboard/table_tennis" replace />} />

              {/* Legal pages (GDPR / DSGVO compliance) */}
              <Route path="/impressum" element={<Impressum />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/imprint" element={<Navigate to="/impressum" replace />} />
            </Route>

            {/* Login - separate route without shell */}
            <Route path="/login" element={<Login onLogin={setUser} />} />
          </Routes>
        </Suspense>
        <CookieConsentBanner />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
