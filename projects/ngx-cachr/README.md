<div style="width: 100%;" align="center">
  <a href="https://github.com/nulzo/ngx-cachr">
    <img src="docs/images/ngx-cachr-finished-png.png" style="width: 300px;" alt="ngx-cachr logo">
  </a>
</div>

<br/>

<p align="center">
  <strong>A slim, signal-based caching library for Angular.</strong>
</p>

<br/>

<p align="center">
  <a href="https://www.npmjs.com/package/ngx-cachr">
    <img src="https://img.shields.io/npm/v/ngx-cachr.svg" alt="npm version">
  </a>
  <a href="https://www.npmjs.com/package/ngx-cachr">
    <img src="https://img.shields.io/npm/dm/ngx-cachr.svg" alt="npm downloads">
  </a>
  <a href="https://github.com/nulzo/ngx-cachr/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/ngx-cachr.svg" alt="license">
  </a>
</p>

<!-- <p align="center">
  Inspired by libraries like <a href="https://swr.vercel.app/">SWR</a> and <a href="https://tanstack.com/query/latest">TanStack Query</a>, but built specifically for Angular's Signals architecture.
</p> -->

---

## Installation

```bash
npm install ngx-cachr
```

## Features

- **Signal-Based**: Fully built on signals for modern and granular reactivity.
- **Flexible Strategies**: Support for `cache-first`, `network-first`, and `stale-while-revalidate` (SWR).
- **Multi-Layer Caching**: Memory cache using [LRU](https://en.wikipedia.org/wiki/Cache_replacement_policies) and persistent cache via LocalStorage.
- **Lightweight**: Minimal footprint, tree-shakeable.

## Usage

### 1. Provide the Service

Add `provideNgxCachr` to your application configuration (usually `app.config.ts`).

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNgxCachr } from 'ngx-cachr';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideNgxCachr({
      prefix: 'angular-app:',   // prefix for storage keys (whatever you want)
      defaultTtl: 300000,       // 5 minutes
      defaultStrategy: 'swr',   // stale while revalidate
      debug: true               // adds logging
    })
  ]
};
```

### 2. Use in Components

Use the `cachedResource` function to fetch and cache data. It returns a `CachedResource` object with `data`, `status`, and `error` signals.

```typescript
import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { cachedResource } from 'ngx-cachr';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (user.status() === 'loading') {
      <p>Loading...</p>
    } @else if (user.error()) {
      <p>Error loading user</p>
    } @else if (user.data()) {
      <h1>{{ user.data()?.name }}</h1>
      <p>Email: {{ user.data()?.email }}</p>
      
      <button (click)="user.invalidate()">Refresh</button>
    }
    
    @if (user.status() === 'revalidating') {
      <small>Updating in background...</small>
    }
  `
})
export class UserProfileComponent {
  http = inject(HttpClient);

  // the most simple usage. 
  // personally, i'd move this to a service, but it's just an example.
  user = cachedResource({
    key: 'user-current',
    loader: () => firstValueFrom(this.http.get<any>('/api/user')),
    ttl: 60 * 1000, // keep fresh for 1 minute
  });
}
```

### 3. Reactive Keys (Dependent Queries)

Pass a function that returns the options to make the query reactive. When dependencies change (signals used inside), the resource automatically re-fetches.

```typescript
userId = signal(1);

user = cachedResource(() => ({
  key: ['user', this.userId()], // key changes when userId changes
  loader: () => this.fetchUser(this.userId())
}));

nextUser() {
  // user.data() will automatically update now
  this.userId.update(id => id + 1);
}
```

## Configuration

### `CacheConfig`

| Option | Type | Default | Description |
|---|---|---|---|
| `prefix` | `string` | `'ngx-cachr:'` | Namespace for storage keys. |
| `version` | `number` | `1` | Cache version. Bump to invalidate all persistent storage. |
| `defaultTtl` | `number` | `300000` | Default time-to-live in ms (5 mins). |
| `defaultStrategy` | `'cache-first' \| 'network-first' \| 'swr'` | `'swr'` | Default caching strategy. |
| `memory.maxEntries` | `number` | `100` | Max items in memory (LRU). |

### Caching Strategies

- **`swr` (Stale-While-Revalidate)**: Returns cached data immediately (if available), then fetches from network in the background to update the cache. Best for UI responsiveness.
- **`cache-first`**: Returns cached data if fresh. Only fetches from network if cache is missing or stale.
- **`network-first`**: Always fetches from network. Falls back to cache if network fails.

## License

MIT
