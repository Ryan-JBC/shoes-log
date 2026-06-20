import { WearLog, ReplacementStatus } from '../types';

const IMMINENT_THRESHOLD_KM = 50;

export function totalDistance(logs: Pick<WearLog, 'distance'>[]): number {
  return logs.reduce((sum, log) => sum + (log.distance ?? 0), 0);
}

export function replacementStatus(
  total: number,
  target: number | null,
): ReplacementStatus {
  if (target == null) return 'none';
  if (total >= target) return 'reached';
  if (target - total <= IMMINENT_THRESHOLD_KM) return 'imminent';
  return 'none';
}

export function remainingDistance(
  total: number,
  target: number | null,
): number | null {
  if (target == null) return null;
  return Math.max(0, target - total);
}
