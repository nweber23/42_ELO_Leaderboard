import { useEffect } from 'react';
import { authAPI } from '../api/client';
import type { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

function Login({ onLogin }: LoginProps) {
  useEffect(() => {
    // Handle OAuth callback with token from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      alert('Login failed: ' + error);
      window.history.replaceState({}, '', '/login');
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
      // Fetch user info with the token
      authAPI.me()
        .then((user) => {
          onLogin(user);
          window.history.replaceState({}, '', '/');
        })
        .catch((err) => {
          console.error('Failed to get user info:', err);
          localStorage.removeItem('token');
          alert('Login failed. Please try again.');
        });
    }
  }, [onLogin]);

  const handleLogin = async () => {
    try {
      const { auth_url } = await authAPI.getLoginURL();
      window.location.href = auth_url;
    } catch (err) {
      console.error('Failed to get login URL:', err);
    }
  };

  return (
    <div className="login-page">
      <h1>🏓 42 Heilbronn ELO Leaderboard</h1>
      <p>Track your Table Tennis and Table Football rankings!</p>
      <button onClick={handleLogin} className="login-button">
        Login with 42 Intra
      </button>
      <p className="info">Only Heilbronn campus students can access</p>
    </div>
  );
}

export default Login;
