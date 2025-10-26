import { MiniAppNotificationDetails } from '@farcaster/miniapp-sdk';
import { Redis } from '@upstash/redis';
import { APP_NAME } from './constants';

// In-memory fallback storage
const localStore = new Map<string, MiniAppNotificationDetails>();

// Use Redis if KV env vars are present, otherwise use in-memory
const useRedis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
const redis = useRedis
  ? new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    })
  : null;

function getUserNotificationDetailsKey(fid: number): string {
  return `${APP_NAME}:user:${fid}`;
}

export async function getUserNotificationDetails(
  fid: number
): Promise<MiniAppNotificationDetails | null> {
  const key = getUserNotificationDetailsKey(fid);
  if (redis) {
    return await redis.get<MiniAppNotificationDetails>(key);
  }
  return localStore.get(key) || null;
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: MiniAppNotificationDetails
): Promise<void> {
  const key = getUserNotificationDetailsKey(fid);
  if (redis) {
    await redis.set(key, notificationDetails);
  } else {
    localStore.set(key, notificationDetails);
  }
}

export async function deleteUserNotificationDetails(
  fid: number
): Promise<void> {
  const key = getUserNotificationDetailsKey(fid);
  if (redis) {
    await redis.del(key);
  } else {
    localStore.delete(key);
  }
}

// Leaderboard types
export interface GameStats {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  points: number;
  lastPlayed: number;
}

export interface GameResult {
  winnerFid: number;
  loserFid: number;
  winnerUsername: string;
  loserUsername: string;
  winnerDisplayName: string;
  loserDisplayName: string;
  winnerPfpUrl: string;
  loserPfpUrl: string;
  winnerScore: number;
  loserScore: number;
  timestamp: number;
}

function getStatsKey(fid: number): string {
  return `${APP_NAME}:stats:${fid}`;
}

function getLeaderboardKey(period: string): string {
  return `${APP_NAME}:leaderboard:${period}`;
}

// Get user stats
export async function getUserStats(fid: number): Promise<GameStats | null> {
  const key = getStatsKey(fid);
  if (redis) {
    return await redis.get<GameStats>(key);
  }
  const value = localStore.get(key);
  if (value && typeof value === 'object' && 'fid' in value) {
    return value as GameStats;
  }
  return null;
}

// Update user stats after a game
export async function updateStats(result: GameResult): Promise<void> {
  const timestamp = Date.now();
  
  // Update winner stats
  const winnerStats = await getUserStats(result.winnerFid);
  const newWinnerStats: GameStats = {
    fid: result.winnerFid,
    username: result.winnerUsername,
    displayName: result.winnerDisplayName,
    pfpUrl: result.winnerPfpUrl,
    gamesPlayed: (winnerStats?.gamesPlayed || 0) + 1,
    wins: (winnerStats?.wins || 0) + 1,
    losses: winnerStats?.losses || 0,
    goalsScored: (winnerStats?.goalsScored || 0) + result.winnerScore,
    goalsConceded: (winnerStats?.goalsConceded || 0) + result.loserScore,
    points: (winnerStats?.points || 0) + 3,
    lastPlayed: timestamp,
  };
  
  // Update loser stats
  const loserStats = await getUserStats(result.loserFid);
  const newLoserStats: GameStats = {
    fid: result.loserFid,
    username: result.loserUsername,
    displayName: result.loserDisplayName,
    pfpUrl: result.loserPfpUrl,
    gamesPlayed: (loserStats?.gamesPlayed || 0) + 1,
    wins: loserStats?.wins || 0,
    losses: (loserStats?.losses || 0) + 1,
    goalsScored: (loserStats?.goalsScored || 0) + result.loserScore,
    goalsConceded: (loserStats?.goalsConceded || 0) + result.winnerScore,
    points: Math.max(0, (loserStats?.points || 0) - 3),
    lastPlayed: timestamp,
  };
  
  // Save stats
  const winnerKey = getStatsKey(result.winnerFid);
  const loserKey = getStatsKey(result.loserFid);
  
  if (redis) {
    await redis.set(winnerKey, newWinnerStats);
    await redis.set(loserKey, newLoserStats);
  } else {
    localStore.set(winnerKey, newWinnerStats);
    localStore.set(loserKey, newLoserStats);
  }
}

// Get leaderboard
export async function getLeaderboard(period: '1d' | '7d' | '30d'): Promise<GameStats[]> {
  // For now, we'll get all stats and filter client-side
  // In a production system, you'd maintain sorted sets in Redis
  if (!redis) {
    // Fallback to local storage
    const allStats: GameStats[] = [];
    localStore.forEach((value) => {
      if (typeof value === 'object' && 'fid' in value && 'points' in value) {
        allStats.push(value as GameStats);
      }
    });
    return allStats.sort((a, b) => b.points - a.points);
  }
  
  // Get all stats keys
  const pattern = `${APP_NAME}:stats:*`;
  const keys = await redis.keys(pattern);
  
  if (!keys || keys.length === 0) return [];
  
  // Get all stats
  const statsPromises = keys.map(key => redis.get<GameStats>(key));
  const allStats = await Promise.all(statsPromises);
  
  // Filter and sort
  return allStats
    .filter((stats): stats is GameStats => stats !== null)
    .filter(stats => {
      const cutoffTime = Date.now() - getPeriodMs(period);
      return stats.lastPlayed >= cutoffTime;
    })
    .sort((a, b) => b.points - a.points);
}

function getPeriodMs(period: '1d' | '7d' | '30d'): number {
  switch (period) {
    case '1d': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
  }
}
