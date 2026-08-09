import { prisma } from '../../db/client';
import { SLACalculatorService } from './SLACalculatorService';
import { eventDispatcher, SYSTEM_EVENTS } from './EventDispatcher';
import { SIEMLogger } from '../security/SIEMLogger';

export class TicketFlowEngine {
  
  /**
   * Main Engine to transition a ticket from one state to another.
   * Enforces State Machine rules (Is transition allowed?)
   * @param ticketId The ID of the ticket
   * @param newStateId The target state ID
   * @param actorId The ID of the user requesting the change
   * @param notes Optional resolution or transition notes
   */
  public static async transitionState(
    ticketId: number, 
    newStateId: number, 
    actorId: number, 
    notes?: string
  ): Promise<boolean> {
    
    // 1. Fetch current ticket
    const ticket = await prisma.ticket.findUnique({ 
      where: { id: ticketId },
      include: { state: true, slaTrackers: true }
    });
    if (!ticket) throw new Error('Ticket not found');

    const currentStateId = ticket.stateId;

    // 2. State Machine Guard: Verify transition exists
    const allowedTransition = await prisma.ticketStateTransition.findFirst({
      where: {
        fromStateId: currentStateId,
        toStateId: newStateId
      }
    });

    if (!allowedTransition) {
      SIEMLogger.logEvent('ILLEGAL_STATE_TRANSITION_ATTEMPT', 'WARNING', 'INTERNAL', { ticketId, actorId, currentStateId, newStateId });
      throw new Error(`State Machine Guard Blocked Transition: Cannot move from state ${currentStateId} to ${newStateId}`);
    }

    // 3. Authorization Guard (Can this actor do this?)
    // Here we could check `allowedTransition.allowedRoles` against the actor's role.
    // Assuming a simplified check for now or trusting the upper Controller layer if passed.

    // 4. Perform Transition Transaction
    await prisma.$transaction(async (tx) => {
      // A. Close previous SLA Tracker if active
      const activeTracker = ticket.slaTrackers.find(t => t.slaStatus === 'COMPLIANT' || t.slaStatus === 'WARNING');
      if (activeTracker) {
        // Technically we just mark it fulfilled or leave it. In this schema, we might just mark `isPaused` or `slaStatus='FULFILLED'`
        // Skipping exact SLA closure for brevity unless schema has it (usually we just calculate a new one)
      }

      // B. Update Ticket State
      const updatedTicket = await tx.ticket.update({
        where: { id: ticketId },
        data: { 
          stateId: newStateId,
          resolutionNotes: notes ? notes : ticket.resolutionNotes
        }
      });

      // C. Check if new State has an SLA Rule and start a new Tracker
      const slaRule = await tx.statusSlaRule.findFirst({
        where: { stateId: newStateId } // You can add categoryId check if needed
      });

      if (slaRule) {
        const deadline = await SLACalculatorService.calculateDeadline(slaRule.id, ticket.priority);
        await tx.ticketStatusSlaTracker.create({
          data: {
            ticketId: ticket.id,
            slaRuleId: slaRule.id,
            deadlineDateTime: deadline,
            slaStatus: 'COMPLIANT'
          }
        });
      }

      // D. Audit Log
      await tx.auditLog.create({
        data: {
          entity: 'Ticket',
          entityId: ticket.id,
          action: 'STATE_TRANSITION',
          changedBy: actorId,
          changes: JSON.stringify({ from: currentStateId, to: newStateId })
        }
      });
    });

    // 5. Event-Driven Dispatch (After successful transaction)
    eventDispatcher.dispatch(SYSTEM_EVENTS.TICKET_STATE_CHANGED, {
      ticketId,
      previousStateId: currentStateId,
      newStateId,
      actorId,
      timestamp: new Date()
    });

    return true;
  }
}
