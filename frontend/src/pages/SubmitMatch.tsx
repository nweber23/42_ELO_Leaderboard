import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchAPI, usersAPI } from '../api/client';
import type { User } from '../types';
import { SPORTS, SPORT_LABELS } from '../types';
import { Page } from '../layout/Page';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Field, Select, Input } from '../ui/Field';
import { Button } from '../ui/Button';
import { getErrorMessage } from '../utils/errorUtils';
import { calculateELOChange, formatEloDelta } from '../utils/eloUtils';
import { SCORE_MIN } from '../constants';

interface SubmitMatchProps {
  user: User;
}

function SubmitMatch({ user }: SubmitMatchProps) {
  const navigate = useNavigate();
  const [sport, setSport] = useState<'table_tennis' | 'table_football'>('table_tennis');
  const [opponentId, setOpponentId] = useState<number>(0);
  const [playerScore, setPlayerScore] = useState<string>('');
  const [opponentScore, setOpponentScore] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [players, setPlayers] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    usersAPI.getAll()
      .then(users => {
        setPlayers(users.filter(u => u.id !== user.id));
      })
      .catch(console.error);
  }, [user.id]);

  // Get selected opponent
  const selectedOpponent = useMemo(() => {
    return players.find(p => p.id === opponentId) || null;
  }, [players, opponentId]);

  // Get current ELO ratings based on selected sport
  const playerELO = sport === 'table_tennis' ? user.table_tennis_elo : user.table_football_elo;
  const opponentELO = selectedOpponent
    ? (sport === 'table_tennis' ? selectedOpponent.table_tennis_elo : selectedOpponent.table_football_elo)
    : null;

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
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--space-5)' }}>
            <Field label="Sport">
              <Select
                value={sport}
                onChange={(e) => setSport(e.target.value as 'table_tennis' | 'table_football')}
              >
                <option value={SPORTS.TABLE_TENNIS}>{SPORT_LABELS.table_tennis}</option>
                <option value={SPORTS.TABLE_FOOTBALL}>{SPORT_LABELS.table_football}</option>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Field label="Your Score">
                <Input
                  type="number"
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
              <div className="elo-info-panel" style={{
                background: 'var(--surface-2)',
                borderRadius: 'var(--radius-2)',
                padding: 'var(--space-4)',
                display: 'grid',
                gap: 'var(--space-3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-2)' }}>Your ELO</span>
                  <strong>{playerELO}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-2)' }}>{selectedOpponent.display_name}'s ELO</span>
                  <strong>{opponentELO}</strong>
                </div>

                {eloPrediction && (
                  <>
                    <div style={{ borderTop: '1px solid var(--border)', marginTop: 'var(--space-2)', paddingTop: 'var(--space-3)' }}>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', marginBottom: 'var(--space-2)' }}>
                        Predicted ELO Changes:
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>You</span>
                        <span style={{
                          color: eloPrediction.playerDelta > 0 ? 'var(--success)' : 'var(--danger)',
                          fontWeight: 600
                        }}>
                          {formatEloDelta(eloPrediction.playerDelta)} → {eloPrediction.playerNewELO}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{selectedOpponent.display_name}</span>
                        <span style={{
                          color: eloPrediction.opponentDelta > 0 ? 'var(--success)' : 'var(--danger)',
                          fontWeight: 600
                        }}>
                          {formatEloDelta(eloPrediction.opponentDelta)} → {eloPrediction.opponentNewELO}
                        </span>
                      </div>
                    </div>
                  </>
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

            {error && <div className="error-message">{error}</div>}

            <Button type="submit" size="lg" isLoading={submitting}>
              Submit Match
            </Button>
          </form>
        </CardContent>
      </Card>
    </Page>
  );
}

export default SubmitMatch;
