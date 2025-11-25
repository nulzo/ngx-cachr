# Hello World Example

This tutorial demonstrates the simplest possible usage of `ngx-cachr` to fetch and display a "Hello World" message from an API.

## 1. Setup

First, ensure you have provided the `NgxCachrService` in your application config:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideNgxCachr } from 'ngx-cachr';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxCachr({
      debug: true // Enable logs to see caching in action
    })
  ]
};
```

## 2. The Component

We'll create a standalone component that fetches a greeting.

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cachedResource } from 'ngx-cachr';

@Component({
  selector: 'app-hello-world',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>Hello World Demo</h1>

    @if (greeting.status() === 'loading') {
      <p>Loading greeting...</p>
    } 
    
    @if (greeting.error()) {
      <p style="color: red">Failed to load: {{ greeting.error() }}</p>
    }

    @if (greeting.data()) {
      <div class="card">
        <h2>{{ greeting.data()?.message }}</h2>
        <p>Generated at: {{ greeting.data()?.timestamp | date:'medium' }}</p>
      </div>
      
      <button (click)="greeting.invalidate()">Refresh (Invalidate Cache)</button>
    }
  `,
  styles: [`
    .card {
      border: 1px solid #ccc;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
  `]
})
export class HelloWorldComponent {
  // Define the resource
  greeting = cachedResource({
    key: 'greeting', // Unique key for this data
    loader: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return mock data
      return {
        message: 'Hello from the server!',
        timestamp: Date.now()
      };
    },
    ttl: 60 * 1000 // Cache for 1 minute
  });
}
```

## 3. What to Expect

1.  **First Load**: You will see "Loading greeting..." for 1 second. Then the card appears.
2.  **Refresh Page**: If you refresh the browser within 1 minute, the data will appear **instantly** because it is served from LocalStorage/Memory.
3.  **Invalidate**: Clicking "Refresh" invalidates the cache key `'greeting'`, causing a re-fetch from the "server".
