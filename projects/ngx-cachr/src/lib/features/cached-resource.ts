import { inject, signal, computed, Signal, effect, DestroyRef, untracked } from '@angular/core';
import { CachedResource, CachedResourceOptions } from '../core/types';
import { NgxCachrService } from '../services/ngx-cachr.service';
import { serializeKey } from '../utils/key-serializer';

/**
 * The primary resource for fetching and caching data.
 * returns a reactive {@link CachedResource} object containing signals for data, status, and error.
 * 
 * Supports reactive dependencies by passing a function that returns the options.
 * When dependencies change (any signal accessed within the function), the resource automatically re-fetches.
 * 
 * @template T The type of the data being fetched.
 * @param {CachedResourceOptions<T> | Function} optionsOrFn - Configuration object or a function returning one.
 * @returns {CachedResource<T>} A reactive object with `data`, `status`, and `error` signals.
 * 
 * @example
 * // Simple usage
 * const user = cachedResource({
 *   key: 'user:1',
 *   loader: () => fetch('/api/user/1').then(r => r.json()),
 *   ttl: 60000 // 1 minute
 * });
 * 
 * // Template usage
 * // <div>{{ user.data()?.name }}</div>
 * 
 * @example
 * // Reactive usage (dependent query)
 * const userId = signal(1);
 * 
 * const user = cachedResource(() => ({
 *   key: ['user', userId()], // Updates when userId changes
 *   loader: () => fetch(`/api/user/${userId()}`).then(r => r.json())
 * }));
 * 
 * // Trigger re-fetch
 * userId.set(2);
 */
export function cachedResource<T>(
  optionsOrFn: CachedResourceOptions<T> | (() => CachedResourceOptions<T>)
): CachedResource<T> {
  const service = inject(NgxCachrService);
  const destroyRef = inject(DestroyRef);

  const data = signal<T | undefined>(undefined);
  const status = signal<'idle' | 'loading' | 'revalidating' | 'error' | 'success'>('idle');
  const error = signal<unknown>(null);

  // Track the active key to prevent race conditions (stale responses overwriting new ones)
  let activeKey: string | null = null;

  const resolve = async (opts: CachedResourceOptions<T>) => {
    const key = serializeKey(opts.key);
    activeKey = key;

    try {
      const result = await service.get<T>(opts, (state) => {
        if (activeKey !== key) return; // Ignore updates from stale requests
        if (state.status) status.set(state.status);
        if (state.data !== undefined) data.set(state.data);
        if (state.error !== undefined) error.set(state.error);
      });
      
      // If the service returned data immediately (e.g. cache hit), set it
      if (activeKey === key && result !== undefined) {
        data.set(result);
        // If we are revalidating (SWR), the callback above handles the status
        // If we just got data from cache and it's fresh, we are success
        // But status() might be 'revalidating' if SWR kicked in synchronously (unlikely with promise, but possible logic)
        // Actually service.get returns data, and if SWR, it ALSO calls updateState('revalidating').
        // We rely on updateState for status changes mostly.
        // But if it returns data and didn't call updateState (e.g. fresh cache hit), we set success.
        if (status() === 'idle' || status() === 'loading') {
            status.set('success');
        }
      }
    } catch (err) {
      if (activeKey === key) {
        error.set(err);
        status.set('error');
      }
    }
  };

  // Handle reactivity if a function is passed
  if (typeof optionsOrFn === 'function') {
    effect(() => {
      const opts = optionsOrFn();
      untracked(() => resolve(opts));
    });
  } else {
    resolve(optionsOrFn);
  }

  const mutate = (newData: T) => {
    data.set(newData);
    const opts = typeof optionsOrFn === 'function' ? optionsOrFn() : optionsOrFn;
    service.set(opts.key, newData, opts.ttl);
  };

  const invalidate = () => {
    const opts = typeof optionsOrFn === 'function' ? optionsOrFn() : optionsOrFn;
    service.invalidate(opts.key).then(() => {
        // Only refetch if the key hasn't changed in the meantime
        const currentKey = serializeKey(opts.key);
        if (activeKey === currentKey) {
            resolve(opts); 
        }
    });
  };

  return {
    data: data.asReadonly(),
    status: status.asReadonly(),
    error: error.asReadonly(),
    mutate,
    invalidate
  };
}
