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
import { RecintosPort } from './app/core/domain/ports/recintos.port';
import { UsuariosPort } from './app/core/domain/ports/usuarios.port';
import { SupabaseRecintosRepository } from './app/core/infrastructure/supabase/supabase-recintos.repository';
import { SupabaseUsuariosRepository } from './app/core/infrastructure/supabase/supabase-usuarios.repository';
import { JuntasPort } from './app/core/domain/ports/juntas.port';
import { SupabaseJuntasRepository } from './app/core/infrastructure/supabase/supabase-juntas.repository';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: AuthPort, useClass: SupabaseAuthRepository },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: RecintosPort, useClass: SupabaseRecintosRepository },
    { provide: UsuariosPort, useClass: SupabaseUsuariosRepository },
    { provide: JuntasPort, useClass: SupabaseJuntasRepository },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
  ],
});
