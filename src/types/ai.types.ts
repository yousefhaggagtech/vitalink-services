export enum PlayerState {
  NORMAL = 2,
  INACTIVE = 0,
  PEAKING = 1,
  DEPLETED = 3,
}

export enum AlertLevel {
  WARMUP = 'WARMUP',
  NORMAL = 'NORMAL',
  LOW_CONFIDENCE = 'LOW_CONFIDENCE',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  STALE = 'STALE',
}

export interface AIRecommendationRecord {
  id: number;
  beltId: string;
  timestamp: Date;
  power: number | null;
  crampRisk: number | null;
  momentum: number | null;
  recoveryTimeMin: number | null;
  timeToFailMin: number | null;
  substitutionWindow: number | null;
  playerState: PlayerState | null;
  alertLevel: AlertLevel;
  coachAdvice: string;
  processingTimeMs: number | null;
}

export interface AIRecommendation {
  beltId: string;
  timestamp: string;
  ageSinceLastUpdate: number;
  isStale: boolean;
  isInWarmup: boolean;
  metrics: {
    power: number | null;
    crampRisk: number | null;
    momentum: number | null;
    recoveryTimeMin: number | null;
    timeToFailMin: number | null;
  };
  status: {
    playerState: PlayerState | null;
    alertLevel: AlertLevel;
    substitutionWindow: number | null;
    crampEvent: string | null;
  };
  recommendation: {
    coachAdvice: string;
    isUrgent: boolean;
  };
}

export interface AIWaitingState {
  beltId: string;
  status: 'WAITING_FOR_ANALYSIS';
  message: string;
  hint: string;
}

export interface AITimelineEntry {
  timestamp: string;
  power: number | null;
  crampRisk: number | null;
  momentum: number | null;
  playerState: PlayerState | null;
  alertLevel: AlertLevel;
}
