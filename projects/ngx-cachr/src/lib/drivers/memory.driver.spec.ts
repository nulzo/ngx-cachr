import { MemoryDriver } from './memory.driver';
import { CacheEntry } from '../core/types';

describe('MemoryDriver', () => {
  let driver: MemoryDriver;

  beforeEach(() => {
    driver = new MemoryDriver(3); // limit to 3 items for testing LRU
  });

  it('should store and retrieve data', async () => {
    const entry: CacheEntry<string> = {
      data: 'test-data',
      metadata: {
        createdAt: Date.now(),
        ttl: 1000,
        tags: [],
        version: 1
      }
    };

    await driver.set('key1', entry);
    const result = await driver.get<string>('key1');

    expect(result).toEqual(entry);
  });

  it('should return null for missing keys', async () => {
    const result = await driver.get('missing');
    expect(result).toBeNull();
  });

  it('should delete keys', async () => {
    const entry: CacheEntry<string> = {
      data: 'data',
      metadata: { createdAt: Date.now(), ttl: 1000, tags: [], version: 1 }
    };

    await driver.set('key1', entry);
    await driver.delete('key1');
    const result = await driver.get('key1');

    expect(result).toBeNull();
  });

  it('should clear all keys', async () => {
    const entry: CacheEntry<string> = {
      data: 'data',
      metadata: { createdAt: Date.now(), ttl: 1000, tags: [], version: 1 }
    };

    await driver.set('key1', entry);
    await driver.set('key2', entry);
    await driver.clear();

    expect(await driver.get('key1')).toBeNull();
    expect(await driver.get('key2')).toBeNull();
  });

  it('should evict least recently used items', async () => {
    const entry: CacheEntry<string> = {
        data: 'data',
        metadata: { createdAt: Date.now(), ttl: 1000, tags: [], version: 1 }
    };

    // Fill cache (limit is 3)
    await driver.set('a', entry);
    await driver.set('b', entry);
    await driver.set('c', entry);

    // Access 'a' to make it most recently used
    await driver.get('a');

    // Add 'd', should evict 'b' (since 'a' was refreshed)
    await driver.set('d', entry);

    expect(await driver.get('a')).not.toBeNull();
    expect(await driver.get('b')).toBeNull(); // evicted
    expect(await driver.get('c')).not.toBeNull();
    expect(await driver.get('d')).not.toBeNull();
  });
});
