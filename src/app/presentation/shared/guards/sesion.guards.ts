import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../../../core/application/sesion.service';
import { Rol } from '../../../core/domain/models/rol.model';

/** Sin sesión, al login (ADR-007). */
export const authGuard: CanActivateFn = async () => {
  const sesion = inject(SesionService);
  await sesion.listo();
  return sesion.perfil() ? true : inject(Router).createUrlTree(['/login']);
};

/** Si ya hay sesión, no muestra el login: lleva al inicio de su rol. */
export const invitadoGuard: CanActivateFn = async () => {
  const sesion = inject(SesionService);
  await sesion.listo();
  return sesion.perfil() ? inject(Router).createUrlTree([sesion.rutaInicio()]) : true;
};

/** Primer acceso: obliga a activar la cuenta y cambiar la contraseña (R3, ADR-011). */
export const cambioClaveGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  return sesion.perfil()?.debeCambiarClave
    ? inject(Router).createUrlTree(['/activar-cuenta'])
    : true;
};

export function rolGuard(...roles: Rol[]): CanActivateFn {
  return () => {
    const sesion = inject(SesionService);
    const rol = sesion.rol();
    return rol && roles.includes(rol)
      ? true
      : inject(Router).createUrlTree([sesion.rutaInicio()]);
  };
}