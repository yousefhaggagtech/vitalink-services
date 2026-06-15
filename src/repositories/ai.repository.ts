import sql from 'mssql';
import { db } from '../config/database';
import { AIRecommendationRecord, AlertLevel, PlayerState } from '../types/ai.types';
import { logger } from '../utils/logger';

export class AIRepository {

  async getLatestByBelt(beltId: string): Promise<AIRecommendationRecord | null> {
    try {
      const pool = db.getPool();
      
      const result = await pool.request()
        .input('beltId', sql.NVarChar, beltId)
        .query(`
          SELECT TOP 1 
            Id           AS id,
            BeltID       AS belt_id,
            Timestamp    AS timestamp,
            Power        AS power,
            CrampRisk    AS cramp_risk,
            Momentum     AS momentum,
            RecoveryTimeMin    AS recovery_time_min,
            TimeToFailMin      AS time_to_fail_min,
            SubstitutionWindow AS substitution_window,
            PlayerState        AS player_state,
            AlertLevel         AS alert_level,
            CoachAdvice        AS coach_advice,
            ProcessingTimeMs   AS processing_time_ms
          FROM AthletePredictions
          WHERE BeltID = @beltId
          ORDER BY Timestamp DESC
        `);

      if (result.recordset.length === 0) return null;
      return this.mapRecord(result.recordset[0]);
    } catch (error: any) {
      logger.error(`[AIRepository Error - getLatestByBelt]: ${error.message}`);
      throw error;
    }
  }

  async getTimeline(
    beltId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 200
  ): Promise<AIRecommendationRecord[]> {
    try {
      const pool = db.getPool();
      
      const result = await pool.request()
        .input('beltId', sql.NVarChar, beltId)
        .input('startDate', sql.DateTime2, startDate)
        .input('endDate', sql.DateTime2, endDate)
        .input('limit', sql.Int, Math.min(limit, 1000))
        .query(`
          SELECT TOP (@limit)
            Id           AS id,
            BeltID       AS belt_id,
            Timestamp    AS timestamp,
            Power        AS power,
            CrampRisk    AS cramp_risk,
            Momentum     AS momentum,
            RecoveryTimeMin    AS recovery_time_min,
            TimeToFailMin      AS time_to_fail_min,
            SubstitutionWindow AS substitution_window,
            PlayerState        AS player_state,
            AlertLevel         AS alert_level,
            CoachAdvice        AS coach_advice,
            ProcessingTimeMs   AS processing_time_ms
          FROM AthletePredictions
          WHERE BeltID = @beltId
            AND Timestamp BETWEEN @startDate AND @endDate
          ORDER BY Timestamp ASC
        `);

      return result.recordset.map(r => this.mapRecord(r));
    } catch (error: any) {
      logger.error(`[AIRepository Error - getTimeline]: ${error.message}`);
      throw error;
    }
  }

  async getRecentCount(beltId: string, minutes: number = 10): Promise<number> {
    try {
      const pool = db.getPool();
      
      const result = await pool.request()
        .input('beltId', sql.NVarChar, beltId)
        .input('minutes', sql.Int, minutes)
        .query(`
          SELECT COUNT(*) as count
          FROM AthletePredictions
          WHERE BeltID = @beltId
            AND Timestamp >= DATEADD(MINUTE, -@minutes, GETDATE())
        `);

      return result.recordset[0].count;
    } catch (error: any) {
      logger.error(`[AIRepository Error - getRecentCount]: ${error.message}`);
      throw error;
    }
  }

  private mapRecord(row: any): AIRecommendationRecord {
    return {
      id: row.id,
      beltId: row.belt_id,
      timestamp: this.toDate(row.timestamp),
      power: this.toNullableNumber(row.power),
      crampRisk: this.toNullableNumber(row.cramp_risk),
      momentum: this.toNullableNumber(row.momentum),
      recoveryTimeMin: this.toNullableNumber(row.recovery_time_min),
      timeToFailMin: this.toNullableNumber(row.time_to_fail_min),
      substitutionWindow: this.toNullableNumber(row.substitution_window),
      playerState: this.toPlayerState(row.player_state),
      alertLevel: this.toAlertLevel(row.alert_level),
      coachAdvice: String(row.coach_advice ?? ''),
      processingTimeMs: this.toNullableNumber(row.processing_time_ms),
    };
  }

  private toDate(value: unknown): Date {
    return value instanceof Date ? value : new Date(String(value));
  }

  private toNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  private toPlayerState(value: unknown): PlayerState | null {
    const numericValue = this.toNullableNumber(value);
    if (numericValue === null) return null;

    return Object.values(PlayerState).includes(numericValue)
      ? numericValue as PlayerState
      : null;
  }

  private toAlertLevel(value: unknown): AlertLevel {
    return Object.values(AlertLevel).includes(value as AlertLevel)
      ? value as AlertLevel
      : AlertLevel.NORMAL;
  }
}

export const aiRepository = new AIRepository();
