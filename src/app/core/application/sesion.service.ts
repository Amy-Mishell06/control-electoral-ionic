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

    /** Paso 1 de la activación: envía el código al correo del usuario (ADR-011). */
  async enviarCodigoActivacion(): Promise<void> {
    const perfil = this._perfil();
    if (!perfil) {
      throw new Error('Tu sesión terminó. Vuelve a iniciar sesión.');
    }
    await this.auth.enviarCodigo(perfil.correo);
  }

  /** Paso 2: verifica el código de 6 dígitos. */
  async verificarCodigoActivacion(codigo: string): Promise<void> {
    const perfil = this._perfil();
    if (!perfil) {
      throw new Error('Tu sesión terminó. Vuelve a iniciar sesión.');
    }
    await this.auth.verificarCodigo(perfil.correo, codigo);
  }

  /** Paso 3: guarda la nueva contraseña y marca la cuenta como activada. */
  async completarActivacion(claveNueva: string): Promise<void> {
    await this.auth.cambiarClave(claveNueva);
    await this.auth.activarCuenta();
    const actual = this._perfil();
    if (actual) {
      this._perfil.set({ ...actual, debeCambiarClave: false, correoVerificado: true });
    }
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

