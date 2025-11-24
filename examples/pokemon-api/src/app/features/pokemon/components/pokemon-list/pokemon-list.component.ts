import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PokemonService } from '../../services/pokemon.service';

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <header class="header">
        <h1>PokéDex</h1>
        <p>Powered by ngx-cachr</p>
      </header>

      <div class="controls">
        <button (click)="prev()" [disabled]="page() === 1 || query.isLoading()" class="btn">Previous</button>
        <span class="page-info">Page {{ page() }}</span>
        <button (click)="next()" [disabled]="!query.data()?.next || query.isLoading()" class="btn">Next</button>
      </div>

      <!-- Loading State (New Key / No Cache) -->
      @if (query.isLoading()) {
        <div class="loading-grid">
          @for (i of [1,2,3,4,5,6,7,8,9,10,11,12]; track i) {
            <div class="skeleton-card">
              <div class="spinner"></div>
            </div>
          }
        </div>
      } 
      @else if (query.isError()) {
        <div class="error-state">
          <p>Failed to load Pokemon.</p>
          <button (click)="query.invalidate()" class="btn btn-retry">Retry</button>
        </div>
      } 
      @else {
        <!-- Data Loaded (Fresh or Stale) -->
        <div class="pokemon-grid" [class.opacity-50]="query.isRevalidating()">
          @for (pokemon of query.data()?.results; track pokemon.name) {
            <a [routerLink]="['/pokemon', pokemon.name]" class="pokemon-card">
              <div class="pokemon-id">#{{ getPokemonId(pokemon.url) }}</div>
              <img 
                [src]="getSpriteUrl(pokemon.url)" 
                [alt]="pokemon.name"
                loading="lazy"
                class="pokemon-sprite"
              >
              <h3 class="pokemon-name">{{ pokemon.name }}</h3>
            </a>
          }
        </div>
      }

      <!-- Background Revalidation Indicator -->
      @if (query.isRevalidating()) {
        <div class="revalidating-toast">
          <span class="spinner-sm"></span>
          Updating data...
        </div>
      }
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .header h1 {
      font-size: 2.5rem;
      color: #333;
      margin: 0;
    }

    .controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s;
    }

    .btn:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
    }

    .btn:not(:disabled):hover {
      background: #2563eb;
    }

    .pokemon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.5rem;
      transition: opacity 0.2s;
    }

    .opacity-50 {
      opacity: 0.7;
    }

    .pokemon-card {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      text-align: center;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .pokemon-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    }

    .pokemon-sprite {
      width: 96px;
      height: 96px;
      image-rendering: pixelated;
    }

    .pokemon-name {
      text-transform: capitalize;
      margin: 0.5rem 0 0;
      font-size: 1.25rem;
    }

    .pokemon-id {
      color: #94a3b8;
      font-size: 0.875rem;
      align-self: flex-start;
    }

    /* Skeleton & Spinner */
    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    .skeleton-card {
      height: 200px;
      background: #f1f5f9;
      border: 2px dashed #cbd5e1;
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .revalidating-toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: #334155;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 9999px;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
      animation: slideUp 0.3s ease-out;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class PokemonListComponent {
  private pokemonService = inject(PokemonService);
  
  page = signal(1);
  query = this.pokemonService.getPokemonList(this.page);

  next() {
    this.page.update(p => p + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prev() {
    this.page.update(p => Math.max(1, p - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getPokemonId(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 2];
  }

  getSpriteUrl(url: string): string {
    const id = this.getPokemonId(url);
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  }
}
