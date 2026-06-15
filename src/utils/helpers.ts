import { env } from '../config/env';
import { AlertLevel, PlayerState } from '../types/ai.types';

/**
 * Determine if data is stale (old) based on age
 */
export function isStale(ageSeconds: number): boolean {
  return ageSeconds > env.ai.staleThresholdSeconds;
}

/**
 * Determine if still in warmup phase (first 120s)
 */
export function isInWarmup(ageSeconds: number): boolean {
  return ageSeconds < env.ai.warmupDurationSeconds;
}

/**
 * Get the appropriate alert level based on data age
 */
export function getEffectiveAlertLevel(
  dbAlertLevel: AlertLevel, 
  ageSeconds: number
): AlertLevel {
  if (isStale(ageSeconds)) return AlertLevel.STALE;
  if (isInWarmup(ageSeconds)) return AlertLevel.WARMUP;
  return dbAlertLevel;
}

/**
 * Check if recommendation is urgent
 */
export function isUrgent(alertLevel: AlertLevel, playerState: PlayerState | null): boolean {
  if (alertLevel === AlertLevel.CRITICAL) return true;
  if (playerState === PlayerState.DEPLETED) return true;
  return false;
}

/**
 * Calculate age in seconds from a given date
 */
export function getAgeInSeconds(date: Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 1000);
}

/**
 * Round to 2 decimal places
 */
export function round(num: number | null): number | null {
  if (num === null || num === undefined) return null;
  return Math.round(num * 100) / 100;
}
