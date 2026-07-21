import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// UECP Manifest Zod Schema
const uecpCapabilitiesSchema = z.object({
  hasUserMapping: z.boolean(),
  hasWebhooks: z.boolean()
});

const uecpManifestSchema = z.object({
  systemName: z.string(),
  displayMode: z.string(),
  capabilities: uecpCapabilitiesSchema,
  uiSchema: z.any() // Can be refined further based on requirements
});

export class UECPValidatorService {
  /**
   * Registers a new external system by fetching its manifest and validating it against UECP standards.
   */
  static async registerExternalSystem(req: Request, res: Response, next: NextFunction) {
    try {
      const { manifestUrl } = req.body;
      if (!manifestUrl) {
        return res.status(400).json({ error: 'manifestUrl is required' });
      }

      // Fetch the manifest
      const response = await fetch(manifestUrl);
      if (!response.ok) {
        return res.status(400).json({ error: `Failed to fetch manifest from ${manifestUrl}` });
      }

      const manifestData = await response.json();

      // Validate against the Zod schema
      const validationResult = uecpManifestSchema.safeParse(manifestData);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Manifest failed UECP validation',
          details: validationResult.error.errors
        });
      }

      const validatedData = validationResult.data;

      // Upsert into ExternalSystemRegistry
      const registryEntry = await prisma.externalSystemRegistry.upsert({
        where: { systemName: validatedData.systemName },
        update: {
          manifestUrl,
          manifestData: JSON.stringify(validatedData),
          isActive: true
        },
        create: {
          systemName: validatedData.systemName,
          manifestUrl,
          manifestData: JSON.stringify(validatedData),
          isActive: true
        }
      });

      res.status(200).json({
        success: true,
        message: 'External system registered successfully',
        data: registryEntry
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Returns all active external systems for the UI Builder.
   */
  static async getAllSystems(req: Request, res: Response, next: NextFunction) {
    try {
      const systems = await prisma.externalSystemRegistry.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json({
        success: true,
        data: systems
      });
    } catch (err) {
      next(err);
    }
  }
}
