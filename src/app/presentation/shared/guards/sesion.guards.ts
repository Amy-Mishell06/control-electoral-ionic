import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../../../core/application/sesion.service';
import { Rol } from '../../../core/domain/models/rol.model';

/** Sin sesión, al login (ADR-007). */
export const authGuard: CanActivateFn = async () => {
  const sesion = inject(SesionService);
  const router = inject(Router); // inject() siempre antes de cualquier await
  await sesion.listo();
  return sesion.perfil() ? true : router.createUrlTree(['/login']);
};

/** Si ya hay sesión, no muestra el login: lleva al inicio de su rol. */
export const invitadoGuard: CanActivateFn = async () => {
  const sesion = inject(SesionService);
  const router = inject(Router); // inject() siempre antes de cualquier await
  await sesion.listo();
  return sesion.perfil() ? router.createUrlTree([sesion.rutaInicio()]) : true;
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

/** La pantalla de activación solo se muestra si la cuenta aún no está activada. */
export const activacionPendienteGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  return sesion.perfil()?.debeCambiarClave
    ? true
    : inject(Router).createUrlTree([sesion.rutaInicio()]);
};
