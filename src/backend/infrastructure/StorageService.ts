import * as Minio from 'minio';
import fs from 'fs';
import path from 'path';

export class StorageService {
  private minioClient: Minio.Client | null = null;
  private isConnected = false;
  private localFallbackDir = path.join(process.cwd(), 'uploads');
  private bucketName = process.env.MINIO_BUCKET_NAME || 'litc-attachments';

  constructor() {
    this.init();
  }

  private async init() {
    try {
      if (!process.env.MINIO_ENDPOINT) {
        throw new Error('MINIO_ENDPOINT not set. Falling back to local storage.');
      }
      
      this.minioClient = new Minio.Client({
        endPoint: process.env.MINIO_ENDPOINT,
        port: Number(process.env.MINIO_PORT) || 9000,
        useSSL: process.env.MINIO_USE_SSL === 'true',
        accessKey: process.env.MINIO_ACCESS_KEY || '',
        secretKey: process.env.MINIO_SECRET_KEY || ''
      });

      // Ensure bucket exists
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
      }
      
      this.isConnected = true;
      console.log('[Storage] MinIO Object Storage Connected successfully.');
    } catch (e: any) {
      this.isConnected = false;
      console.warn(`[Storage] MinIO Initialization failed: ${e.message}. Using Local Disk Fallback.`);
      
      if (!fs.existsSync(this.localFallbackDir)) {
        fs.mkdirSync(this.localFallbackDir, { recursive: true });
      }
    }
  }

  /**
   * Uploads a file. Uses MinIO if available, otherwise saves to local disk.
   */
  public async uploadFile(fileName: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
    const uniqueFileName = `${Date.now()}-${fileName}`;
    
    if (this.isConnected && this.minioClient) {
      try {
        await this.minioClient.putObject(this.bucketName, uniqueFileName, fileBuffer, fileBuffer.length, {
          'Content-Type': mimeType
        });
        return `/api/v1/storage/${uniqueFileName}`;
      } catch (err) {
        console.error('[Storage] MinIO upload failed, attempting local fallback.', err);
        return this.localUpload(uniqueFileName, fileBuffer);
      }
    } else {
      return this.localUpload(uniqueFileName, fileBuffer);
    }
  }

  private async localUpload(fileName: string, fileBuffer: Buffer): Promise<string> {
    const filePath = path.join(this.localFallbackDir, fileName);
    await fs.promises.writeFile(filePath, fileBuffer);
    return `/api/v1/storage/local/${fileName}`;
  }
}

export const storageService = new StorageService();
