'use client';

import { useState } from 'react';
import { matchesApi, Player } from '../lib/api';

interface AddMatchDialogProps {
  players: Player[];
  onMatchAdded: () => void;
}

export default function AddMatchDialog({ players, onMatchAdded }: AddMatchDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [player1Id, setPlayer1Id] = useState<number | null>(null);
  const [player2Id, setPlayer2Id] = useState<number | null>(null);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!player1Id || !player2Id || !result) {
      setError('All fields are required');
      return;
    }

    if (player1Id === player2Id) {
      setError('Players must be different');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await matchesApi.create({
        player1_id: player1Id,
        player2_id: player2Id,
        result: result,
      });
      
      // Reset form
      setPlayer1Id(null);
      setPlayer2Id(null);
      setResult('');
      setIsOpen(false);
      onMatchAdded();
    } catch (err) {
      console.error('Error creating match:', err);
      setError('Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPlayer1Id(null);
    setPlayer2Id(null);
    setResult('');
    setError(null);
  };

  const availablePlayers = players.filter(p => p.id !== player1Id && p.id !== player2Id);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        disabled={players.length < 2}
      >
        Add Match
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Match</h3>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="player1" className="block text-sm font-medium text-gray-700 mb-2">
                    Player 1
                  </label>
                  <select
                    id="player1"
                    value={player1Id || ''}
                    onChange={(e) => setPlayer1Id(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    <option value="">Select Player 1</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name} (ELO: {player.elo})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="player2" className="block text-sm font-medium text-gray-700 mb-2">
                    Player 2
                  </label>
                  <select
                    id="player2"
                    value={player2Id || ''}
                    onChange={(e) => setPlayer2Id(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    <option value="">Select Player 2</option>
                    {players
                      .filter(p => p.id !== player1Id)
                      .map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} (ELO: {player.elo})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="result" className="block text-sm font-medium text-gray-700 mb-2">
                    Result
                  </label>
                  <select
                    id="result"
                    value={result}
                    onChange={(e) => setResult(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    <option value="">Select Result</option>
                    <option value="player1_wins">Player 1 Wins</option>
                    <option value="player2_wins">Player 2 Wins</option>
                    <option value="draw">Draw</option>
                  </select>
                </div>

                {error && (
                  <div className="mb-4 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-md disabled:opacity-50"
                    disabled={loading || !player1Id || !player2Id || !result}
                  >
                    {loading ? 'Adding...' : 'Add Match'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}