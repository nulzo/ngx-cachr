# Pagination & Infinite Scroll

This tutorial shows how to implement a paginated list using reactive parameters with `cachedResource`.

## The Service Layer

It is best practice to wrap your data fetching logic in a service.

```typescript
// post.service.ts
import { Injectable } from '@angular/core';
import { cachedResource } from 'ngx-cachr';

interface Post {
  id: number;
  title: string;
}

@Injectable({ providedIn: 'root' })
export class PostService {
  
  getPosts(page: () => number) {
    return cachedResource(() => ({
      // The key includes the page number, creating a unique cache entry per page
      key: ['posts', page()], 
      loader: async () => {
        const p = page();
        const response = await fetch(`https://jsonplaceholder.typicode.com/posts?_page=${p}&_limit=5`);
        return await response.json() as Post[];
      },
      ttl: 5 * 60 * 1000 // 5 minutes per page
    }));
  }
}
```

## The Component

We use a `signal` to track the current page. Since `cachedResource` is reactive, updating the page signal automatically triggers a fetch for the new data.

```typescript
// post-list.component.ts
import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService } from './post.service';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Paginated Posts</h2>

    <div class="controls">
      <button (click)="prev()" [disabled]="page() === 1">Previous</button>
      <span>Page {{ page() }}</span>
      <button (click)="next()">Next</button>
    </div>

    <div class="status-bar">
      @if (posts.status() === 'loading') {
        <span class="loader">Loading...</span>
      } @else if (posts.status() === 'revalidating') {
        <span class="revalidating">Updating...</span>
      }
    </div>

    <ul class="list">
      @for (post of posts.data(); track post.id) {
        <li>
          <strong>{{ post.id }}</strong>: {{ post.title }}
        </li>
      }
    </ul>
  `
})
export class PostListComponent {
  postService = inject(PostService);
  
  // Reactive state for pagination
  page = signal(1);

  // Automatically updates when page() changes
  posts = this.postService.getPosts(this.page);

  next() {
    this.page.update(p => p + 1);
  }

  prev() {
    this.page.update(p => Math.max(1, p - 1));
  }
}
```

## Caching Behavior

1.  **Navigation**: Click "Next" to go to Page 2. The data loads.
2.  **Back**: Click "Previous" to go back to Page 1. The data loads **instantly** because `['posts', 1]` is still in the cache.
3.  **Stale-While-Revalidate**: If the cache is stale (older than TTL), the cached posts show immediately, while a background fetch updates them. You might see the "Updating..." indicator briefly.
