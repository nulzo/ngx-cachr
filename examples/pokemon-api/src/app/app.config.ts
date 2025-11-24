import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideNgxCachr } from 'ngx-cachr';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideNgxCachr({
      prefix: 'poke-app:', // persistant global key to prevent collisions
      defaultTtl: 300000, // default 5 minutes
      defaultStrategy: 'swr',
      debug: true
    })
  ]
};
