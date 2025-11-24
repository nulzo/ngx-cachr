import { CacheDriver, CacheEntry } from '../core/types';

/**
 * In-memory implementation for Caching.
 * 
 * @class
 * @implements {CacheDriver}
 */
export class MemoryDriver implements CacheDriver {
  private cache = new Map<string, CacheEntry<unknown>>();
  private accessLog: string[] = [];

  constructor(private maxEntries: number = 100) { }

  /** @inheritdoc */
  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.cache.get(key);
    if (entry) {
      this.refreshAccess(key);
      return entry as CacheEntry<T>;
    }
    return null;
  }

  /** @inheritdoc */
  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    if (this.cache.has(key)) {
      this.refreshAccess(key);
    } else {
      this.accessLog.push(key);
      if (this.accessLog.length > this.maxEntries) {
        const oldestKey = this.accessLog.shift();
        if (oldestKey) {
          this.cache.delete(oldestKey);
        }
      }
    }
    this.cache.set(key, entry);
  }

  /** @inheritdoc */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    this.accessLog = this.accessLog.filter(k => k !== key);
  }

  /** @inheritdoc */
  async clear(): Promise<void> {
    this.cache.clear();
    this.accessLog = [];
  }

  /**
   * Refresh the access time of a cached entry.
   * 
   * @param key - The cache key.
   */
  private refreshAccess(key: string) {
    this.accessLog = this.accessLog.filter(k => k !== key);
    this.accessLog.push(key);
  }

  /**
   * Returns a snapshot of all keys in memory.
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Returns a snapshot of all entries in memory.
   */
  entries(): [string, CacheEntry<unknown>][] {
    return Array.from(this.cache.entries());
  }
}
