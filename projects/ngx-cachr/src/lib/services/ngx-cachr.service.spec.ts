import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NgxCachrService } from './ngx-cachr.service';
import { CACHE_CONFIG, CacheConfig } from '../core/types';
import { PLATFORM_ID } from '@angular/core';

describe('NgxCachrService', () => {
  let service: NgxCachrService;
  let mockLocalStorage: any;
  let store: Record<string, string> = {};

  const config: CacheConfig = {
    prefix: 'test:',
    version: 1,
    defaultTtl: 1000,
    defaultStrategy: 'swr',
    memory: { maxEntries: 10 }
  };

  beforeEach(() => {
    store = {};
    mockLocalStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
      get length() { return Object.keys(store).length; },
      key: (i: number) => Object.keys(store)[i] || null
    };

    spyOn(NgxCachrService.prototype as any, 'getStorage').and.returnValue(mockLocalStorage);

    TestBed.configureTestingModule({
      providers: [
        NgxCachrService,
        { provide: CACHE_CONFIG, useValue: config }
      ]
    });
    service = TestBed.inject(NgxCachrService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch and cache data on first call (cache-miss)', async () => {
    const loaderSpy = jasmine.createSpy('loader').and.returnValue(Promise.resolve('data'));
    const updateStateSpy = jasmine.createSpy('updateState');

    const result = await service.get({
      key: 'test',
      loader: loaderSpy,
      strategy: 'swr'
    }, updateStateSpy);

    expect(result).toBe('data');
    expect(loaderSpy).toHaveBeenCalledTimes(1);
    expect(updateStateSpy).toHaveBeenCalledWith({ status: 'loading' });
    expect(updateStateSpy).toHaveBeenCalledWith({ data: 'data', status: 'success' });
  });

  it('should return cached data on second call (cache-hit)', async () => {
    const loaderSpy = jasmine.createSpy('loader').and.returnValue(Promise.resolve('data'));
    
    // First call
    await service.get({ key: 'test', loader: loaderSpy });
    loaderSpy.calls.reset();

    // Second call
    const result = await service.get({ key: 'test', loader: loaderSpy });
    
    expect(result).toBe('data');
    expect(loaderSpy).not.toHaveBeenCalled();
  });

  it('should revalidate in background for SWR strategy when stale', fakeAsync(async () => {
    const loaderSpy = jasmine.createSpy('loader').and.returnValue(Promise.resolve('fresh-data'));
    
    // Seed cache with stale data
    await service.set('test', 'stale-data', -1000); // Expired

    const updateStateSpy = jasmine.createSpy('updateState');

    const result = await service.get({
      key: 'test',
      loader: loaderSpy,
      strategy: 'swr'
    }, updateStateSpy);

    // Should return stale data immediately
    expect(result).toBe('stale-data');
    
    // Wait for background revalidation
    tick();

    expect(updateStateSpy).toHaveBeenCalledWith({ data: 'stale-data', status: 'revalidating' });
    expect(updateStateSpy).toHaveBeenCalledWith({ data: 'fresh-data', status: 'success' });
  }));

  it('should clear storage if version changes', async () => {
    store['test:version'] = '0';
    store['test:some-data'] = 'xyz';

    // Re-create service to trigger constructor logic
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
        providers: [
            NgxCachrService,
            { provide: CACHE_CONFIG, useValue: { ...config, version: 2 } }, // Bump version
            { provide: PLATFORM_ID, useValue: 'browser' }
        ]
    });
    
    // We need to await the async checkVersion, but it's private/called in constructor.
    // However, checking the store immediately might fail if it's async. 
    // Ideally, we'd inspect the store after a microtask.
    const newService = TestBed.inject(NgxCachrService);
    
    // Wait for promises
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(store['test:version']).toBe('2');
    expect(store['test:some-data']).toBeUndefined();
  });

  it('should handle simultaneous requests (deduplication)', async () => {
    let resolvePromise: (val: string) => void;
    const promise = new Promise<string>(r => resolvePromise = r);
    const loaderSpy = jasmine.createSpy('loader').and.returnValue(promise);

    const p1 = service.get({ key: 'dedup', loader: loaderSpy });
    const p2 = service.get({ key: 'dedup', loader: loaderSpy });

    resolvePromise!('result');

    const [r1, r2] = await Promise.all([p1, p2]);
    
    expect(r1).toBe('result');
    expect(r2).toBe('result');
    expect(loaderSpy).toHaveBeenCalledTimes(1);
  });
});
