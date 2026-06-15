import { Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export class AIController {

  /**
   * GET /api/ai/:beltId/latest
   */
  async getLatest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { beltId } = req.params;
      const user = req.user!;

      // ✅ Validate beltId
      if (!beltId || typeof beltId !== 'string') {
        throw new AppError('Invalid beltId', 400);
      }

      // ✅ Log who made the request
      logger.info(
        `👤 ${user.name} (${user.roleName}) requested AI data for ${beltId}`
      );

      const data = await aiService.getLatest(beltId);
      res.json({ success: true, data });
    } catch (error) {
      console.error("CONTROLLER ERROR:", error); console.error("CONTROLLER ERROR:", error); next(error);
    }
  }

  /**
   * GET /api/ai/:beltId/timeline
   */
  async getTimeline(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { beltId } = req.params;
      const { startDate, endDate, limit } = req.query;
      const user = req.user!;

      // ✅ Validate beltId
      if (!beltId || typeof beltId !== 'string') {
        throw new AppError('Invalid beltId', 400);
      }

      // ✅ Log the request
      logger.info(
        `👤 ${user.name} requested timeline for ${beltId}`
      );

      // ✅ Validate dates
      if (!startDate || !endDate) {
        throw new AppError('startDate and endDate are required (ISO format)', 400);
      }

      const timeline = await aiService.getTimeline(
        beltId,
        new Date(startDate as string),
        new Date(endDate as string),
        limit ? Number(limit) : undefined
      );

      res.json({ 
        success: true, 
        count: timeline.length, 
        data: timeline 
      });
    } catch (error) {
      console.error("CONTROLLER ERROR:", error); console.error("CONTROLLER ERROR:", error); next(error);
    }
  }

  /**
   * GET /api/ai/:beltId/health
   */
  async getHealth(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { beltId } = req.params;

      // ✅ Validate beltId
      if (!beltId || typeof beltId !== 'string') {
        throw new AppError('Invalid beltId', 400);
      }

      const health = await aiService.getHealthStatus(beltId);
      res.json({ success: true, data: health });
    } catch (error) {
      console.error("CONTROLLER ERROR:", error); console.error("CONTROLLER ERROR:", error); next(error);
    }
  }
}

export const aiController = new AIController();
