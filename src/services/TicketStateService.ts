import { prisma } from '../db/client';
import { 
  NotFoundError, 
  UnauthorizedTransitionError, 
  ConcurrencyConflictError 
} from '../errors/customErrors';

export class TicketStateService {
  /**
   * Retrieves all transitions currently available for a given ticket and user.
   * 
   * @param ticketId - The ID of the ticket
   * @param userId - The ID of the user requesting the transitions
   * @returns Array of available transitions including the target states
   */
  async getAvailableTransitions(ticketId: number, userId: number): Promise<any[]> {
    // 1. Retrieve the ticket and its current state
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { stateId: true },
    });

    if (!ticket) {
      throw new NotFoundError(`Ticket with ID ${ticketId} not found.`);
    }

    // 2. Retrieve the user's role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true },
    });

    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found.`);
    }

    // 3. Query allowed transitions from TicketStateTransition
    const transitions = await prisma.ticketStateTransition.findMany({
      where: {
        fromStateId: ticket.stateId,
        OR: [
          { roleId: user.roleId },
          { roleId: null }
        ]
      },
      include: {
        toState: true,
        role: {
          select: {
            name: true
          }
        }
      }
    });

    return transitions;
  }

  /**
   * Executes a state transition on a ticket.
   * Validates permissions and manages optimistic concurrency control.
   * 
   * @param ticketId - The ID of the ticket to transit
   * @param userId - The ID of the user performing the transition
   * @param targetStateId - The ID of the destination state
   * @param expectedVersion - The current expected version of the ticket (for concurrency locking)
   * @returns The updated ticket
   */
  async executeTransition(
    ticketId: number, 
    userId: number, 
    targetStateId: number, 
    expectedVersion: number
  ): Promise<any> {
    return await prisma.$transaction(async (tx) => {
      // 1. Retrieve ticket current state and details
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: { subTickets: { include: { state: true } } }
      });

      if (!ticket) {
        throw new NotFoundError(`Ticket with ID ${ticketId} not found.`);
      }

      // 1.5 Check Parent-Child Governance if Target is CLOSED
      const targetState = await tx.ticketState.findUnique({ where: { id: targetStateId } });
      if (targetState?.name === 'CLOSED') {
        const openSubTickets = ticket.subTickets.filter((st: any) => st.state?.name !== 'CLOSED');
        if (openSubTickets.length > 0) {
          const { NotificationEngine } = require('../backend/services/NotificationEngine');
          NotificationEngine.broadcast({
            type: 'DANGER',
            message: `مخالفة تشغيلية: محاولة إغلاق التذكرة الأم (${ticketId}) بينما يوجد تذاكر فرعية مفتوحة!`,
            targetRole: 'IT_Admin'
          });
          throw new UnauthorizedTransitionError(`Governance Violation: Cannot close Parent Ticket ${ticketId} with open Sub-Tickets.`);
        }
      }

      // 2. Retrieve user role details
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { roleId: true, fullName: true }
      });

      if (!user) {
        throw new NotFoundError(`User with ID ${userId} not found.`);
      }

      // 3. Find matched transition rule
      const transition = await tx.ticketStateTransition.findFirst({
        where: {
          fromStateId: ticket.stateId,
          toStateId: targetStateId,
          OR: [
            { roleId: user.roleId },
            { roleId: null }
          ]
        }
      });

      if (!transition) {
        throw new UnauthorizedTransitionError(
          `Unauthorized transition: User "${user.fullName}" (Role ID: ${user.roleId}) cannot move ticket ${ticketId} from State ID ${ticket.stateId} to State ID ${targetStateId}.`
        );
      }

      // 4. Update the ticket state with Optimistic Concurrency Control (OCC)
      const updateResult = await tx.ticket.updateMany({
        where: {
          id: ticketId,
          version: expectedVersion
        },
        data: {
          stateId: targetStateId,
          version: { increment: 1 }
        }
      });

      // If no rows updated, it means the version changed or the ticket was deleted since retrieval
      if (updateResult.count === 0) {
        throw new ConcurrencyConflictError(
          `Concurrency Conflict: Ticket ${ticketId} was modified by another process. Expected version: ${expectedVersion}.`
        );
      }

      // 5. Log the action in TicketLog
      await tx.ticketLog.create({
        data: {
          ticketId: ticketId,
          action: `State changed from state_id=${ticket.stateId} to state_id=${targetStateId} by user_id=${userId}`
        }
      });

      // 6. Log in global AuditLog for sovereign auditing compliance
      await tx.auditLog.create({
        data: {
          entity: 'Ticket',
          entityId: ticketId,
          action: 'STATE_TRANSITION',
          changedBy: userId,
          changes: JSON.stringify({
            fromStateId: ticket.stateId,
            toStateId: targetStateId,
            transitionId: transition.id
          }),
          ipAddress: 'internal-service',
          userAgent: 'TicketStateService'
        }
      });

      // 7. Trigger the external API endpoint if registered on the transition
      if (transition.triggerEndpoint) {
        this.dispatchWebhook(transition.triggerEndpoint, ticketId, targetStateId);
      }

      // 8. Retrieve and return the updated ticket
      const updatedTicket = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: { state: true }
      });

      return updatedTicket;
    });
  }

  /**
   * Dispatches a webhook hook to external URL.
   * Executed asynchronously to avoid blocking the main transaction.
   */
  private async dispatchWebhook(endpoint: string, ticketId: number, targetStateId: number): Promise<void> {
    // Run in a detached promise to prevent blocking execution
    Promise.resolve().then(async () => {
      try {
        console.log(`[Webhook Dispatch] Calling endpoint "${endpoint}" for Ticket ${ticketId} transition to State ${targetStateId}`);
        
        // Example implementation with fetch:
        // await fetch(endpoint, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ ticketId, targetStateId, timestamp: new Date() })
        // });
      } catch (err) {
        console.error(`[Webhook Error] Failed to dispatch webhook to "${endpoint}":`, err);
      }
    });
  }
}
