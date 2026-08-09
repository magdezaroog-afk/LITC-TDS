import { prisma } from '../../db/client';

export type EventSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

// Asynchronous Logging Queue (Memory fallback if Redis is down, to prevent blocking Main Thread)
const logQueue: any[] = [];
let isFlushing = false;

// Background Worker: Flushes logs to DB every 5 seconds asynchronously
setInterval(async () => {
  if (isFlushing || logQueue.length === 0) return;
  isFlushing = true;
  
  const batch = logQueue.splice(0, 100); // Take up to 100 events
  
  try {
    await prisma.securityEventLog.createMany({
      data: batch
    });
    // Future integration: if Redis is active, push to Redis Stream instead.
  } catch (err) {
    console.error('[SIEM Background Worker] Failed to bulk insert logs:', err);
    // Re-queue failed logs
    logQueue.push(...batch);
  } finally {
    isFlushing = false;
  }
}, 5000); // 5s interval


export class SIEMLogger {
  
  /**
   * Log an event into the central SIEM asynchronously
   * This is non-blocking (O(1) time complexity) for the main Node.js thread.
   */
  static logEvent(
    eventType: string,
    severity: EventSeverity,
    sourceIp: string | undefined,
    details: any,
    targetUserId?: number
  ) {
    // 1. Push to queue immediately (Non-blocking)
    logQueue.push({
      eventType,
      severity,
      sourceIp: sourceIp || 'UNKNOWN',
      details: typeof details === 'string' ? details : JSON.stringify(details),
      targetUserId,
      createdAt: new Date()
    });
    
    // 2. Trigger critical alerts (if any SOAR rules apply, can be async)
    if (severity === 'CRITICAL') {
      console.error(`[SIEM ALERT - CRITICAL] ${eventType} from IP: ${sourceIp}`);
    }
  }
}
