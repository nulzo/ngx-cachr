import { computed, Signal } from '@angular/core';
import { cachedResource, CachedResourceOptions, CachedResource } from 'ngx-cachr';

export interface QueryResource<T> extends CachedResource<T> {
  isLoading: Signal<boolean>;
  isError: Signal<boolean>;
  isSuccess: Signal<boolean>;
  isRevalidating: Signal<boolean>;
}

export function createQuery<T>(
  optionsOrFn: CachedResourceOptions<T> | (() => CachedResourceOptions<T>)
): QueryResource<T> {
  const resource = cachedResource(optionsOrFn);

  return {
    ...resource,
    isLoading: computed(() => resource.status() === 'loading'),
    isError: computed(() => resource.status() === 'error'),
    isSuccess: computed(() => resource.status() === 'success'),
    isRevalidating: computed(() => resource.status() === 'revalidating'),
  };
}

