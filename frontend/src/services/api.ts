// src/services/api.ts
// Updated for Go backend response format

import type { LeaderboardEntry } from '../types/index';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const response = await fetch(`${API_URL}/api/leaderboard`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // FIXED: Go backend returns array directly, not wrapped in {success, data}
    // Handle both formats for compatibility
    if (Array.isArray(data)) {
      // Go backend format: returns array directly
      return data;
    } else if (data.success && Array.isArray(data.data)) {
      // Node.js backend format: returns {success: true, data: [...]}
      return data.data;
    } else {
      console.warn('Unexpected leaderboard response format:', data);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return [];
  }
};

// Optional: Add health check endpoint for debugging
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
};