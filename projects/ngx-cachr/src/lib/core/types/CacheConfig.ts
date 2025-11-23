import { InjectionToken } from "@angular/core";

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
   * The default caching strategy to use if none is specified in useCachedResource.
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
 * The injection token for the cache config.
 */
export const CACHE_CONFIG = new InjectionToken<CacheConfig>('CACHE_CONFIG');
