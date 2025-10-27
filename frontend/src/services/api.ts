import type { LeaderboardEntry } from '../types/index';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const response = await fetch(`${API_URL}/api/leaderboard`);
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return [];
  }
};