import { redisManager } from './RedisClient';

const MEMORY_CACHE: Record<string, { data: any, expires: number }> = {};

export function getCache(key: string): any {
  if (redisManager.isConnected && redisManager.client) return null; // Let redis handle it
  const entry = MEMORY_CACHE[key];
  if (entry && entry.expires > Date.now()) return entry.data;
  return null;
}

export function setCache(key: string, data: any, ttlSeconds: number) {
  if (redisManager.isConnected && redisManager.client) return; // Redis handled it
  MEMORY_CACHE[key] = { data, expires: Date.now() + (ttlSeconds * 1000) };
}

export function invalidateCache(key: string) {
  if (redisManager.isConnected && redisManager.client) {
    redisManager.client.del(key).catch(() => {});
  }
  delete MEMORY_CACHE[key];
}
