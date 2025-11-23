For larger applications, it's recommended to encapsulate your API logic in services. Here's how to build a robust, reusable data layer similar to TanStack Query but for Angular.

### Step 1: Create a Base HTTP Service

Create a reusable wrapper for your API calls.

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = 'https://api.example.com';

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const httpParams = new HttpParams({ fromObject: params });
    return firstValueFrom(this.http.get<T>(`${this.baseUrl}${endpoint}`, { params: httpParams }));
  }
  
  // ... post, put, delete methods
}
```

### Step 2: Create Feature Services (Query Factories)

Instead of calling `cachedResource` in components directly with inline loaders, expose them as methods in a domain service. This keeps your components clean and logic reusable.

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { cachedResource } from 'ngx-cachr';
import { ApiService } from '../../core/api.service';
import { Product } from './product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private api = inject(ApiService);

  /**
   * Fetches a list of products.
   * Key: ['products', category]
   */
  getProducts(category: () => string | null) {
    return cachedResource(() => ({
      key: ['products', category()],
      // Only fetch if category is present
      loader: async () => {
        const cat = category();
        if (!cat) return []; 
        return this.api.get<Product[]>('/products', { category: cat });
      },
      ttl: 5 * 60 * 1000, // 5 minutes
      strategy: 'swr'
    }));
  }

  /**
   * Fetches a single product details.
   * Key: ['product', id]
   */
  getProduct(id: () => string) {
    return cachedResource(() => ({
      key: ['product', id()],
      loader: () => this.api.get<Product>(`/products/${id()}`),
      strategy: 'cache-first' // Don't re-fetch if we have it in memory/storage
    }));
  }
}
```

### Step 3: Consume in Components

Your components now become purely reactive views.

```typescript
import { Component, inject, signal } from '@angular/core';
import { ProductService } from './product.service';

@Component({
  template: `
    <select #cat (change)="category.set(cat.value)">
      <option value="electronics">Electronics</option>
      <option value="books">Books</option>
    </select>

    @if (products.status() === 'loading') {
      <skeleton-loader />
    }
    
    @for (product of products.data(); track product.id) {
      <product-card [product]="product" />
    }
  `
})
export class ProductListComponent {
  private productService = inject(ProductService);
  
  category = signal('electronics');
  
  // This signal is now fully managed, cached, and reactive!
  products = this.productService.getProducts(this.category);
}
```
