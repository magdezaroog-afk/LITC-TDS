import { Request, Response, NextFunction } from 'express';
import { SLAEngineService } from '../services/SLAEngineService';
import { SlaMonitorJob } from '../jobs/SlaMonitorJob';

const slaService = new SLAEngineService();
const monitorJob = new SlaMonitorJob();

export class SLAController {
  /**
   * POST /api/v1/sla/recalculate/:ticketId
   * Recalculates the SLA deadline for the specified ticket based on working hours.
   */
  async recalculateSla(
    req: Request, 
    res: Response, 
    next: NextFunction
  ): Promise<void> {
    try {
      const ticketId = parseInt(req.params.ticketId, 10);
      const deadline = await slaService.calculateSlaDeadline(ticketId);

      res.status(200).json({
        status: 'success',
        message: 'SLA deadline recalculated successfully.',
        data: {
          ticketId,
          deadlineDateTime: deadline
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/sla/check-breaches
   * Manually triggers the background check job to find and escalate breached trackers.
   */
  async triggerBreachCheck(
    req: Request, 
    res: Response, 
    next: NextFunction
  ): Promise<void> {
    try {
      await monitorJob.checkSlaBreaches();
      
      res.status(200).json({
        status: 'success',
        message: 'SLA breach scan and auto-escalations processed successfully.'
      });
    } catch (err) {
      next(err);
    }
  }
}
