import NodeCache from 'node-cache';
import { aiRepository } from '../repositories/ai.repository';
import { 
  AIRecommendation, 
  AIRecommendationRecord, 
  AIWaitingState,
  AITimelineEntry,
} from '../types/ai.types';
import { env } from '../config/env';
import { 
  getAgeInSeconds, 
  getEffectiveAlertLevel, 
  isInWarmup, 
  isStale, 
  isUrgent,
  round 
} from '../utils/helpers';
import { logger } from '../utils/logger';

const cache = new NodeCache({ 
  stdTTL: env.ai.cacheTtlSeconds, 
  checkperiod: 5, 
  useClones: false 
});

export class AIService {

  async getLatest(beltId: string): Promise<AIRecommendation | AIWaitingState> {
    try {
      const cacheKey = `ai:latest:${beltId}`;
      const cached = cache.get<AIRecommendation | AIWaitingState>(cacheKey);
      if (cached) return cached;

      const record = await aiRepository.getLatestByBelt(beltId);
      
      if (!record) {
        const waiting: AIWaitingState = {
          beltId,
          status: 'WAITING_FOR_ANALYSIS',
          message: 'Waiting for analysis...',
          hint: 'The AI is collecting baseline data. Insights will appear after 2 minutes.',
        };
        cache.set(cacheKey, waiting, 1);
        return waiting;
      }

      const recommendation = this.mapToResponse(record);
      cache.set(cacheKey, recommendation, env.ai.cacheTtlSeconds);
      return recommendation;
    } catch (error: any) {
      logger.error(`[AIService Error - getLatest]:`, {
        message: error.message,
        stack: error.stack,
        error
      });
      throw error;
    }
  }

  async getTimeline(
    beltId: string,
    startDate: Date,
    endDate: Date,
    limit?: number
  ): Promise<AITimelineEntry[]> {
    try {
      const records = await aiRepository.getTimeline(beltId, startDate, endDate, limit);
      return records.map(record => this.mapToTimelineEntry(record));
    } catch (error: any) {
      logger.error(`[AIService Error - getTimeline]:`, {
        message: error.message,
        stack: error.stack,
        error
      });
      throw error;
    }
  }

  async getHealthStatus(beltId: string) {
    try {
      const record = await aiRepository.getLatestByBelt(beltId);
      
      if (!record) {
        return {
          beltId,
          status: 'WAITING',
          message: 'No analysis yet',
          dataPointsLast10Min: 0,
        };
      }

      const age = getAgeInSeconds(record.timestamp);
      const countLast10Min = await aiRepository.getRecentCount(beltId, 10);

      return {
        beltId,
        status: isStale(age) ? 'STALE' : 'ACTIVE',
        lastUpdate: record.timestamp.toISOString(),
        ageSeconds: age,
        dataPointsLast10Min: countLast10Min,
      };
    } catch (error: any) {
      logger.error(`[AIService Error - getHealthStatus]:`, {
        message: error.message,
        stack: error.stack,
        error
      });
      throw error;
    }
  }

  private mapToResponse(record: AIRecommendationRecord): AIRecommendation {
    const age = getAgeInSeconds(record.timestamp);
    const effectiveAlert = getEffectiveAlertLevel(record.alertLevel, age);

    return {
      beltId: record.beltId,
      timestamp: record.timestamp.toISOString(),
      ageSinceLastUpdate: age,
      isStale: isStale(age),
      isInWarmup: isInWarmup(age),
      metrics: {
        power: round(record.power),
        crampRisk: round(record.crampRisk),
        momentum: round(record.momentum),
        recoveryTimeMin: round(record.recoveryTimeMin),
        timeToFailMin: round(record.timeToFailMin),
      },
      status: {
        playerState: record.playerState,
        alertLevel: effectiveAlert,
        substitutionWindow: record.substitutionWindow,
        crampEvent: null,
      },
      recommendation: {
        coachAdvice: record.coachAdvice,
        isUrgent: isUrgent(effectiveAlert, record.playerState),
      },
    };
  }

  private mapToTimelineEntry(record: AIRecommendationRecord): AITimelineEntry {
    return {
      timestamp: record.timestamp.toISOString(),
      power: round(record.power),
      crampRisk: round(record.crampRisk),
      momentum: round(record.momentum),
      playerState: record.playerState,
      alertLevel: record.alertLevel,
    };
  }
}

export const aiService = new AIService();
