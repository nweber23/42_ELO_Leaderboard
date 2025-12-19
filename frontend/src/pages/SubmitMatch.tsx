import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchAPI, usersAPI } from '../api/client';
import type { User } from '../types';
import { SPORTS, SPORT_LABELS } from '../types';

interface SubmitMatchProps {
  user: User;
}

function SubmitMatch({ user }: SubmitMatchProps) {
  const navigate = useNavigate();
  const [sport, setSport] = useState<'table_tennis' | 'table_football'>('table_tennis');
  const [opponentId, setOpponentId] = useState<number>(0);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [players, setPlayers] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Load all users
    usersAPI.getAll()
      .then(users => {
        // Filter out current user
        setPlayers(users.filter(u => u.id !== user.id));
      })
      .catch(console.error);
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (opponentId === 0) {
      setError('Please select an opponent');
      return;
    }

    if (playerScore === opponentScore) {
      setError('Scores cannot be tied');
      return;
    }

    if (playerScore < 0 || opponentScore < 0) {
      setError('Scores must be positive');
      return;
    }

    setSubmitting(true);

    try {
      await matchAPI.submit({
        sport,
        opponent_id: opponentId,
        player_score: playerScore,
        opponent_score: opponentScore,
      });
      alert('Match submitted successfully! Waiting for opponent confirmation.');
      navigate('/matches');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit match');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="submit-match-page">
      <h1>Submit Match Result</h1>

      <form onSubmit={handleSubmit} className="match-form">
        <div className="form-group">
          <label>Sport</label>
          <select 
            value={sport} 
            onChange={(e) => setSport(e.target.value as 'table_tennis' | 'table_football')}
            className="form-select"
          >
            <option value={SPORTS.TABLE_TENNIS}>{SPORT_LABELS.table_tennis}</option>
            <option value={SPORTS.TABLE_FOOTBALL}>{SPORT_LABELS.table_football}</option>
          </select>
        </div>

        <div className="form-group">
          <label>Opponent</label>
          <select 
            value={opponentId} 
            onChange={(e) => setOpponentId(Number(e.target.value))}
            className="form-select"
            required
          >
            <option value={0}>Select opponent...</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.display_name} ({player.login})
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Your Score</label>
            <input
              type="number"
              value={playerScore}
              onChange={(e) => setPlayerScore(Number(e.target.value))}
              min="0"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Opponent Score</label>
            <input
              type="number"
              value={opponentScore}
              onChange={(e) => setOpponentScore(Number(e.target.value))}
              min="0"
              className="form-input"
              required
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="submit-button" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Match'}
        </button>

        <p className="info">
          Your opponent will need to confirm this match before it affects ELO ratings.
        </p>
      </form>
    </div>
  );
}

export default SubmitMatch;
