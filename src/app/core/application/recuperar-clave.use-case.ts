import { Injectable, inject } from '@angular/core';
import { RecuperacionPort } from '../domain/ports/recuperacion.port';
import { validarClaveNueva } from '../domain/rules/clave.rule';

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODIGO = /^\d{6}$/;

/** Flujo de "¿Olvidaste tu contraseña?" en tres pasos: correo, código y clave nueva. */
@Injectable({ providedIn: 'root' })
export class RecuperarClaveUseCase {
  private readonly recuperacion = inject(RecuperacionPort);

  async enviarCodigo(correo: string): Promise<void> {
    const limpio = correo.trim().toLowerCase();
    if (!CORREO.test(limpio)) {
      throw new Error('Escribe un correo válido.');
    }
    await this.recuperacion.enviarCodigo(limpio);
  }

  async verificarCodigo(correo: string, codigo: string): Promise<void> {
    if (!CODIGO.test(codigo.trim())) {
      throw new Error('El código tiene 6 dígitos.');
    }
    await this.recuperacion.verificarCodigo(correo.trim().toLowerCase(), codigo.trim());
  }

  /** Guarda la clave nueva y cierra la sesión para que entre con ella desde el login. */
  async cambiarClave(clave: string, confirmacion: string): Promise<void> {
    const error = validarClaveNueva(clave);
    if (error) {
      throw new Error(error);
    }
    if (clave !== confirmacion) {
      throw new Error('Las contraseñas no coinciden.');
    }
    await this.recuperacion.cambiarClave(clave);
    await this.recuperacion.cerrarSesion();
  }
}
