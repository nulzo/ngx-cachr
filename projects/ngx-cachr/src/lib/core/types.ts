import { InjectionToken, Signal } from "@angular/core";
import { NgxCachrService } from "../services/ngx-cachr.service";

/**
 * The caching strategy to use.
 */
export type CacheStrategy = 'cache-first' | 'network-first' | 'swr';

/**
 * The configuration for the cache.
 */
export interface CacheConfig {
  /**
   * A unique namespace for keys. 
   * Needed when sharing LocalStorage with other apps on the same domain.
   */
  prefix: string;

  /**
   * A global version number. 
   * If this changes (e.g., from 1 to 2), the cache will automatically 
   * flush all persistent state to prevent schema mismatching.
   */
  version: number;

  /**
   * Global default TTL (in milliseconds).
   * Can be overridden per resource.
   */
  defaultTtl: number;

  /**
   * The default caching strategy to use if none is specified in cachedResource.
   */
  defaultStrategy: CacheStrategy;

  /**
   * If true, logs cache hits, misses, and invalidations to the console.
   */
  debug?: boolean;

  /**
   * Configuration specific to the memory cache.
   */
  memory?: {
    /**
     * The maximum number of items to keep in memory.
     * Implements an LRU (Least Recently Used) eviction policy 
     * to prevent memory leaks in large Single Page Apps.
     */
    maxEntries?: number;
  };

  /**
   * Configuration specific to persistent storage (LocalStorage/IndexedDB).
   */
  storage?: {
    /**
     * If true, sensitive data marked as 'secure' won't be written to 
     * persistent storage, only memory.
     */
    excludeSecure?: boolean;
  };
}

/**
 * A provider for the cache config.
 * 
 * @example
 * {
 *   prefix: 'my-app-v1:',
 *   version: 1,
 *   defaultTtl: 300000,
 *   defaultStrategy: 'swr',
 *   debug: false,
 * }
 * 
 * @param {Partial<CacheConfig>} config - The cache config to provide.
 */
export type CacheConfigProvider = Partial<CacheConfig>;

/**
 * Cache key used to resolve or store data from the cache.
 * 
 * @example
 * 'user:123'
 * 'post:456'
 * ['user:123', 'post:456']
 * ['user:123', 'post:456', 'comment:789']
 * 
 * @param {string | number | Array<string | number>} key - The cache key.
 */
export type CacheKey = string | number | Array<string | number>;

/**
 * Metadata for a cached entry.
 * 
 * @example
 * {
 *   createdAt: 1716796800000,
 *   ttl: 300000,
 *   tags: ['user', 'post'],
 *   version: 1,
 * }
 */
export interface CacheMetadata {
  createdAt: number;
  ttl: number;
  tags: string[];
  version: number;
}

/**
 * A cached entry state.
 * 
 * @example
 * {
 *   data: { name: 'John Doe' },
 *   metadata: { createdAt: 1716796800000, ttl: 300000, tags: ['user'], version: 1 },
 * }
 * 
 * @param {T} data - The data to cache.
 * @param {CacheMetadata} metadata - The metadata for the cached entry.
 */
export interface CacheEntry<T> {
  /**
   * The data to cache.
   */
  data: T;

  /**
   * The metadata for the cached entry.
   */
  metadata: CacheMetadata;
}

/**
 * A cache driver.
 * 
 * @example
 * {
 *   get: async (key: string) => Promise<CacheEntry<T> | null>,
 *   set: async (key: string, entry: CacheEntry<T>) => Promise<void>,
 *   delete: async (key: string) => Promise<void>,
 *   clear: async () => Promise<void>,
 * }
 * 
 * @param {string} key - The cache key.
 * @param {CacheEntry<T>} entry - The cached entry.
 */
export interface CacheDriver {
  /**
   * Get a cached entry by key.
   * 
   * @param {string} key - The cache key.
   * @returns {Promise<CacheEntry<T> | null>} The cached entry or null if not found.
   */
  get<T>(key: string): Promise<CacheEntry<T> | null>;

  /**
   * Set a cached entry by key.
   * 
   * @param {string} key - The cache key.
   * @param {CacheEntry<T>} entry - The cached entry.
   */
  set<T>(key: string, entry: CacheEntry<T>): Promise<void>;

  /**
   * Delete a cached entry by key.
   * 
   * @param {string} key - The cache key.
   */
  delete(key: string): Promise<void>;

  /**
   * Clear all cached entries.
   */
  clear(): Promise<void>;
}

/**
 * Options for a cached resource.
 * 
 * @example
 * {
 *   key: 'user:123',
 *   loader: async () => Promise<User>,
 *   ttl: 300000,
 *   strategy: 'swr',
 *   tags: ['user'],
 *   storage: 'memory',
 * }
 */
export interface CachedResourceOptions<T> {
  /**
   * The cache key.
   */
  key: CacheKey;

  /**
   * The loader function to fetch the data.
   */
  loader: () => Promise<T>;

  /**
   * The time-to-live for the cached entry.
   */
  ttl?: number; // Default 5 mins

  /**
   * The caching strategy to use.
   */
  strategy?: 'cache-first' | 'network-first' | 'swr';

  /**
   * The tags for the cached entry.
   */
  tags?: string[];

  /**
   * The storage to use for the cached entry.
   */
  storage?: 'memory' | 'local' | 'session';
}

/**
 * A cached resource.
 * 
 * @example
 * {
 *   data: { name: 'John Doe' },
 *   status: 'idle',
 *   error: null,
 *   mutate: (newData: User) => void,
 *   invalidate: () => void,
 * }
 */
export interface CachedResource<T> {
  /**
   * The data for the cached resource.
   */
  data: Signal<T | undefined>;

  /**
   * The status of the cached resource.
   */
  status: Signal<'idle' | 'loading' | 'revalidating' | 'error' | 'success'>;

  /**
   * The error for the cached resource.
   */
  error: Signal<unknown>;

  /**
   * The function to mutate the cached resource.
   */
  mutate: (newData: T) => void;

  /**
   * The function to invalidate the cached resource.
   */
  invalidate: () => void;
}

/**
 * The injection token for the cache config.
 */
export const CACHE_CONFIG = new InjectionToken<CacheConfig>('CACHE_CONFIG');
