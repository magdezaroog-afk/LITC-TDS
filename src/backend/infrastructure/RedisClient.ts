import Redis from 'ioredis';

// Singleton for Redis connection (Graceful Fallback mode)
class RedisManager {
  public client: Redis | null = null;
  public pub: Redis | null = null;
  public sub: Redis | null = null;
  public isConnected = false;

  constructor() {
    this.init();
  }

  private init() {
    // Attempt to connect to local Redis (default port 6379)
    try {
      const options = {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
        retryStrategy: (times: number) => {
          // Retry a few times, then fallback to memory
          if (times > 3) {
            console.warn('[Redis] Connection failed after 3 attempts. Falling back to Memory Mode.');
            return null; // Stop retrying
          }
          return Math.min(times * 50, 2000);
        }
      };

      this.client = new Redis(options);
      this.pub = new Redis(options);
      this.sub = new Redis(options);

      this.client.on('ready', () => {
        this.isConnected = true;
        console.log('[Redis] Connected successfully. Distributed caching active.');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        // Suppress massive error spam in dev mode without Redis
      });
    } catch (e) {
      this.isConnected = false;
      console.warn('[Redis] Initialization failed. Falling back to Memory Mode.');
    }
  }

  // Pub/Sub helper
  public publish(channel: string, message: string) {
    if (this.isConnected && this.pub) {
      this.pub.publish(channel, message);
    } else {
      // Fallback: If no Redis, we use Node's internal event loop (works for single-node)
      // We will handle this in the subscriber side directly if needed
    }
  }
}

export const redisManager = new RedisManager();
