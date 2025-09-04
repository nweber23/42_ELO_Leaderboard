'use client';

import { useState, useEffect } from 'react';
import { LeaderboardEntry, Stats, leaderboardApi, playersApi, matchesApi, Player } from './lib/api';
import AddPlayerDialog from './components/AddPlayerDialog';
import AddMatchDialog from './components/AddMatchDialog';

export default function Home() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leaderboardRes, statsRes, playersRes] = await Promise.all([
        leaderboardApi.get(),
        leaderboardApi.getStats(),
        playersApi.getAll(),
      ]);
      
      setLeaderboard(leaderboardRes.data || []);
      setStats(statsRes.data);
      setPlayers(playersRes.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Make sure the backend is running on port 8081.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePlayerAdded = () => {
    fetchData();
  };

  const handleMatchAdded = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button 
            onClick={fetchData}
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4">
      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Players</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.total_players}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Matches</h3>
            <p className="text-3xl font-bold text-green-600">{stats.total_matches}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Average ELO</h3>
            <p className="text-3xl font-bold text-purple-600">{Math.round(stats.avg_elo)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Top Player</h3>
            <p className="text-xl font-bold text-yellow-600">
              {stats.top_player?.name || 'N/A'}
            </p>
            <p className="text-sm text-gray-500">
              {stats.top_player?.elo} ELO
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <AddPlayerDialog onPlayerAdded={handlePlayerAdded} />
        <AddMatchDialog players={players} onMatchAdded={handleMatchAdded} />
      </div>

      {/* Leaderboard */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Leaderboard
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Current player rankings based on ELO rating
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {leaderboard.map((entry) => (
            <li key={entry.player.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      entry.rank === 1 ? 'bg-yellow-500' :
                      entry.rank === 2 ? 'bg-gray-400' :
                      entry.rank === 3 ? 'bg-orange-600' :
                      'bg-blue-500'
                    }`}>
                      {entry.rank}
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {entry.player.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {entry.games} games • {entry.win_rate.toFixed(1)}% win rate
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-900">
                    <div className="font-medium">ELO: {entry.player.elo}</div>
                    <div className="text-gray-500">
                      {entry.player.wins}W-{entry.player.losses}L-{entry.player.draws}D
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {leaderboard.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-gray-500">No players yet. Add some players to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}