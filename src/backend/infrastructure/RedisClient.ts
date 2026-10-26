import Redis from 'ioredis';
import crypto from 'crypto';

// Singleton for Redis connection (Graceful Fallback mode with Token Revocation Guard)
class RedisManager {
  public client: Redis | null = null;
  public pub: Redis | null = null;
  public sub: Redis | null = null;
  public isConnected = false;

  // In-Memory Fallback for Token Blacklist (when Redis is unavailable in local dev)
  private memoryBlacklist: Map<string, number> = new Map();

  constructor() {
    this.init();
    // Periodically clean up expired memory blacklist entries every 10 minutes
    setInterval(() => this.cleanupMemoryBlacklist(), 10 * 60 * 1000);
  }

  private init() {
    try {
      const options = {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        retryStrategy: (times: number) => {
          if (times > 2) {
            return null; // Stop retrying and fallback to Memory Mode
          }
          return 500;
        }
      };

      this.client = new Redis(options);
      this.pub = new Redis(options);
      this.sub = new Redis(options);

      const handleErr = (_err: any) => {
        this.isConnected = false;
      };

      this.client.on('ready', () => {
        this.isConnected = true;
        console.log('[Redis] Connected successfully. Distributed caching & token revocation active.');
      });

      this.client.on('error', handleErr);
      this.pub.on('error', handleErr);
      this.sub.on('error', handleErr);

      this.client.on('close', () => { this.isConnected = false; });
      this.pub.on('close', () => { this.isConnected = false; });
      this.sub.on('close', () => { this.isConnected = false; });
    } catch (e) {
      this.isConnected = false;
      console.warn('[Redis] Initialization failed. Falling back to Memory Mode.');
    }
  }

  // Pub/Sub helper
  public publish(channel: string, message: string) {
    if (this.isConnected && this.pub) {
      this.pub.publish(channel, message);
    }
  }

  /**
   * Helper to hash tokens with SHA-256 for secure key storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token.trim()).digest('hex');
  }

  /**
   * Blacklist a token immediately upon logout or security compromise
   */
  public async blacklistToken(token: string, expirySeconds: number = 8 * 3600): Promise<void> {
    const hash = this.hashToken(token);
    const ttl = Math.max(1, Math.floor(expirySeconds));

    // 1. In-Memory Blacklist Fallback
    const expiresAt = Date.now() + ttl * 1000;
    this.memoryBlacklist.set(hash, expiresAt);

    // 2. Distributed Redis Storage
    if (this.isConnected && this.client) {
      try {
        await this.client.setex(`bl:${hash}`, ttl, 'revoked');
      } catch (err) {
        console.error('[Redis Blacklist] Failed to save token to Redis:', err);
      }
    }
  }

  /**
   * Check if a token has been revoked / blacklisted
   */
  public async isTokenBlacklisted(token: string): Promise<boolean> {
    const hash = this.hashToken(token);

    // 1. Check in-memory blacklist
    const memExpiry = this.memoryBlacklist.get(hash);
    if (memExpiry) {
      if (Date.now() < memExpiry) {
        return true;
      } else {
        this.memoryBlacklist.delete(hash);
      }
    }

    // 2. Check distributed Redis store
    if (this.isConnected && this.client) {
      try {
        const result = await this.client.get(`bl:${hash}`);
        if (result !== null) {
          return true;
        }
      } catch (err) {
        console.error('[Redis Blacklist] Failed to query Redis:', err);
      }
    }

    return false;
  }

  private cleanupMemoryBlacklist() {
    const now = Date.now();
    for (const [hash, expiresAt] of this.memoryBlacklist.entries()) {
      if (now >= expiresAt) {
        this.memoryBlacklist.delete(hash);
      }
    }
  }
}

export const redisManager = new RedisManager();
