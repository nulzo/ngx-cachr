import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CacheStatsComponent } from './core/components/cache-stats/cache-stats.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CacheStatsComponent],
  template: `
    <app-cache-stats />
    <router-outlet></router-outlet>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #f1f5f9;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #334155;
    }
  `]
})
export class App {}
