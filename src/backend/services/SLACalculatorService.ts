import { prisma } from '../../db/client';

export class SLACalculatorService {
  /**
   * Calculates the exact deadline date/time for a ticket entering a new state.
   */
  public static async calculateDeadline(
    slaRuleId: number,
    priority: string,
    createdAt: Date = new Date()
  ): Promise<Date> {
    const rule = await prisma.statusSlaRule.findUnique({ where: { id: slaRuleId } });
    if (!rule) throw new Error('SLA Rule not found');

    const durationMins = rule.maxDurationMins;

    // 1. Absolute Calculation for Critical Priorities (24/7)
    if (priority === 'CRITICAL' || priority === 'URGENT') {
      const deadline = new Date(createdAt.getTime() + durationMins * 60000);
      return deadline;
    }

    // 2. Business Hours Calculation for Normal Tickets
    return await this.calculateBusinessHoursDeadline(createdAt, durationMins);
  }

  private static async calculateBusinessHoursDeadline(start: Date, minsToAdd: number): Promise<Date> {
    // Fetch Business Hours (0=Sun, 1=Mon, ...)
    const businessHours = await prisma.businessHours.findMany();
    // Fetch Holidays
    const holidays = await prisma.holiday.findMany();
    const holidayDates = new Set(holidays.map(h => h.holidayDate.toISOString().split('T')[0]));

    let currentDateTime = new Date(start.getTime());
    let remainingMins = minsToAdd;

    while (remainingMins > 0) {
      const currentDay = currentDateTime.getDay();
      const currentDateString = currentDateTime.toISOString().split('T')[0];

      // Check if today is a Holiday
      if (holidayDates.has(currentDateString)) {
        // Skip to next day 00:00
        currentDateTime.setDate(currentDateTime.getDate() + 1);
        currentDateTime.setHours(0, 0, 0, 0);
        continue;
      }

      // Check if today is a working day
      const todayHours = businessHours.find(bh => bh.dayOfWeek === currentDay && bh.isWorkDay);
      if (!todayHours) {
        // Skip to next day
        currentDateTime.setDate(currentDateTime.getDate() + 1);
        currentDateTime.setHours(0, 0, 0, 0);
        continue;
      }

      // Parse start and end times (e.g., "09:00", "17:00")
      const [startHour, startMin] = todayHours.startTime.split(':').map(Number);
      const [endHour, endMin] = todayHours.endTime.split(':').map(Number);

      const workStart = new Date(currentDateTime);
      workStart.setHours(startHour, startMin, 0, 0);

      const workEnd = new Date(currentDateTime);
      workEnd.setHours(endHour, endMin, 0, 0);

      // If current time is before work starts, advance to work start
      if (currentDateTime < workStart) {
        currentDateTime = new Date(workStart);
      }

      // If current time is after work ends, advance to next day
      if (currentDateTime >= workEnd) {
        currentDateTime.setDate(currentDateTime.getDate() + 1);
        currentDateTime.setHours(0, 0, 0, 0);
        continue;
      }

      // Calculate available minutes today
      const availableMinsToday = Math.floor((workEnd.getTime() - currentDateTime.getTime()) / 60000);

      if (remainingMins <= availableMinsToday) {
        // We can finish within today
        currentDateTime = new Date(currentDateTime.getTime() + remainingMins * 60000);
        remainingMins = 0;
      } else {
        // Consume rest of today, jump to next day
        remainingMins -= availableMinsToday;
        currentDateTime.setDate(currentDateTime.getDate() + 1);
        currentDateTime.setHours(0, 0, 0, 0);
      }
    }

    return currentDateTime;
  }
}
