import { Injectable, Inject, signal, WritableSignal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { 
  CACHE_CONFIG, 
  CacheConfig, 
  CacheEntry, 
  CacheKey, 
  CachedResourceOptions, 
  CacheStrategy 
} from '../core/types';
import { MemoryDriver } from '../drivers/memory.driver';
import { StorageDriver } from '../drivers/storage.driver';
import { serializeKey } from '../utils/key-serializer';

/**
 * The core service responsible for managing the cache layers (Memory and Storage).
 * It handles the execution of caching strategies and coordination between drivers.
 * 
 * Generally, you shouldn't need to inject this service directly. 
 * Use the {@link cachedResource} function instead for a higher-level, reactive API.
 * 
 * @class
 * @providedIn root
 */
@Injectable({
  providedIn: 'root'
})
export class NgxCachrService {
  private memoryDriver: MemoryDriver;
  private storageDriver: StorageDriver | null = null;
  private pendingRequests = new Map<string, Promise<unknown>>();

  constructor(
    @Inject(CACHE_CONFIG) private config: CacheConfig,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.memoryDriver = new MemoryDriver(this.config.memory?.maxEntries);
    
    const storageImpl = this.getStorage();
    if (storageImpl) {
      this.storageDriver = new StorageDriver(storageImpl, this.config.prefix);
      this.checkVersion();
    }
  }

  protected getStorage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? window.localStorage : null;
  }

  private async checkVersion() {
    if (!this.storageDriver) return;
    
    const storage = this.getStorage();
    if (!storage) return;

    const versionKey = `${this.config.prefix}version`;
    const savedVersion = storage.getItem(versionKey);

    if (savedVersion !== String(this.config.version)) {
      // Version mismatch, clear storage
      await this.storageDriver.clear();
      storage.setItem(versionKey, String(this.config.version));
    }
  }

  /**
   * Resolves a resource using the configured caching strategy.
   * 
   * @template T
   * @param {CachedResourceOptions<T>} options - Options defining the resource, key, and strategy.
   * @param {Function} [updateState] - Optional callback to receive state updates (loading, success, error, revalidating).
   * @returns {Promise<T | undefined>} A promise that resolves to the data (if strategy allows immediate return) or undefined.
   * 
   * @example
   * const data = await service.get({
   *   key: 'user:1',
   *   loader: () => fetch('/api/user/1').then(r => r.json()),
   *   strategy: 'swr'
   * });
   */
  async get<T>(
    options: CachedResourceOptions<T>, 
    updateState?: (state: Partial<{ data: T, status: 'loading' | 'success' | 'error' | 'revalidating', error: unknown }>) => void
  ): Promise<T | undefined> {
    const key = serializeKey(options.key);
    const ttl = options.ttl ?? this.config.defaultTtl;
    const strategy = options.strategy ?? this.config.defaultStrategy;

    // Helper to execute the loader and cache result
    const fetchAndCache = async (): Promise<T> => {
      if (this.pendingRequests.has(key)) {
        return this.pendingRequests.get(key) as Promise<T>;
      }

      const promise = (async () => {
        try {
          const data = await options.loader();
          const entry: CacheEntry<T> = {
            data,
            metadata: {
              createdAt: Date.now(),
              ttl,
              tags: options.tags || [],
              version: this.config.version
            }
          };
          
          // Save to memory
          await this.memoryDriver.set(key, entry);
          
          // Save to storage (if allowed)
          // TODO: Check excludeSecure logic if we add that flag to options
          if (this.storageDriver && options.storage !== 'memory') {
            this.storageDriver.set(key, entry);
          }
          
          return data;
        } finally {
          this.pendingRequests.delete(key);
        }
      })();

      this.pendingRequests.set(key, promise);
      return promise;
    };

    // 1. Check Memory
    const memoryEntry = await this.memoryDriver.get<T>(key);
    if (memoryEntry) {
      if (this.isFresh(memoryEntry)) {
         if (strategy !== 'network-first') {
             return memoryEntry.data;
         }
      } else {
        // Stale
        if (strategy === 'swr') {
          // Return stale data immediately, then revalidate
          if (updateState) updateState({ data: memoryEntry.data, status: 'revalidating' });
          
          fetchAndCache().then(newData => {
             if (updateState) updateState({ data: newData, status: 'success' });
          }).catch(err => {
             if (updateState) updateState({ error: err, status: 'error' });
          });
          
          return memoryEntry.data;
        }
      }
    }

    // 2. Check Storage (if not in memory or strategy forces it)
    if (this.storageDriver && options.storage !== 'memory') {
        const storageEntry = await this.storageDriver.get<T>(key);
        if (storageEntry) {
            // Populate memory
            await this.memoryDriver.set(key, storageEntry);

            if (this.isFresh(storageEntry)) {
                if (strategy !== 'network-first') {
                    return storageEntry.data;
                }
            } else {
                if (strategy === 'swr') {
                    if (updateState) updateState({ data: storageEntry.data, status: 'revalidating' });
                    fetchAndCache().then(newData => {
                        if (updateState) updateState({ data: newData, status: 'success' });
                    }).catch(err => {
                        if (updateState) updateState({ error: err, status: 'error' });
                    });
                    return storageEntry.data;
                }
            }
        }
    }

    // 3. Network (if not found or network-first)
    if (updateState) updateState({ status: 'loading' });
    try {
        const data = await fetchAndCache();
        if (updateState) updateState({ data, status: 'success' });
        return data;
    } catch (error) {
        if (updateState) updateState({ error, status: 'error' });
        throw error;
    }
  }

  private isFresh(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.metadata.createdAt < entry.metadata.ttl;
  }

  /**
   * Invalidates a cache entry by removing it from both memory and storage.
   * 
   * @param {CacheKey} key - The key to invalidate.
   * @returns {Promise<void>}
   */
  async invalidate(key: CacheKey): Promise<void> {
    const serializedKey = serializeKey(key);
    await this.memoryDriver.delete(serializedKey);
    if (this.storageDriver) {
      await this.storageDriver.delete(serializedKey);
    }
  }

  /**
   * Manually sets a cache entry.
   * 
   * @template T
   * @param {CacheKey} key - The key to set.
   * @param {T} data - The data to store.
   * @param {number} [ttl] - Optional time-to-live in ms.
   * @returns {Promise<void>}
   */
  async set<T>(key: CacheKey, data: T, ttl?: number): Promise<void> {
    const serializedKey = serializeKey(key);
    const entry: CacheEntry<T> = {
        data,
        metadata: {
            createdAt: Date.now(),
            ttl: ttl ?? this.config.defaultTtl,
            tags: [],
            version: this.config.version
        }
    };
    await this.memoryDriver.set(serializedKey, entry);
    if (this.storageDriver) {
        this.storageDriver.set(serializedKey, entry);
    }
  }

  // TODO: Invalidate by tag
}
