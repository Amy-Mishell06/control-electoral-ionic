import { Routes } from '@angular/router';
import {
  authGuard, cambioClaveGuard, invitadoGuard, rolGuard,
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
    canActivate: [authGuard],
    loadComponent: enConstruccion,
    data: { titulo: 'Activar cuenta' },
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