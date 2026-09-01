import { Request, Response, NextFunction } from 'express';
import { storageService } from '../infrastructure/StorageService';
import path from 'path';
import fs from 'fs';
import { Logger } from '../infrastructure/Logger';

export class StorageController {
  
  /**
   * POST /api/v1/storage/upload
   * Accepts JSON { fileName, fileData (base64), mimeType } or raw binary
   */
  static async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fileName, fileData, mimeType } = req.body;

      if (!fileName || !fileData) {
        res.status(400).json({ success: false, error: 'fileName and fileData (base64) are required' });
        return;
      }

      // Strip data URL header if present (e.g. data:image/png;base64,...)
      const base64Content = fileData.includes(';base64,') 
        ? fileData.split(';base64,').pop() 
        : fileData;

      const fileBuffer = Buffer.from(base64Content, 'base64');
      const resolvedMime = mimeType || 'application/octet-stream';

      const fileUrl = await storageService.uploadFile(fileName, fileBuffer, resolvedMime);

      res.status(201).json({
        success: true,
        fileUrl,
        url: fileUrl,
        fileName,
        size: fileBuffer.length
      });
    } catch (err) {
      Logger.error('[StorageController] upload error:', err);
      next(err);
    }
  }

  /**
   * GET /api/v1/storage/local/:fileName
   * Serves local fallback files securely
   */
  static async serveLocal(req: Request, res: Response): Promise<void> {
    try {
      const { fileName } = req.params;
      const sanitized = path.basename(fileName);
      const filePath = path.join(process.cwd(), 'uploads', sanitized);

      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      res.sendFile(filePath);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve file' });
    }
  }
}
