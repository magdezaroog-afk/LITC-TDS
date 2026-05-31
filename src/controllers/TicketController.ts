import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { TicketStateService } from '../services/TicketStateService';

const ticketStateService = new TicketStateService();

export class TicketController {
  /**
   * GET /api/v1/tickets/:id/transitions
   * Retrieves all transitions currently available for the authenticated user on the ticket.
   */
  async getAvailableTransitions(
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
  ): Promise<void> {
    try {
      const ticketId = parseInt(req.params.id, 10);
      const userId = req.user!.id;

      const transitions = await ticketStateService.getAvailableTransitions(ticketId, userId);
      
      res.status(200).json({
        status: 'success',
        data: transitions
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/tickets/:id/transitions
   * Executes a state transition on the ticket with optimistic locking verification.
   */
  async executeTransition(
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
  ): Promise<void> {
    try {
      const ticketId = parseInt(req.params.id, 10);
      const userId = req.user!.id;
      const { targetStateId, version } = req.body;

      if (targetStateId === undefined || version === undefined) {
        res.status(400).json({
          status: 'error',
          statusCode: 400,
          message: 'Bad Request: "targetStateId" and "version" are required parameters in the request body.'
        });
        return;
      }

      const updatedTicket = await ticketStateService.executeTransition(
        ticketId, 
        userId, 
        parseInt(targetStateId, 10), 
        parseInt(version, 10)
      );

      res.status(200).json({
        status: 'success',
        message: 'State transition completed successfully.',
        data: updatedTicket
      });
    } catch (err) {
      next(err);
    }
  }
}
