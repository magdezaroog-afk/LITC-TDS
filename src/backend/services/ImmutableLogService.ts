import { prisma } from '../../db/client';

export class ImmutableLogService {
  /**
   * Appends a new immutable Audit Log statically or via instance.
   * Records who performed what action, on which entity, and from which IP.
   */
  public static async appendLog(
    entity: string, 
    entityId: number, 
    action: string, 
    changedBy: number, 
    changes: string | Record<string, any>, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<void> {
    try {
      const changesStr = typeof changes === 'string' ? changes : JSON.stringify(changes);
      await prisma.auditLog.create({
        data: {
          entity,
          entityId,
          action,
          changedBy: changedBy || 1,
          changes: changesStr,
          ipAddress: ipAddress || 'INTERNAL',
          userAgent: userAgent || 'NEXUS_CORE',
        }
      });
      console.log(`[ImmutableLogService] Audit Log securely appended: ${action} on ${entity} #${entityId} by User #${changedBy}`);
    } catch (err) {
      console.error('[ImmutableLogService] Failed to append immutable audit log:', err);
    }
  }

  // Instance method for backwards compatibility
  public async appendLog(
    entity: string, 
    entityId: number, 
    action: string, 
    changedBy: number, 
    changes: string | Record<string, any>, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<void> {
    return ImmutableLogService.appendLog(entity, entityId, action, changedBy, changes, ipAddress, userAgent);
  }

  /**
   * Retrieves logs for a specific entity
   */
  public static async getLogs(entity: string, entityId: number) {
    return prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' }
    });
  }

  public async getLogs(entity: string, entityId: number) {
    return ImmutableLogService.getLogs(entity, entityId);
  }

  // Any update or delete method will forcefully throw an exception
  public preventMutation() {
    throw new Error('Sovereign Circuit Breaker Active: Attempted to mutate an Immutable Workflow Violation Log!');
  }
}

export const immutableLogService = new ImmutableLogService();
