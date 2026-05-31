import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { DynamicUIService } from '../services/DynamicUIService';

const dynamicUIService = new DynamicUIService();

export class UIController {
  /**
   * GET /api/v1/ui/config
   * Resolves the aggregated UI configuration based on role, current state, and ticket type.
   */
  async getFormConfig(
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
  ): Promise<void> {
    try {
      const roleId = req.user!.roleId;
      const { stateId, ticketType } = req.query;

      if (!stateId || !ticketType) {
        res.status(400).json({
          status: 'error',
          statusCode: 400,
          message: 'Bad Request: "stateId" (query) and "ticketType" (query) are required parameters.'
        });
        return;
      }

      const config = await dynamicUIService.getFormConfiguration(
        roleId,
        parseInt(stateId as string, 10),
        ticketType as string
      );

      res.status(200).json({
        status: 'success',
        data: config
      });
    } catch (err) {
      next(err);
    }
  }
}
