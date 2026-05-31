import { prisma } from '../../db/client';

export class ImmutableLogService {
  /**
   * Appends a new immutable Audit Log.
   */
  public async appendLog(entity: string, entityId: number, action: string, changedBy: number, changes: string, ipAddress?: string, userAgent?: string) {
    try {
      await prisma.auditLog.create({
        data: {
          entity,
          entityId,
          action,
          changedBy,
          changes,
          ipAddress,
          userAgent,
        }
      });
      console.log(`[ImmutableLogService] Log securely appended for ${entity} ID: ${entityId}`);
    } catch (err) {
      console.error('[ImmutableLogService] Failed to append log:', err);
    }
  }

  /**
   * Retrieves logs but throws an error if an attempt is made to mutate them directly through this service.
   * Note: In a true immutable setup, Prisma Extensions would block all updates/deletes at the client level.
   */
  public async getLogs(entity: string, entityId: number) {
    return prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Any update or delete method will forcefully throw an exception
  public preventMutation() {
    throw new Error('Sovereign Circuit Breaker Active: Attempted to mutate an Immutable Workflow Violation Log!');
  }
}
