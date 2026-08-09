import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db/client';
import { TicketFlowEngine } from '../services/TicketFlowEngine';

export class TicketController {
  
  // POST /api/tickets/:id/transition
  async transitionTicketState(req: Request, res: Response, next: NextFunction) {
    try {
      const ticketId = parseInt(req.params.id, 10);
      const { newStateId, notes } = req.body;
      const userId = (req as any).user?.id || 1; // Fallback to 1 if not fully authenticated in dev

      if (!newStateId) return res.status(400).json({ error: 'newStateId is required' });

      await TicketFlowEngine.transitionState(ticketId, newStateId, userId, notes);

      res.json({ success: true, message: 'Ticket State Transitioned Successfully' });
    } catch (error: any) {
      if (error.message.includes('Blocked Transition')) {
        return res.status(403).json({ error: error.message });
      }
      next(error);
    }
  }
}

export const ticketController = new TicketController();
