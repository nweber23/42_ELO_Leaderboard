import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchAPI, usersAPI } from '../api/client';
import type { User } from '../types';
import { Page } from '../layout/Page';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Field, Select, Input } from '../ui/Field';
import { Button } from '../ui/Button';
import { getErrorMessage } from '../utils/errorUtils';
import { calculateELOChange, formatEloDelta } from '../utils/eloUtils';
import { SCORE_MIN } from '../constants';
import { getSports, type SportConfig } from '../config/sports';
import './SubmitMatch.css';

interface SubmitMatchProps {
  user: User;
}

function SubmitMatch({ user }: SubmitMatchProps) {
  const navigate = useNavigate();
  const [sports, setSports] = useState<SportConfig[]>([]);
  const [sport, setSport] = useState<string>('');
  const [opponentId, setOpponentId] = useState<number>(0);
  const [playerScore, setPlayerScore] = useState<string>('');
  const [opponentScore, setOpponentScore] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [players, setPlayers] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Load sports and users
  useEffect(() => {
    getSports().then(loadedSports => {
      setSports(loadedSports);
      if (loadedSports.length > 0 && !sport) {
        setSport(loadedSports[0].id);
      }
    });
    usersAPI.getAll()
      .then(users => {
        setPlayers(users.filter(u => u.id !== user.id));
      })
      .catch(console.error);
  }, [user.id, sport]);

  // Get selected opponent
  const selectedOpponent = useMemo(() => {
    return players.find(p => p.id === opponentId) || null;
  }, [players, opponentId]);

  // Get current ELO ratings based on selected sport
  // Uses new sports map if available, falls back to legacy fields
  const getELO = (u: User, sportId: string): number => {
    if (u.sports?.[sportId]) {
      return u.sports[sportId].current_elo;
    }
    // Fallback to legacy fields
    if (sportId === 'table_tennis') return u.table_tennis_elo;
    if (sportId === 'table_football') return u.table_football_elo;
    return 1000; // Default for unknown sports
  };

  const playerELO = getELO(user, sport);
  const opponentELO = selectedOpponent ? getELO(selectedOpponent, sport) : null;

  // Calculate predicted ELO changes
  const eloPrediction = useMemo(() => {
    if (!opponentELO) return null;

    const pScore = Number(playerScore);
    const oScore = Number(opponentScore);

    if (isNaN(pScore) || isNaN(oScore) || pScore === oScore) return null;

    const playerWins = pScore > oScore;
    return calculateELOChange(playerELO, opponentELO, playerWins);
  }, [playerELO, opponentELO, playerScore, opponentScore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const pScore = Number(playerScore);
    const oScore = Number(opponentScore);

    if (opponentId === 0) {
      setError('Please select an opponent');
      return;
    }

    if (pScore === oScore) {
      setError('Scores cannot be tied');
      return;
    }

    if (pScore < SCORE_MIN || oScore < SCORE_MIN) {
      setError('Scores must be positive');
      return;
    }

    setSubmitting(true);

    try {
      await matchAPI.submit({
        sport,
        opponent_id: opponentId,
        player_score: pScore,
        opponent_score: oScore,
        context: notes,
      });
      navigate('/matches');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page title="Submit Match" subtitle="Record a new match result">
      <Card>
        <CardHeader>
          <CardTitle>Match Details</CardTitle>
          <CardDescription>
            Your opponent will need to confirm this match before it affects ELO ratings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="submit-form">
            <Field label="Sport">
              <Select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
              >
                {sports.map(s => (
                  <option key={s.id} value={s.id}>{s.display_name}</option>
                ))}
              </Select>
            </Field>

            <Field label="Opponent">
              <Select
                value={opponentId}
                onChange={(e) => setOpponentId(Number(e.target.value))}
                required
              >
                <option value={0}>Select opponent...</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.display_name} (@{player.login})
                  </option>
                ))}
              </Select>
            </Field>

            <div className="submit-form__scores">
              <Field label="Your Score">
                <Input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={playerScore}
                  onChange={(e) => setPlayerScore(e.target.value)}
                  min="0"
                  placeholder="0"
                  required
                />
              </Field>

              <Field label="Opponent Score">
                <Input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={opponentScore}
                  onChange={(e) => setOpponentScore(e.target.value)}
                  min="0"
                  placeholder="0"
                  required
                />
              </Field>
            </div>

            {/* ELO Information Panel */}
            {selectedOpponent && (
              <div className="submit-form__elo-panel">
                <div className="submit-form__elo-row">
                  <span className="submit-form__elo-label">Your ELO</span>
                  <strong>{playerELO}</strong>
                </div>
                <div className="submit-form__elo-row">
                  <span className="submit-form__elo-label">{selectedOpponent.display_name}'s ELO</span>
                  <strong>{opponentELO}</strong>
                </div>

                {eloPrediction && (
                  <div className="submit-form__elo-prediction">
                    <div className="submit-form__elo-prediction-title">
                      Predicted ELO Changes:
                    </div>
                    <div className="submit-form__elo-row">
                      <span>You</span>
                      <span className={eloPrediction.playerDelta > 0 ? 'text-success' : 'text-danger'}>
                        {formatEloDelta(eloPrediction.playerDelta)} → {eloPrediction.playerNewELO}
                      </span>
                    </div>
                    <div className="submit-form__elo-row">
                      <span>{selectedOpponent.display_name}</span>
                      <span className={eloPrediction.opponentDelta > 0 ? 'text-success' : 'text-danger'}>
                        {formatEloDelta(eloPrediction.opponentDelta)} → {eloPrediction.opponentNewELO}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Field label="Notes (optional)" hint="Add context about this match">
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Best of 5, overtime win..."
                maxLength={200}
              />
            </Field>

            {error && <div className="submit-form__error">{error}</div>}

            <Button type="submit" size="lg" isLoading={submitting} style={{ width: '100%' }}>
              Submit Match
            </Button>
          </form>
        </CardContent>
      </Card>
    </Page>
  );
}

export default SubmitMatch;
