import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthPort } from '../domain/ports/auth.port';
import { Perfil } from '../domain/models/perfil.model';

/** Estado de la sesión con Signals (ADR-005). */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly auth = inject(AuthPort);
  private readonly _perfil = signal<Perfil | null>(null);
  private restauracion?: Promise<void>;

  readonly perfil = this._perfil.asReadonly();
  readonly rol = computed(() => this._perfil()?.rol ?? null);

  /** Espera a que se recupere la sesión guardada (al abrir la app). */
  listo(): Promise<void> {
    this.restauracion ??= this.restaurar();
    return this.restauracion;
  }

  async iniciarSesion(cedula: string, clave: string): Promise<Perfil> {
    const perfil = await this.auth.iniciarSesion(cedula, clave);
    this._perfil.set(perfil);
    this.restauracion = Promise.resolve();
    return perfil;
  }

  async cerrarSesion(): Promise<void> {
    await this.auth.cerrarSesion();
    this._perfil.set(null);
  }

  /** A dónde va cada usuario después de iniciar sesión (ADR-007). */
  rutaInicio(perfil: Perfil | null = this._perfil()): string {
    if (!perfil) {
      return '/login';
    }
    if (perfil.debeCambiarClave) {
      return '/activar-cuenta';
    }
    const rutas = {
      provincial: '/provincial',
      coordinador_recinto: '/recinto',
      veedor: '/veedor',
    };
    return rutas[perfil.rol];
  }

  private async restaurar(): Promise<void> {
    try {
      this._perfil.set(await this.auth.perfilActual());
    } catch {
      this._perfil.set(null);
    }
  }
}