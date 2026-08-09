import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../../db/client';
import { redisManager } from '../infrastructure/RedisClient';

export class UECPMiddleware {
  
  /**
   * 1. API Key & Identity Guard
   */
  public static async authenticate(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.header('X-API-Key') || req.header('Authorization')?.replace('Bearer ', '');
    if (!apiKey) return res.status(401).json({ error: 'Missing API Key' });

    // Validate key exists in external systems
    const system = await prisma.externalSystemRegistry.findFirst({ where: { apiKey, isActive: true } });
    if (!system) return res.status(401).json({ error: 'Invalid or Inactive API Key' });

    (req as any).uecpSystem = system;
    next();
  }

  /**
   * 2. HMAC Signature Validation (Integrity Guard)
   */
  public static validateHMAC(req: Request, res: Response, next: NextFunction) {
    const signature = req.header('X-HMAC-Signature');
    if (!signature) return res.status(403).json({ error: 'Missing X-HMAC-Signature Header' });

    const system = (req as any).uecpSystem;
    if (!system.sharedSecret) return res.status(403).json({ error: 'System lacks HMAC secret' });

    // Recompute signature from raw body
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', system.sharedSecret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(403).json({ error: 'HMAC Signature Mismatch. Payload may have been tampered.' });
    }

    next();
  }

  /**
   * 3. Idempotency Guard (Prevent Duplicate Operations)
   */
  public static async checkIdempotency(req: Request, res: Response, next: NextFunction) {
    const idempotencyKey = req.header('X-Idempotency-Key');
    if (!idempotencyKey) return next(); // Not all requests require it, usually just POST/PUT

    const system = (req as any).uecpSystem;
    const redisKey = `idempotency:${system.id}:${idempotencyKey}`;

    if (redisManager.client && redisManager.isConnected) {
      const exists = await redisManager.client.get(redisKey);
      if (exists) {
        // Already processed, return the cached successful response
        return res.status(200).json(JSON.parse(exists));
      }

      // We intercept res.json to cache the success response before sending it
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Cache for 24 hours
          redisManager.client!.setex(redisKey, 86400, JSON.stringify(body)).catch(console.error);
        }
        return originalJson(body);
      };
    }

    next();
  }
}
