import { PrismaClient, Interface } from '@prisma/client';
import NodeCache from 'node-cache';

const prisma = new PrismaClient();
const cache = new NodeCache({ stdTTL: 30 }); // 30 seconds caching

export class InterfaceService {
  static async listInterfaces(departmentId?: number, interfaceType?: string): Promise<Interface[]> {
    const cacheKey = `interfaces_${departmentId || 'all'}_${interfaceType || 'all'}`;
    const cached = cache.get<Interface[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const filters: any = {};
    if (departmentId) filters.departmentId = departmentId;
    if (interfaceType) filters.interfaceType = interfaceType;

    const interfaces = await prisma.interface.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' }
    });

    cache.set(cacheKey, interfaces);
    return interfaces;
  }

  static async createInterface(payload: any): Promise<Interface> {
    if (!payload.departmentId) {
      throw new Error('departmentId is required');
    }

    const newInterface = await prisma.interface.create({
      data: {
        name: payload.name,
        interfaceType: payload.interfaceType || 'FUNCTIONAL',
        roleType: payload.roleType,
        departmentId: parseInt(payload.departmentId),
        configJson: payload.configJson ? JSON.stringify(payload.configJson) : null
      }
    });

    cache.flushAll(); // Invalidate cache
    return newInterface;
  }

  static async updateInterface(id: string, payload: any): Promise<Interface> {
    const updated = await prisma.interface.update({
      where: { id },
      data: {
        name: payload.name,
        interfaceType: payload.interfaceType,
        roleType: payload.roleType,
        departmentId: payload.departmentId ? parseInt(payload.departmentId) : undefined,
        configJson: payload.configJson ? JSON.stringify(payload.configJson) : undefined
      }
    });

    cache.flushAll();
    return updated;
  }

  static async deleteInterface(id: string): Promise<void> {
    await prisma.interface.delete({
      where: { id }
    });
    cache.flushAll();
  }
}
