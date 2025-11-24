import { StorageDriver } from './storage.driver';
import { CacheEntry } from '../core/types';

describe('StorageDriver', () => {
  let driver: StorageDriver;
  let mockStorage: any;
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    mockStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
      key: (index: number) => Object.keys(store)[index],
      get length() { return Object.keys(store).length; }
    };

    driver = new StorageDriver(mockStorage, 'test-prefix:');
  });

  it('should store data with prefix', async () => {
    const entry: CacheEntry<string> = {
      data: 'test-data',
      metadata: { createdAt: Date.now(), ttl: 1000, tags: [], version: 1 }
    };

    await driver.set('key1', entry);
    expect(store['test-prefix:key1']).toBeDefined();
    expect(JSON.parse(store['test-prefix:key1'])).toEqual(entry);
  });

  it('should retrieve data using prefix', async () => {
    const entry: CacheEntry<string> = {
      data: 'test-data',
      metadata: { createdAt: Date.now(), ttl: 1000, tags: [], version: 1 }
    };
    store['test-prefix:key1'] = JSON.stringify(entry);

    const result = await driver.get<string>('key1');
    expect(result).toEqual(entry);
  });

  it('should return null for missing keys', async () => {
    const result = await driver.get('missing');
    expect(result).toBeNull();
  });

  it('should handle JSON parse errors gracefully', async () => {
    store['test-prefix:bad-json'] = '{ invalid json }';
    const spy = spyOn(console, 'error');
    const result = await driver.get('bad-json');
    expect(result).toBeNull();
    expect(spy).toHaveBeenCalled();
  });

  it('should clear only prefixed keys', async () => {
    store['test-prefix:key1'] = 'val1';
    store['other-prefix:key2'] = 'val2';

    await driver.clear();

    expect(store['test-prefix:key1']).toBeUndefined();
    expect(store['other-prefix:key2']).toBeDefined();
  });
});


