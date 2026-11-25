import { Routes } from '@angular/router';
import {
  authGuard, cambioClaveGuard, invitadoGuard, rolGuard, activacionPendienteGuard,
} from './presentation/shared/guards/sesion.guards';

const enConstruccion = () =>
  import('./presentation/shared/en-construccion/en-construccion.page')
    .then((m) => m.EnConstruccionPage);

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    canActivate: [invitadoGuard],
    loadComponent: () =>
      import('./presentation/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'activar-cuenta',
    canActivate: [authGuard, activacionPendienteGuard],
    loadComponent: () =>
      import('./presentation/auth/activar-cuenta/activar-cuenta.page')
        .then((m) => m.ActivarCuentaPage),
  },
  {
    path: 'provincial',
    canActivate: [authGuard, cambioClaveGuard, rolGuard('provincial')],
    loadComponent: enConstruccion,
    data: { titulo: 'Coordinación provincial' },
  },
  {
    path: 'recinto',
    canActivate: [authGuard, cambioClaveGuard, rolGuard('coordinador_recinto')],
    loadComponent: enConstruccion,
    data: { titulo: 'Coordinación de recinto' },
  },
  {
    path: 'veedor',
    canActivate: [authGuard, cambioClaveGuard, rolGuard('veedor')],
    loadComponent: enConstruccion,
    data: { titulo: 'Mis mesas' },
  },
  { path: '**', redirectTo: 'login' },
];