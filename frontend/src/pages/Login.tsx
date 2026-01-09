import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api/client';
import type { User } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';

import '../styles/login.css';

// Generate a cryptographically random state for CSRF protection
function generateOAuthState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Store state in sessionStorage (cleared on tab close)
const OAUTH_STATE_KEY = 'oauth_state';

interface LoginProps {
  onLogin: (user: User) => void;
}

function Login({ onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');
    const returnedState = params.get('state');

    // Clear URL immediately to minimize token exposure
    if (token || error || returnedState) {
      window.history.replaceState({}, '', '/login');
    }

    if (error) {
      setErrorMsg('Login failed. Please try again.');
      setToastOpen(true);
      sessionStorage.removeItem(OAUTH_STATE_KEY);
      return;
    }

    // Validate state parameter to prevent CSRF attacks
    const storedState = sessionStorage.getItem(OAUTH_STATE_KEY);
    if (token || returnedState) {
      if (!storedState || storedState !== returnedState) {
        console.error('OAuth state mismatch - possible CSRF attack');
        setErrorMsg('Login failed. Security validation failed.');
        setToastOpen(true);
        sessionStorage.removeItem(OAUTH_STATE_KEY);
        return;
      }
      // Clear state after successful validation
      sessionStorage.removeItem(OAUTH_STATE_KEY);
    }

    if (token) {
      localStorage.setItem('token', token);
      authAPI.me()
        .then((user) => {
          onLogin(user);
          window.history.replaceState({}, '', '/');
        })
        .catch((err) => {
          console.error('Failed to get user info:', err);
          localStorage.removeItem('token');
          setErrorMsg('Login failed. Please try again.');
          setToastOpen(true);
        });
    }
  }, [onLogin]);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      // Generate and store state for CSRF protection
      const state = generateOAuthState();
      sessionStorage.setItem(OAUTH_STATE_KEY, state);

      const { auth_url } = await authAPI.getLoginURL(state);
      window.location.href = auth_url;
    } catch (err) {
      console.error('Failed to get login URL:', err);
      sessionStorage.removeItem(OAUTH_STATE_KEY);
      setErrorMsg('Could not start login. Please check the backend and try again.');
      setToastOpen(true);
      setIsLoading(false);
    }
  };

  const heroLines = useMemo(
    () => [
      'Track rankings for Table Tennis and Table Football.',
      'Submit matches in seconds. Confirm results with one click.',
      'React and comment on confirmed matches.',
    ],
    []
  );

  return (
    <div className="login">
      <div className="container login__grid">
        <section className="login__hero">
          <div className="login__badge">42 · Heilbronn</div>
          <h1 className="login__title">A clean ELO workspace for daily play.</h1>
          <p className="login__subtitle">
            A focused leaderboard for the campus. Fast flows, clear stats, and match history you can trust.
          </p>
          <ul className="login__bullets">
            {heroLines.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <div className="login__hint">
            Sign-in is handled via 42 Intra OAuth. Only Heilbronn campus users can access.
          </div>
        </section>

        <aside className="login__panel">
          <Card>
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>Continue with your 42 account to view rankings and submit matches.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleLogin} isLoading={isLoading} size="lg" style={{ width: '100%' }}>
                Continue with 42 Intra
              </Button>

              <div className="login__smallprint">
                By signing in, you consent to the storage and processing of your public 42 profile data
                for leaderboard and match history purposes in accordance with our{' '}
                <Link to="/privacy" className="login__link">Privacy Policy</Link>.
              </div>
            </CardContent>
          </Card>

          <footer className="login-footer">
            <nav className="login-footer__nav">
              <Link to="/privacy">Privacy</Link>
              <span>·</span>
              <Link to="/terms">Terms</Link>
              <span>·</span>
              <Link to="/impressum">Imprint</Link>
            </nav>
            <p className="login-footer__copy">
              &copy; 2026 ELO Leaderboard. Not affiliated with 42.
            </p>
          </footer>
        </aside>
      </div>

      <Toast
        open={toastOpen}
        tone="error"
        title="Sign-in failed"
        message={errorMsg ?? undefined}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}

export default Login;
