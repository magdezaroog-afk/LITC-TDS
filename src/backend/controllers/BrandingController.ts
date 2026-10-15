import { Request, Response } from 'express';
import { prisma } from '../../db/client';

/* ─────────────────────────────────────────────────────────────
   BrandingController — SaaS White-Label API
   GET  /api/v1/branding          → public (any authenticated user)
   PUT  /api/v1/branding          → admin only
   POST /api/v1/branding/logo     → admin only (upload URL)
   ───────────────────────────────────────────────────────────── */

const BRANDING_ID = 1; // Singleton row (one config per tenant)

export const getBranding = async (_req: Request, res: Response): Promise<void> => {
  try {
    let config = await (prisma as unknown as { brandingConfig: { findFirst: () => Promise<any>; update: (args: any) => Promise<any> } }).brandingConfig.findFirst();
    if (!config) {
      // Auto-seed defaults on first request
      config = await (prisma as unknown as { brandingConfig: { create: (args: unknown) => Promise<unknown> } }).brandingConfig.create({
        data: {
          id: BRANDING_ID,
          orgName: 'TdS',
          lightPrimary: '#6366f1',
          darkPrimary: '#00a3ff',
          fontFamily: 'Cairo',
        },
      });
    } else if (config.orgName === 'LITC System') {
      try {
        config = await (prisma as any).brandingConfig.update({
          where: { id: config.id },
          data: { orgName: 'TdS' }
        });
      } catch {}
    }
    res.json(config);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to fetch branding config', detail: message });
  }
};

export const updateBranding = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orgName, orgLogo, lightPrimary, darkPrimary, headerBg, fontFamily } = req.body as {
      orgName?: string;
      orgLogo?: string;
      lightPrimary?: string;
      darkPrimary?: string;
      headerBg?: string;
      fontFamily?: string;
    };

    const config = await (prisma as unknown as {
      brandingConfig: {
        upsert: (args: unknown) => Promise<unknown>
      }
    }).brandingConfig.upsert({
      where: { id: BRANDING_ID },
      update: {
        ...(orgName !== undefined && { orgName }),
        ...(orgLogo !== undefined && { orgLogo }),
        ...(lightPrimary !== undefined && { lightPrimary }),
        ...(darkPrimary !== undefined && { darkPrimary }),
        ...(headerBg !== undefined && { headerBg }),
        ...(fontFamily !== undefined && { fontFamily }),
      },
      create: {
        id: BRANDING_ID,
        orgName:      orgName      ?? 'LITC System',
        orgLogo:      orgLogo      ?? null,
        lightPrimary: lightPrimary ?? '#6366f1',
        darkPrimary:  darkPrimary  ?? '#00a3ff',
        headerBg:     headerBg     ?? null,
        fontFamily:   fontFamily   ?? 'Inter',
      },
    });

    res.json({ success: true, config });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to update branding config', detail: message });
  }
};
