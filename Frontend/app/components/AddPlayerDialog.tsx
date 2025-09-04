'use client';

import { useState } from 'react';
import { playersApi } from '../lib/api';

interface AddPlayerDialogProps {
  onPlayerAdded: () => void;
}

export default function AddPlayerDialog({ onPlayerAdded }: AddPlayerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Player name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await playersApi.create({ name: playerName.trim() });
      setPlayerName('');
      setIsOpen(false);
      onPlayerAdded();
    } catch (err) {
      console.error('Error creating player:', err);
      setError('Failed to create player');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPlayerName('');
    setError(null);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Add Player
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Player</h3>
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
                  <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
                    Player Name
                  </label>
                  <input
                    type="text"
                    id="playerName"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter player name"
                    disabled={loading}
                  />
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
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md disabled:opacity-50"
                    disabled={loading || !playerName.trim()}
                  >
                    {loading ? 'Adding...' : 'Add Player'}
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