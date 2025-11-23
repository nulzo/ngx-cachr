import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { Component, signal, computed, Injector, runInInjectionContext } from '@angular/core';
import { cachedResource } from './cached-resource';
import { NgxCachrService } from '../services/ngx-cachr.service';
import { CachedResourceOptions } from '../core/types';

describe('cachedResource', () => {
  let mockService: any;
  let injector: Injector;

  beforeEach(() => {
    mockService = {
      get: jasmine.createSpy('get').and.returnValue(Promise.resolve('data')),
      set: jasmine.createSpy('set'),
      invalidate: jasmine.createSpy('invalidate').and.returnValue(Promise.resolve())
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: NgxCachrService, useValue: mockService }
      ]
    });
    injector = TestBed.inject(Injector);
  });

  it('should initialize with default state', () => {
    runInInjectionContext(injector, () => {
      const resource = cachedResource({
        key: 'test',
        loader: () => Promise.resolve('test')
      });

      expect(resource.data()).toBeUndefined();
      expect(resource.status()).toBe('idle');
      expect(resource.error()).toBeNull();
    });
  });

  it('should call service.get and update signals on resolution', fakeAsync(() => {
    mockService.get.and.callFake((opts: any, cb: any) => {
      cb({ status: 'loading' });
      setTimeout(() => {
          cb({ data: 'resolved-data', status: 'success' });
      }, 100);
      return Promise.resolve('resolved-data');
    });

    runInInjectionContext(injector, () => {
      const resource = cachedResource({
        key: 'test',
        loader: () => Promise.resolve('test')
      });

      expect(resource.status()).toBe('loading');
      
      tick(100);

      expect(resource.data()).toBe('resolved-data');
      expect(resource.status()).toBe('success');
    });
  }));

  it('should react to dependency changes', fakeAsync(() => {
    runInInjectionContext(injector, () => {
      const id = signal(1);
      
      cachedResource(() => ({
        key: ['user', id()],
        loader: () => Promise.resolve(`user-${id()}`)
      }));

      TestBed.flushEffects(); // Ensure initial effect runs

      // Initial call
      expect(mockService.get).toHaveBeenCalledWith(
        jasmine.objectContaining({ key: ['user', 1] }), 
        jasmine.any(Function)
      );

      // Update signal
      id.set(2);
      TestBed.flushEffects(); // Ensure effects run
      tick();

      expect(mockService.get).toHaveBeenCalledWith(
        jasmine.objectContaining({ key: ['user', 2] }), 
        jasmine.any(Function)
      );
    });
  }));

  it('should mutate local data and update service', () => {
    runInInjectionContext(injector, () => {
      const resource = cachedResource({
        key: 'test',
        loader: () => Promise.resolve('test'),
        ttl: 5000
      });

      resource.mutate('new-data');

      expect(resource.data()).toBe('new-data');
      expect(mockService.set).toHaveBeenCalledWith('test', 'new-data', 5000);
    });
  });

  it('should invalidate cache', fakeAsync(() => {
     runInInjectionContext(injector, () => {
      const resource = cachedResource({
        key: 'test',
        loader: () => Promise.resolve('test')
      });

      resource.invalidate();
      tick();

      expect(mockService.invalidate).toHaveBeenCalledWith('test');
      // Should re-fetch after invalidation
      expect(mockService.get).toHaveBeenCalledTimes(2); // Initial + After invalidation
    });
  }));
});

