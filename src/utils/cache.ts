export class MemoryCache {
  private cache = new Map<string, { value: any; expiresAt: number | null }>();

  /**
   * Stores a value in the cache.
   * 
   * @param key - The cache key
   * @param value - The value to store
   * @param ttlSeconds - Optional time-to-live in seconds
   */
  set(key: string, value: any, ttlSeconds?: number): void {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Retrieves a value from the cache. Returns null if expired or not found.
   * 
   * @param key - The cache key
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Deletes a specific key.
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clears all keys that start with a specific prefix.
   * Useful for event-driven invalidation.
   */
  clearPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears all items in the cache.
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Gets the current size of the cache.
   */
  size(): number {
    return this.cache.size;
  }
}

// Export a singleton instance
export const uiCache = new MemoryCache();
