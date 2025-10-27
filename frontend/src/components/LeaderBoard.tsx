import { useEffect, useState } from 'react';
import type { LeaderboardEntry } from '../types';
import { fetchLeaderboard } from '../services/api';

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const data = await fetchLeaderboard();
    setLeaderboard(data.slice(0, 10));
    setLoading(false);
  };

  const getRankEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  return (
    <div className="leaderboard">
      <h2 className="leaderboard-title">
        <span className="trophy-icon">🏆</span>
        Top Players
      </h2>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="empty-state">
          <p>No players yet.</p>
          <p>Be the first to play!</p>
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.map((entry, index) => (
            <div key={entry.username} className={`leaderboard-item rank-${index + 1}`}>
              <div className="rank">{getRankEmoji(index)}</div>
              <div className="player-info">
                <div className="player-username">{entry.username}</div>
                <div className="player-stats">
                  {entry.wins}W • {entry.losses}L • {entry.draws}D
                </div>
              </div>
              <div className="win-rate">{entry.winRate}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}