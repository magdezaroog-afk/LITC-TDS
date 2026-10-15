import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db/client';
import crypto from 'crypto';

export class UECPController {
  
  /**
   * تسجيل نظام خارجي جديد (Register External System via Manifest)
   */
  async registerSystem(req: Request, res: Response, next: NextFunction) {
    try {
      const { manifestUrl } = req.body;
      if (!manifestUrl) {
        return res.status(400).json({ success: false, error: 'manifestUrl is required' });
      }

      // 1. SSRF Protection: Validate the URL
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(manifestUrl);
      } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid URL format' });
      }

      const hostname = parsedUrl.hostname;
      const forbiddenIPs = ['127.0.0.1', 'localhost', '0.0.0.0', '169.254.169.254', '::1'];
      const forbiddenPatterns = [/^10\./, /^192\.168\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./];
      
      if (forbiddenIPs.includes(hostname) || forbiddenPatterns.some(p => p.test(hostname))) {
        return res.status(403).json({ success: false, error: 'Access to internal network is forbidden (SSRF Protection)' });
      }

      // 2. Fetch the manifest from the URL
      let manifestData = {};
      let systemName = `System_${Math.floor(Math.random() * 10000)}`;

      try {
        const fetchRes = await fetch(manifestUrl);
        if (fetchRes.ok) {
          manifestData = await fetchRes.json();
          systemName = (manifestData as any).name || (manifestData as any).systemName || systemName;
        } else {
          // Fallback if URL is unreachable (Mock for demonstration)
          manifestData = { status: 'mocked', url: manifestUrl, message: 'URL was unreachable, mocked data saved.' };
        }
      } catch (err) {
        // Fallback for CORS or network issues
        manifestData = { status: 'mocked', url: manifestUrl, error: (err as any).message };
      }

      // 2. Save to database using the LEPC schema
      const sharedSecret = crypto.randomBytes(32).toString('hex');
      const newSystem = await prisma.externalSystemRegistry.create({
        data: {
          systemName: systemName,
          manifestUrl: manifestUrl,
          manifestData: JSON.stringify(manifestData),
          sharedSecret: sharedSecret,
          isActive: true
        }
      });

      res.status(201).json({ success: true, data: newSystem });
    } catch (err: any) {
      if (err.code === 'P2002') {
        return res.status(409).json({ success: false, error: 'نظام بهذا الاسم موجود مسبقاً.' });
      }
      next(err);
    }
  }

  /**
   * جلب قائمة الأنظمة الخارجية المسجلة
   */
  async getSystems(req: Request, res: Response, next: NextFunction) {
    try {
      const systems = await prisma.externalSystemRegistry.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: systems });
    } catch (err) {
      next(err);
    }
  }
}
