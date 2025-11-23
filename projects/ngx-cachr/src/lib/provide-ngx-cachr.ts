import { EnvironmentProviders, makeEnvironmentProviders, Provider } from '@angular/core';
import { CACHE_CONFIG, CacheConfig, CacheConfigProvider } from './core/types';
import { NgxCachrService } from './services/ngx-cachr.service';

const DEFAULT_CONFIG: CacheConfig = {
  prefix: 'ngx-cachr:',
  version: 1,
  defaultTtl: 300000, // 5 minutes
  defaultStrategy: 'swr',
  debug: false,
  memory: {
    maxEntries: 100
  },
  storage: {
    excludeSecure: false
  }
};

/**
 * Sets up the ngx-cachr library in the application.
 * Should be called in the `providers` array of `app.config.ts` or `main.ts`.
 * 
 * @param {CacheConfigProvider} config - Global configuration for the cache.
 * @returns {EnvironmentProviders}
 * 
 * @example
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideNgxCachr({
 *       defaultTtl: 60000,
 *       debug: true
 *     })
 *   ]
 * });
 */
export function provideNgxCachr(config: CacheConfigProvider): EnvironmentProviders {
  const finalConfig: CacheConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    memory: { ...DEFAULT_CONFIG.memory, ...config.memory },
    storage: { ...DEFAULT_CONFIG.storage, ...config.storage }
  };

  return makeEnvironmentProviders([
    {
      provide: CACHE_CONFIG,
      useValue: finalConfig
    },
    NgxCachrService
  ]);
}
