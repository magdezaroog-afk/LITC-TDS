import { prisma } from '../../db/client';
import { NotificationEngine } from './NotificationEngine';
import { TicketStateService } from '../../services/TicketStateService';

export class SLARoutingEngine {
  private ticketStateService = new TicketStateService();

  /**
   * Initializes SLA Tracking and assigns the ticket to a department based on the IssueCategory.
   */
  public async initializeSLAAndRouting(ticketId: number, categoryId: number, departmentName: string): Promise<void> {
    try {
      console.log(`[SLARoutingEngine] Auto-routing ticket ${ticketId} to department ${departmentName}`);
      
      const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
      if (!ticket) return;

      // Ensure the department exists
      let dept = await prisma.department.findUnique({ where: { name: departmentName } });
      if (!dept) {
        let division = await prisma.companyDivision.findFirst();
        if (!division) division = await prisma.companyDivision.create({ data: { name: 'Main Division' } });
        dept = await prisma.department.create({ data: { name: departmentName, divisionId: division.id } });
      }

      // Base SLA time from Category or default to 60 mins
      const category = await prisma.issueCategory.findUnique({ where: { id: categoryId } });
      const maxDurationMins = category ? 60 : 120; // Example logic

      // Find an SLA rule for OPEN state, or create one
      let slaRule = await prisma.statusSlaRule.findFirst({
        where: { stateId: ticket.stateId }
      });

      if (!slaRule) {
        slaRule = await prisma.statusSlaRule.create({
          data: {
            stateId: ticket.stateId,
            maxDurationMins,
            actionType: 'ESCALATE'
          }
        });
      }

      // Create Tracker
      const deadlineDateTime = new Date(Date.now() + maxDurationMins * 60000);
      await prisma.ticketStatusSlaTracker.create({
        data: {
          ticketId,
          slaRuleId: slaRule.id,
          deadlineDateTime,
          slaStatus: 'COMPLIANT'
        }
      });

      // Notify Department Head
      NotificationEngine.broadcast({
        type: 'INFO',
        message: `تم توجيه تذكرة جديدة (#${ticketId}) بموعد استلام أقصاه ${maxDurationMins} دقيقة.`,
        targetDepartment: departmentName
      });
      
    } catch (err) {
      console.error('[SLARoutingEngine] Error initializing SLA:', err);
    }
  }
}
