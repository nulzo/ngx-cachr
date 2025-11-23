import { CacheKey } from '../core/types';

export function serializeKey(key: CacheKey): string {
  if (typeof key === 'string') return key;
  if (typeof key === 'number') return key.toString();
  if (Array.isArray(key)) {
    return key.map(k => serializeKey(k)).join(':');
  }
  return String(key);
}

