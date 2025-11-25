import { CacheDriver, CacheEntry } from '../core/types';

/**
 * Storage-based implementation for Caching.
 * 
 * @class
 * @implements {CacheDriver}
 */
export class StorageDriver implements CacheDriver {
  constructor(
    private storage: Storage,
    private prefix: string
  ) {}

  private getPrefixedKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const raw = this.storage.getItem(this.getPrefixedKey(key));
      if (!raw) return null;
      return JSON.parse(raw) as CacheEntry<T>;
    } catch (e) {
      console.error('Error reading from storage', e);
      return null;
    }
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      this.storage.setItem(this.getPrefixedKey(key), JSON.stringify(entry));
    } catch (e) {
      console.error('Error writing to storage', e);
    }
  }

  async delete(key: string): Promise<void> {
    this.storage.removeItem(this.getPrefixedKey(key));
  }

  async clear(): Promise<void> {
    // Only clear items with our prefix
    const keysToRemove: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const k = this.storage.key(i);
      if (k && k.startsWith(this.prefix)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => this.storage.removeItem(k));
  }
}
