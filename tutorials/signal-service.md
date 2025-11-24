# Advanced Signal-Based Service Pattern

This tutorial demonstrates how to build a robust, fully signal-based service layer that mimics the developer experience of TanStack Query (React Query). We will create derived signals for common status flags like `isLoading()`, `isError()`, and `isSuccess()`.

## The Goal

We want to consume data in our components like this:

```typescript
// Component
userQuery = this.userService.getUser(userId);

// Template
@if (userQuery.isLoading()) {
  <spinner />
}

@if (userQuery.isError()) {
  <error-banner [message]="userQuery.error()" />
}

@if (userQuery.isSuccess()) {
  <user-card [user]="userQuery.data()" />
}
```

## 1. Creating a Reusable Query Wrapper

First, let's create a utility or a base service method that enhances the standard `cachedResource` return type with helper computed signals.

```typescript
// utils/query-resource.ts
import { computed, Signal } from '@angular/core';
import { cachedResource, CachedResourceOptions, CachedResource } from 'ngx-cachr';

export interface QueryResource<T> extends CachedResource<T> {
  isLoading: Signal<boolean>;
  isError: Signal<boolean>;
  isSuccess: Signal<boolean>;
  isRevalidating: Signal<boolean>;
}

export function createQuery<T>(
  optionsOrFn: CachedResourceOptions<T> | (() => CachedResourceOptions<T>)
): QueryResource<T> {
  const resource = cachedResource(optionsOrFn);

  return {
    ...resource,
    isLoading: computed(() => resource.status() === 'loading'),
    isError: computed(() => resource.status() === 'error'),
    isSuccess: computed(() => resource.status() === 'success'),
    isRevalidating: computed(() => resource.status() === 'revalidating'),
  };
}
```

## 2. Building the Feature Service

Now we use `createQuery` in our domain services. This keeps our service logic clean and focused on *what* to fetch, not *how* to track state.

```typescript
// services/user.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { createQuery } from '../utils/query-resource';

export interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  getUser(id: Signal<number>) {
    return createQuery(() => ({
      key: ['user', id()],
      loader: () => firstValueFrom(this.http.get<User>(`/api/users/${id()}`)),
      ttl: 5 * 60 * 1000 // 5 minutes
    }));
  }

  getUsers() {
    return createQuery({
      key: 'users-list',
      loader: () => firstValueFrom(this.http.get<User[]>('/api/users')),
      strategy: 'swr' // Stale-While-Revalidate
    });
  }
}
```

## 3. Component Usage

The component code becomes incredibly declarative and readable.

```typescript
// features/user-profile/user-profile.component.ts
import { Component, inject, signal } from '@angular/core';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  template: `
    <div class="toolbar">
      <button (click)="nextUser()">Next User</button>
    </div>

    <!-- Loading State -->
    @if (userQuery.isLoading()) {
      <div class="skeleton">Loading...</div>
    }

    <!-- Error State -->
    @if (userQuery.isError()) {
      <div class="error">
        Failed to load user. 
        <button (click)="userQuery.invalidate()">Retry</button>
      </div>
    }

    <!-- Success State -->
    @if (userQuery.isSuccess()) {
      <div class="card">
        <h1>{{ userQuery.data()?.name }}</h1>
        <p>{{ userQuery.data()?.email }}</p>
        
        <!-- Background Refresh Indicator -->
        @if (userQuery.isRevalidating()) {
          <small class="refreshing">Updating...</small>
        }
      </div>
    }
  `
})
export class UserProfileComponent {
  private userService = inject(UserService);
  
  userId = signal(1);
  
  // This is now a fully powered QueryResource
  userQuery = this.userService.getUser(this.userId);

  nextUser() {
    this.userId.update(id => id + 1);
  }
}
```

## Why This Pattern?

1.  **DX (Developer Experience)**: Boolean flags like `isLoading()` are often more convenient in templates than checking string enums (`status() === 'loading'`).
2.  ** consistency**: By wrapping `cachedResource` in `createQuery`, you enforce a consistent API across your entire application.
3.  **Reusability**: You can add global error handling, logging, or other side effects inside `createQuery` once, and it applies everywhere.


