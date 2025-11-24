import { Component, inject, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PokemonService } from '../../services/pokemon.service';

@Component({
  selector: 'app-pokemon-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <a routerLink="/" class="back-link">← Back to List</a>

      <!-- Initial Loading State (No Data) -->
      @if (query.isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading Pokemon details...</p>
        </div>
      }

      @if (query.isError()) {
        <div class="error-state">
          <h2>Whoops!</h2>
          <p>Could not find that Pokemon.</p>
          <button (click)="query.invalidate()" class="btn">Try Again</button>
        </div>
      }

      @if (query.data(); as pokemon) {
        <div class="detail-card" [class.opacity-50]="query.isRevalidating()">
          <div class="header-section">
            <h1>{{ pokemon.name }}</h1>
            <span class="id-badge">#{{ pokemon.id }}</span>
          </div>

          <div class="content-grid">
            <div class="image-section">
              <img 
                [src]="pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default" 
                [alt]="pokemon.name"
                class="main-image"
              >
            </div>

            <div class="stats-section">
              <div class="types">
                @for (t of pokemon.types; track t.type.name) {
                  <span class="type-badge" [class]="t.type.name">{{ t.type.name }}</span>
                }
              </div>

              <div class="measurements">
                <div class="measure">
                  <span class="label">Height</span>
                  <span class="value">{{ pokemon.height / 10 }}m</span>
                </div>
                <div class="measure">
                  <span class="label">Weight</span>
                  <span class="value">{{ pokemon.weight / 10 }}kg</span>
                </div>
              </div>

              <div class="base-stats">
                <h3>Base Stats</h3>
                @for (stat of pokemon.stats; track stat.stat.name) {
                  <div class="stat-row">
                    <span class="stat-name">{{ stat.stat.name }}</span>
                    <div class="stat-bar-bg">
                      <div 
                        class="stat-bar-fill" 
                        [style.width.%]="(stat.base_stat / 255) * 100"
                        [style.backgroundColor]="getStatColor(stat.base_stat)"
                      ></div>
                    </div>
                    <span class="stat-value">{{ stat.base_stat }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Background Revalidation Indicator -->
      @if (query.isRevalidating()) {
        <div class="revalidating-toast">Refreshing data in background...</div>
      }
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .back-link {
      display: inline-block;
      margin-bottom: 2rem;
      color: #3b82f6;
      text-decoration: none;
      font-weight: 600;
    }

    .detail-card {
      background: white;
      border-radius: 2rem;
      padding: 3rem;
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
      transition: opacity 0.2s;
    }
    
    .opacity-50 {
      opacity: 0.7;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    h1 {
      font-size: 3rem;
      text-transform: capitalize;
      margin: 0;
      color: #1e293b;
    }

    .id-badge {
      font-size: 2rem;
      color: #94a3b8;
      font-weight: bold;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
    }

    @media (max-width: 768px) {
      .content-grid {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
    }

    .main-image {
      width: 100%;
      height: auto;
      filter: drop-shadow(0 10px 8px rgb(0 0 0 / 0.04));
    }

    .types {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .type-badge {
      padding: 0.5rem 1.5rem;
      border-radius: 9999px;
      color: white;
      font-weight: 600;
      text-transform: capitalize;
      background: #64748b; /* default */
    }

    .type-badge.grass { background: #22c55e; }
    .type-badge.fire { background: #ef4444; }
    .type-badge.water { background: #3b82f6; }
    .type-badge.bug { background: #84cc16; }
    .type-badge.normal { background: #94a3b8; }
    .type-badge.poison { background: #a855f7; }
    .type-badge.electric { background: #eab308; }
    .type-badge.ground { background: #d97706; }
    .type-badge.fairy { background: #f472b6; }
    .type-badge.fighting { background: #f97316; }
    .type-badge.psychic { background: #ec4899; }
    .type-badge.rock { background: #78716c; }
    .type-badge.ghost { background: #6366f1; }
    .type-badge.ice { background: #06b6d4; }
    .type-badge.dragon { background: #8b5cf6; }

    .measurements {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      background: #f8fafc;
      padding: 1.5rem;
      border-radius: 1rem;
      margin-bottom: 2rem;
    }

    .measure {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .label {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 0.25rem;
    }

    .value {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
    }

    .stat-row {
      display: flex;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .stat-name {
      width: 100px;
      text-transform: capitalize;
      color: #64748b;
      font-size: 0.875rem;
    }

    .stat-bar-bg {
      flex: 1;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      margin: 0 1rem;
      overflow: hidden;
    }

    .stat-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 1s ease-out;
    }

    .stat-value {
      width: 30px;
      text-align: right;
      font-weight: 600;
      color: #334155;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 0;
      gap: 1rem;
      color: #64748b;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
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
      z-index: 100;
    }

    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class PokemonDetailComponent {
  private pokemonService = inject(PokemonService);
  
  name = input<string>();
  
  query = this.pokemonService.getPokemonDetail(computed(() => this.name() ?? null));

  getStatColor(val: number): string {
    if (val >= 100) return '#22c55e';
    if (val >= 60) return '#3b82f6';
    return '#f59e0b';
  }
}
