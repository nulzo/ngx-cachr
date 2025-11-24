import { Component, inject, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxCachrService, CACHE_CONFIG } from 'ngx-cachr';

interface InspectorEntry {
  key: string;
  source: 'memory' | 'storage' | 'both';
  data: any;
  metadata: any;
}

@Component({
  selector: 'app-cache-inspector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="inspector-overlay" (click)="close.emit()">
      <div class="inspector-panel" (click)="$event.stopPropagation()">
        <div class="panel-header">
          <h2>Cache Inspector</h2>
          <div class="actions">
            <button (click)="refresh()" class="refresh-btn">Refresh</button>
            <button (click)="close.emit()" class="close-btn">×</button>
          </div>
        </div>

        <div class="panel-body">
          <div class="sidebar">
            <input 
              type="text" 
              placeholder="Filter keys..." 
              (input)="filter.set($any($event.target).value)"
              class="search-input"
            >
            
            <div class="key-list">
              @for (entry of filteredEntries(); track entry.key) {
                <div 
                  class="key-item" 
                  [class.active]="selectedKey() === entry.key"
                  (click)="selectKey(entry)"
                >
                  <span class="key-name" [title]="entry.key">{{ entry.key }}</span>
                  <span class="badge" [class]="entry.source">{{ entry.source }}</span>
                </div>
              }
              @if (filteredEntries().length === 0) {
                <div class="empty-state">No keys found</div>
              }
            </div>
          </div>

          <div class="content">
            @if (selectedEntry(); as entry) {
              <div class="detail-header">
                <h3>{{ entry.key }}</h3>
                <div class="meta-tags">
                  <span class="meta-tag">Source: {{ entry.source | titlecase }}</span>
                  <span class="meta-tag">TTL: {{ entry.metadata?.ttl / 1000 }}s</span>
                  <span class="meta-tag">Created: {{ entry.metadata?.createdAt | date:'mediumTime' }}</span>
                  <span class="meta-tag">Version: {{ entry.metadata?.version }}</span>
                </div>
              </div>
              
              <div class="json-viewer">
                <pre>{{ entry.data | json }}</pre>
              </div>
            } @else {
              <div class="no-selection">
                <p>Select a cache entry to view details</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .inspector-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .inspector-panel {
      background: white;
      width: 90vw;
      height: 85vh;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
      overflow: hidden;
    }

    .panel-header {
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
    }

    .panel-header h2 {
      margin: 0;
      font-size: 1.25rem;
      color: #334155;
    }
    
    .actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .refresh-btn {
      padding: 0.5rem 1rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .refresh-btn:hover {
        background: #2563eb;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #64748b;
      line-height: 1;
    }
    
    .close-btn:hover {
        color: #ef4444;
    }

    .panel-body {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .sidebar {
      width: 350px;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      background: #f1f5f9;
    }

    .search-input {
      margin: 1rem;
      padding: 0.5rem;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
    }

    .key-list {
      flex: 1;
      overflow-y: auto;
    }

    .key-item {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e2e8f0;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }

    .key-item:hover {
      background: #e2e8f0;
    }

    .key-item.active {
      background: #dbeafe;
      border-left: 4px solid #3b82f6;
    }

    .key-name {
      font-family: monospace;
      font-size: 0.875rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .badge {
      font-size: 0.65rem;
      padding: 0.1rem 0.4rem;
      border-radius: 999px;
      text-transform: uppercase;
      font-weight: bold;
      flex-shrink: 0;
    }

    .badge.memory { background: #dcfce7; color: #166534; }
    .badge.storage { background: #fef3c7; color: #92400e; }
    .badge.both { background: #e0e7ff; color: #3730a3; }

    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 1.5rem;
    }

    .detail-header {
      margin-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 1rem;
    }

    .detail-header h3 {
      margin: 0 0 0.5rem 0;
      font-family: monospace;
      color: #334155;
      word-break: break-all;
    }

    .meta-tags {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .meta-tag {
      background: #f1f5f9;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      color: #64748b;
    }

    .json-viewer {
      flex: 1;
      overflow: auto;
      background: #0f172a;
      color: #e2e8f0;
      padding: 1rem;
      border-radius: 6px;
      font-family: monospace;
      font-size: 0.875rem;
    }

    .no-selection {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      color: #94a3b8;
    }
    
    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #94a3b8;
    }
  `]
})
export class CacheInspectorComponent {
  @Output() close = new EventEmitter<void>();
  
  private service = inject(NgxCachrService);
  private config = inject(CACHE_CONFIG);
  
  entries = signal<InspectorEntry[]>([]);
  filter = signal('');
  selectedKey = signal<string | null>(null);
  
  filteredEntries = computed(() => {
    const term = this.filter().toLowerCase();
    return this.entries().filter(e => e.key.toLowerCase().includes(term));
  });
  
  selectedEntry = computed(() => {
    const key = this.selectedKey();
    if (!key) return null;
    return this.entries().find(e => e.key === key);
  });
  
  constructor() {
    this.refresh();
  }
  
  refresh() {
    const serviceAny = this.service as any;
    const memoryDriver = serviceAny.memoryDriver;
    
    const allEntries = new Map<string, InspectorEntry>();
    
    if (memoryDriver && memoryDriver.cache) {
        for (const [key, val] of memoryDriver.cache.entries()) {
            const value = val as any;
            const displayKey = key; 
            
            allEntries.set(displayKey, {
                key: displayKey,
                source: 'memory',
                data: value.data,
                metadata: value.metadata
            });
        }
    }
    
    const prefix = this.config.prefix;
    if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = 0; i < localStorage.length; i++) {
            const rawKey = localStorage.key(i);
            if (rawKey && rawKey.startsWith(prefix)) {
                const displayKey = rawKey.substring(prefix.length);
                
                try {
                    const rawVal = localStorage.getItem(rawKey);
                    if (rawVal) {
                        const value = JSON.parse(rawVal);
                        
                        if (allEntries.has(displayKey)) {
                            const existing = allEntries.get(displayKey)!;
                            existing.source = 'both';
                        } else {
                            allEntries.set(displayKey, {
                                key: displayKey,
                                source: 'storage',
                                data: value.data,
                                metadata: value.metadata
                            });
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse storage item', rawKey, e);
                }
            }
        }
    }
    
    this.entries.set(Array.from(allEntries.values()).sort((a, b) => a.key.localeCompare(b.key)));
  }
  
  selectKey(entry: InspectorEntry) {
    this.selectedKey.set(entry.key);
  }
}
