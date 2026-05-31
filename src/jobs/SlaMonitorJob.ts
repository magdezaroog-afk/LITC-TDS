import { prisma } from '../db/client';
import { TicketStateService } from '../services/TicketStateService';

export class SlaMonitorJob {
  private timer: NodeJS.Timeout | null = null;
  private ticketStateService = new TicketStateService();

  /**
   * Starts the background monitor polling.
   * 
   * @param intervalMs - Polling interval in milliseconds (default: 60,000 ms / 1 minute)
   */
  start(intervalMs: number = 60000): void {
    if (this.timer) return;

    console.log(`[SLA Monitor] Starting SLA breach monitoring background job (Interval: ${intervalMs} ms)...`);
    this.timer = setInterval(async () => {
      try {
        await this.checkSlaBreaches();
      } catch (err) {
        console.error('[SLA Monitor] Error running breach checks:', err);
      }
    }, intervalMs);
  }

  /**
   * Stops the background monitor.
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[SLA Monitor] Stopped background job.');
    }
  }

  /**
   * Scans for compliant trackers whose deadlines have expired,
   * updates them to BREACHED, and executes escalation rules.
   */
  async checkSlaBreaches(): Promise<void> {
    const now = new Date();

    // 1. Find all active trackers that have exceeded their deadline
    const breachedTrackers = await prisma.ticketStatusSlaTracker.findMany({
      where: {
        slaStatus: 'COMPLIANT',
        deadlineDateTime: {
          lte: now
        },
        isPaused: false
      },
      include: {
        slaRule: true,
        ticket: true
      }
    });

    if (breachedTrackers.length === 0) {
      return;
    }

    console.log(`[SLA Monitor] Found ${breachedTrackers.length} breached SLA trackers. Initiating escalations...`);

    // Retrieve or create a System User to execute system transitions
    let systemUser = await prisma.user.findFirst({
      where: { username: 'system' }
    });

    if (!systemUser) {
      // Find any first user as fallback, or create a system user
      systemUser = await prisma.user.findFirst();
      if (!systemUser) {
        // Create mock system user
        const defaultRole = await prisma.role.findFirst() || await prisma.role.create({ data: { name: 'SYSTEM_ROLE' } });
        systemUser = await prisma.user.create({
          data: {
            username: 'system',
            email: 'system@litc-ts.com',
            fullName: 'System Engine',
            roleId: defaultRole.id,
            resetToken: 'system_token_123',
            updatedAt: new Date()
          }
        });
      }
    }

    for (const tracker of breachedTrackers) {
      try {
        await prisma.$transaction(async (tx) => {
          // A. Mark SLA tracker as breached
          await tx.ticketStatusSlaTracker.update({
            where: { id: tracker.id },
            data: {
              slaStatus: 'BREACHED',
              breachedAt: now
            }
          });

          // B. Register the breach action in TicketLog
          await tx.ticketLog.create({
            data: {
              ticketId: tracker.ticketId,
              action: `SLA BREACH: State SLA Rule ID ${tracker.slaRuleId} breached. Deadline was ${tracker.deadlineDateTime.toISOString()}`
            }
          });

          // C. Check escalation action rules
          const rule = tracker.slaRule;
          if (rule.actionType === 'NOTIFY' || rule.actionType === 'ESCALATE') {
            // Queue Notification
            await tx.notificationQueue.create({
              data: {
                type: 'EMAIL',
                recipient: 'admin@litc-ts.com',
                subject: `SLA Breach Alert: Ticket #${tracker.ticketId}`,
                body: `Ticket #${tracker.ticketId} has breached the SLA for State ID ${rule.stateId} at ${now.toISOString()}.`,
                status: 'PENDING'
              }
            });

            // SSE Live Broadcast
            const { NotificationEngine } = require('../services/NotificationEngine');
            NotificationEngine.broadcast({
              type: 'DANGER',
              message: `تنبيه: التذكرة #${tracker.ticketId} تجاوزت وقت الاستجابة المسموح (SLA Breach)!`,
              targetRole: 'IT_Admin' // Can also broadcast to Department Head if available
            });
          }

          // D. If action requires ESCALATE, trigger state transition automatically
          if (rule.actionType === 'ESCALATE') {
            // Find a valid transition to an escalation state
            let transition = await tx.ticketStateTransition.findFirst({
              where: {
                fromStateId: tracker.ticket.stateId,
                toState: {
                  name: {
                    contains: 'ESCALAT'
                  }
                }
              },
              include: { toState: true }
            });

            // Fallback: use first available transition from this state
            if (!transition) {
              transition = await tx.ticketStateTransition.findFirst({
                where: { fromStateId: tracker.ticket.stateId },
                include: { toState: true }
              });
            }

            if (transition) {
              console.log(`[SLA Monitor] Automatically escalating Ticket ${tracker.ticketId} from State ${tracker.ticket.stateId} to State ${transition.toStateId}`);
              
              // Run state transition using TicketStateService inside this transaction thread
              await this.ticketStateService.executeTransition(
                tracker.ticketId,
                systemUser.id,
                transition.toStateId,
                tracker.ticket.version
              );
            } else {
              console.warn(`[SLA Monitor] No valid escalation or fallback transition found for Ticket ${tracker.ticketId} from State ${tracker.ticket.stateId}`);
            }
          }
        });

        console.log(`[SLA Monitor] Escalation processed successfully for Ticket ${tracker.ticketId}`);
      } catch (err) {
        console.error(`[SLA Monitor] Failed to escalate Ticket ${tracker.ticketId}:`, err);
      }
    }
  }
}
