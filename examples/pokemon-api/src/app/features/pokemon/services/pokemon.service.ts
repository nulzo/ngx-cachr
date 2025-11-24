import { Injectable, inject, signal, Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { createQuery } from '../../../core/utils/query-resource';

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonSummary[];
}

export interface PokemonSummary {
  name: string;
  url: string;
}

export interface PokemonDetail {
  id: number;
  name: string;
  sprites: {
    front_default: string;
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
  types: {
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }[];
  weight: number;
  height: number;
  stats: {
    base_stat: number;
    stat: {
      name: string;
    };
  }[];
}

@Injectable({ providedIn: 'root' })
export class PokemonService {
  private http = inject(HttpClient);
  private baseUrl = 'https://pokeapi.co/api/v2';

  getPokemonList(page: Signal<number>, limit: number = 20) {
    return createQuery(() => {
      const p = page();
      const offset = (p - 1) * limit;
      
      return {
        key: ['pokemon-list', p, limit],
        loader: async () => {
          // fake delay to show loading/refreshing states
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          return firstValueFrom(
            this.http.get<PokemonListResponse>(`${this.baseUrl}/pokemon?offset=${offset}&limit=${limit}`)
          );
        },
        ttl: 60 * 1000, // 1 minute (quick ttl to test)
        strategy: 'swr'
      };
    });
  }

  getPokemonDetail(name: Signal<string | null>) {
    return createQuery(() => {
      const n = name();
      if (!n) return { key: ['pokemon', 'null'], loader: async () => null };

      return {
        key: ['pokemon', n],
        loader: async () => {
          // fake delay to show loading/refreshing states
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          return firstValueFrom(
            this.http.get<PokemonDetail>(`${this.baseUrl}/pokemon/${n}`)
          );
        },
        ttl: 30 * 60 * 1000, // 5 minutes
        strategy: 'cache-first' // pokemon data rarely changes
      };
    });
  }
}
