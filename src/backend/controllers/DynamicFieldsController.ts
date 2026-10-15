import { Request, Response } from 'express';
import { prisma } from '../../db/client';
import { Logger } from '../infrastructure/Logger';
import { redisManager } from '../infrastructure/RedisClient';

import { getCache, setCache, invalidateCache } from '../infrastructure/CacheManager';

export class DynamicFieldsController {
  static async getDynamicFields(req: Request, res: Response): Promise<void> {
    try {
      const cacheKey = 'dynamic_fields';
      if (redisManager.isConnected && redisManager.client) {
        const cached = await redisManager.client.get(cacheKey);
        if (cached) {
          res.json(JSON.parse(cached));
          return;
        }
      } else {
        const memCache = getCache(cacheKey);
        if (memCache) {
          res.json(memCache);
          return;
        }
      }

      const formSchema = await prisma.formSchema.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      if (!formSchema) {
        res.json([]);
        return;
      }

      const fields = JSON.parse(formSchema.fieldsJson);

      if (redisManager.isConnected && redisManager.client) {
        await redisManager.client.setex(cacheKey, 3600, JSON.stringify(fields));
      } else {
        setCache(cacheKey, fields, 3600);
      }

      res.json(fields);
    } catch (error) {
      Logger.error(`[DynamicFieldsController] Error getting fields: ${error}`);
      res.status(500).json({ error: 'Failed to retrieve dynamic fields' });
    }
  }

  static async saveDynamicFields(req: Request, res: Response): Promise<void> {
    try {
      const { fields } = req.body;
      if (!Array.isArray(fields)) {
        res.status(400).json({ error: 'Fields must be an array' });
        return;
      }

      const fieldsJson = JSON.stringify(fields);

      const savedSchema = await prisma.formSchema.create({
        data: {
          name: `GlobalFields_${Date.now()}`,
          fieldsJson,
          isActive: true
        }
      });

      invalidateCache('dynamic_fields');
      Logger.info(`[DynamicFieldsController] Dynamic fields saved successfully, id: ${savedSchema.id}`);
      res.json({ message: 'Dynamic fields saved successfully', data: fields });
    } catch (error) {
      Logger.error(`[DynamicFieldsController] Error saving fields: ${error}`);
      res.status(500).json({ error: 'Failed to save dynamic fields' });
    }
  }
}
