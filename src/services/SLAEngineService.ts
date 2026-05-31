import { prisma } from '../db/client';
import { NotFoundError } from '../errors/customErrors';

export class SLAEngineService {
  /**
   * Calculates the SLA deadline for a ticket's current state and category.
   * Updates or creates the corresponding TicketStatusSlaTracker record.
   * 
   * @param ticketId - The ID of the ticket
   * @returns Calculated deadline date
   */
  async calculateSlaDeadline(ticketId: number): Promise<Date> {
    // 1. Retrieve the ticket details
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, stateId: true, categoryId: true, updatedAt: true }
    });

    if (!ticket) {
      throw new NotFoundError(`Ticket with ID ${ticketId} not found.`);
    }

    // 2. Find the applicable SLA rule (category-specific or state-specific fallback)
    let rule = await prisma.statusSlaRule.findFirst({
      where: {
        stateId: ticket.stateId,
        categoryId: ticket.categoryId,
        isActive: true
      }
    });

    if (!rule) {
      // Fallback to rule matching only the state (categoryId is null)
      rule = await prisma.statusSlaRule.findFirst({
        where: {
          stateId: ticket.stateId,
          categoryId: null,
          isActive: true
        }
      });
    }

    if (!rule) {
      throw new NotFoundError(
        `No active SLA rule found for Ticket State ${ticket.stateId} and Category ${ticket.categoryId}.`
      );
    }

    // 3. Compute the deadline based on business hours and holidays
    const deadlineDateTime = await this.addBusinessMinutes(ticket.updatedAt, rule.maxDurationMins);

    // 4. Create or update the TicketStatusSlaTracker
    const existingTracker = await prisma.ticketStatusSlaTracker.findFirst({
      where: {
        ticketId: ticket.id,
        slaRuleId: rule.id
      }
    });

    if (existingTracker) {
      await prisma.ticketStatusSlaTracker.update({
        where: { id: existingTracker.id },
        data: {
          deadlineDateTime: deadlineDateTime,
          slaStatus: 'COMPLIANT',
          breachedAt: null,
          isPaused: false
        }
      });
    } else {
      await prisma.ticketStatusSlaTracker.create({
        data: {
          ticketId: ticket.id,
          slaRuleId: rule.id,
          deadlineDateTime: deadlineDateTime,
          slaStatus: 'COMPLIANT',
          isPaused: false
        }
      });
    }

    return deadlineDateTime;
  }

  /**
   * Adds working minutes to a start date, skipping non-working hours, weekends, and holidays.
   * Utilizes UTC date components for database consistency.
   * 
   * @param startDate - Starting date and time
   * @param minutesToAdd - Number of business minutes to add
   */
  async addBusinessMinutes(startDate: Date, minutesToAdd: number): Promise<Date> {
    const businessHours = await prisma.businessHours.findMany();
    const holidays = await prisma.holiday.findMany();

    // Map holidays into quick-lookup date strings
    const holidayDates = new Set(
      holidays.map(h => {
        const d = new Date(h.holidayDate);
        return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      })
    );

    // Map business hours by dayOfWeek (JS getUTCDay returns 0 for Sunday to 6 for Saturday)
    const bhMap = new Map<number, typeof businessHours[0]>();
    businessHours.forEach(bh => {
      bhMap.set(bh.dayOfWeek, bh);
    });

    let currentDate = new Date(startDate.getTime());
    let remainingMinutes = minutesToAdd;

    const isHoliday = (date: Date): boolean => {
      const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
      return holidayDates.has(key);
    };

    while (remainingMinutes > 0) {
      const day = currentDate.getUTCDay();
      const bh = bhMap.get(day);

      // If day is not a workday or matches a holiday, skip the entire day
      if (!bh || !bh.isWorkDay || isHoliday(currentDate)) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        currentDate.setUTCHours(0, 0, 0, 0); // Reset to start of next UTC day
        continue;
      }

      // Parse start and end business times (e.g. "08:00", "17:00")
      const [startH, startM] = bh.startTime.split(':').map(Number);
      const [endH, endM] = bh.endTime.split(':').map(Number);

      const startWork = new Date(currentDate.getTime());
      startWork.setUTCHours(startH, startM, 0, 0);

      const endWork = new Date(currentDate.getTime());
      endWork.setUTCHours(endH, endM, 0, 0);

      // Adjust current pointer to start of working hours if currently before it
      if (currentDate.getTime() < startWork.getTime()) {
        currentDate = startWork;
      }

      // If pointer is already past working hours, jump to next day
      if (currentDate.getTime() >= endWork.getTime()) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        currentDate.setUTCHours(0, 0, 0, 0);
        continue;
      }

      // Compute remaining business minutes for the current day
      const workMinsLeftToday = (endWork.getTime() - currentDate.getTime()) / 60000;

      if (remainingMinutes <= workMinsLeftToday) {
        currentDate = new Date(currentDate.getTime() + remainingMinutes * 60000);
        remainingMinutes = 0; // Completed
      } else {
        remainingMinutes -= workMinsLeftToday;
        // Jump to start of next day
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        currentDate.setUTCHours(0, 0, 0, 0);
      }
    }

    return currentDate;
  }
}
