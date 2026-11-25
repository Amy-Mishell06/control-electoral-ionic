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
import { ActasPort } from './app/core/domain/ports/actas.port';
import { CamaraPort } from './app/core/domain/ports/camara.port';
import { GpsPort } from './app/core/domain/ports/gps.port';
import { NitidezPort } from './app/core/domain/ports/nitidez.port';
import { SupabaseActasRepository } from './app/core/infrastructure/supabase/supabase-actas.repository';
import { CapacitorCamaraAdapter } from './app/core/infrastructure/capacitor/capacitor-camara.adapter';
import { CapacitorGpsAdapter } from './app/core/infrastructure/capacitor/capacitor-gps.adapter';
import { CanvasNitidezAdapter } from './app/core/infrastructure/canvas/canvas-nitidez.adapter';
import { DashboardPort } from './app/core/domain/ports/dashboard.port';
import { SupabaseDashboardRepository } from './app/core/infrastructure/supabase/supabase-dashboard.repository';
import { CorreccionPort } from './app/core/domain/ports/correccion.port';
import { SupabaseCorreccionRepository } from './app/core/infrastructure/supabase/supabase-correccion.repository';
import { RecuperacionPort } from './app/core/domain/ports/recuperacion.port';
import { SupabaseRecuperacionRepository } from './app/core/infrastructure/supabase/supabase-recuperacion.repository';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: AuthPort, useClass: SupabaseAuthRepository },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: RecintosPort, useClass: SupabaseRecintosRepository },
    { provide: UsuariosPort, useClass: SupabaseUsuariosRepository },
    { provide: JuntasPort, useClass: SupabaseJuntasRepository },
    { provide: ActasPort, useClass: SupabaseActasRepository },
    { provide: CamaraPort, useClass: CapacitorCamaraAdapter },
    { provide: GpsPort, useClass: CapacitorGpsAdapter },
    { provide: NitidezPort, useClass: CanvasNitidezAdapter },
    { provide: DashboardPort, useClass: SupabaseDashboardRepository },
    { provide: CorreccionPort, useClass: SupabaseCorreccionRepository },
    { provide: RecuperacionPort, useClass: SupabaseRecuperacionRepository },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
  ],
});
