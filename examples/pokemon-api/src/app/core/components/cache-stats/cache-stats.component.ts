import { Component, inject, signal, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxCachrService, CACHE_CONFIG } from 'ngx-cachr';
import { CacheInspectorComponent } from '../cache-inspector/cache-inspector.component';

@Component({
  selector: 'app-cache-stats',
  standalone: true,
  imports: [CommonModule, CacheInspectorComponent],
  template: `
    <div class="stats-bar">
      <div class="stats-group">
        <div class="stat-item">
          <span class="label">Memory Entries:</span>
          <span class="value">{{ stats().memory }}</span>
        </div>
        <div class="stat-item">
          <span class="label">Memory Size:</span>
          <span class="value">{{ stats().memorySize }}</span>
        </div>
        <div class="stat-item">
          <span class="label">Storage Entries:</span>
          <span class="value">{{ stats().storage }}</span>
        </div>
        <div class="stat-item">
          <span class="label">Version:</span>
          <span class="value">v{{ stats().version }}</span>
        </div>
      </div>
      
      <div class="actions">
        <button (click)="showInspector.set(true)" class="inspect-btn">Inspect Cache</button>
        <button (click)="clearCache()" class="clear-btn">Clear Cache</button>
      </div>
    </div>

    @if (showInspector()) {
      <app-cache-inspector (close)="showInspector.set(false)" />
    }
  `,
  styles: [`
    .stats-bar {
      background: #1e293b;
      color: white;
      padding: 0.75rem 1rem;
      display: flex;
      gap: 2rem;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
      font-family: monospace;
      border-bottom: 1px solid #334155;
      flex-wrap: wrap;
    }

    .stats-group {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
    }

    .stat-item {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .label {
      color: #94a3b8;
    }

    .value {
      color: #60a5fa;
      font-weight: bold;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .clear-btn, .inspect-btn {
      border: none;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
      transition: background 0.2s;
      color: white;
    }

    .clear-btn {
      background: #ef4444;
    }
    
    .clear-btn:hover {
      background: #dc2626;
    }

    .inspect-btn {
      background: #3b82f6;
    }

    .inspect-btn:hover {
      background: #2563eb;
    }
  `]
})
export class CacheStatsComponent implements OnInit, OnDestroy {
  private service = inject(NgxCachrService);
  private config = inject(CACHE_CONFIG);
  
  stats = signal({ memory: 0, storage: 0, memorySize: '0 KB', version: 0 });
  showInspector = signal(false);
  interval: any;

  ngOnInit() {
    this.updateStats();
    this.interval = setInterval(() => this.updateStats(), 1000);
  }

  ngOnDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  updateStats() {
    const serviceAny = this.service as any;
    const memoryDriver = serviceAny.memoryDriver;
    
    let memoryCount = 0;
    let memorySize = 0;
    
    if (memoryDriver && memoryDriver.cache) {
        memoryCount = memoryDriver.cache.size;
        try {
          for (const value of memoryDriver.cache.values()) {
              const str = JSON.stringify(value);
              if (str) memorySize += str.length * 2; 
          }
        } catch (e) {}
    }

    let storageCount = 0;
    const prefix = this.config.prefix;
    
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    storageCount++;
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    this.stats.set({
        memory: memoryCount,
        storage: storageCount,
        memorySize: this.formatSize(memorySize),
        version: this.config.version
    });
  }

  clearCache() {
    if (confirm('Are you sure you want to clear the cache? This will reload the page.')) {
      const prefix = this.config.prefix;
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }
      
      window.location.reload();
    }
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
