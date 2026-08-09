import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db/client';
import { z } from 'zod';

// Zod Schema for external ticket injection
const uecpTicketSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  ticketType: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

export class UECPGatewayController {
  
  /**
   * POST /api/v1/uecp/tickets
   * Injection point for external systems to create a ticket securely
   */
  async injectTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const system = (req as any).uecpSystem;
      
      // Strict Payload Validation
      const parsedData = uecpTicketSchema.parse(req.body);

      // Create Ticket
      const ticket = await prisma.ticket.create({
        data: {
          title: `[${system.systemName}] ${parsedData.title}`,
          description: parsedData.description,
          ticketType: parsedData.ticketType || 'TECHNICAL',
          priority: parsedData.priority || 'MEDIUM',
          channel: 'UECP',
          categoryId: 1, // Default or derived from payload
          stateId: 1     // Default NEW state
        }
      });

      // Async SOC Tracing
      await this.logAuditAsync(system.id, 'INBOUND', req.originalUrl, 201, req.body);

      res.status(201).json({ success: true, ticketId: ticket.id, message: 'Ticket Accepted via UECP' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Payload Validation Failed', details: error.issues });
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/uecp/tickets
   * Pull mechanism for external systems to sync data (Requires Pagination)
   */
  async getTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const system = (req as any).uecpSystem;
      
      // Enforced Pagination for Bulk Operations
      const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string || '20', 10)));
      const skip = (page - 1) * limit;

      const [total, tickets] = await prisma.$transaction([
        prisma.ticket.count({ where: { channel: 'UECP' } }),
        prisma.ticket.findMany({
          where: { channel: 'UECP' },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, priority: true, createdAt: true, state: { select: { name: true } } }
        })
      ]);

      await this.logAuditAsync(system.id, 'INBOUND', req.originalUrl, 200);

      res.json({
        success: true,
        data: tickets,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Async SOC Tracer (Fire and forget)
   */
  private async logAuditAsync(systemId: string, direction: string, endpoint: string, status: number, payload?: any) {
    prisma.uECPAuditLog.create({
      data: {
        systemId,
        direction,
        endpoint,
        status,
        payload: payload ? JSON.stringify(payload).substring(0, 1000) : null
      }
    }).catch(err => console.error('[UECPAudit] Failed to log:', err));
  }
}

export const uecpGatewayController = new UECPGatewayController();
