import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withComponentInputBinding,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { AuthPort } from './app/core/domain/ports/auth.port';
import { SupabaseAuthRepository } from './app/core/infrastructure/supabase/supabase-auth.repository';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: AuthPort, useClass: SupabaseAuthRepository },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
  ],
});
