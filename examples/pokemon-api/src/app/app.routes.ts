import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/pokemon/components/pokemon-list/pokemon-list.component')
      .then(m => m.PokemonListComponent)
  },
  {
    path: 'pokemon/:name',
    loadComponent: () => import('./features/pokemon/components/pokemon-detail/pokemon-detail.component')
      .then(m => m.PokemonDetailComponent)
  }
];
