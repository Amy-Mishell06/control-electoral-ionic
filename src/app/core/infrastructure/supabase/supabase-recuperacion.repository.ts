import { Injectable, inject } from '@angular/core';
import { RecuperacionPort } from '../../domain/ports/recuperacion.port';
import { SUPABASE } from './supabase.client';

/**
 * Usa la plantilla "Reset Password" de Supabase, que muestra {{ .Token }}
 * y se envía por el SMTP de Brevo (ADR-011).
 */
@Injectable()
export class SupabaseRecuperacionRepository implements RecuperacionPort {
  private readonly supabase = inject(SUPABASE);

  async enviarCodigo(correo: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(correo);
    if (error) {
      if (error.status === 429) {
        throw new Error('Pediste muchos códigos seguidos. Espera un minuto e inténtalo otra vez.');
      }
      throw new Error('No se pudo enviar el código. Inténtalo de nuevo.');
    }
  }

  async verificarCodigo(correo: string, codigo: string): Promise<void> {
    const { error } = await this.supabase.auth.verifyOtp({ email: correo, token: codigo, type: 'recovery' });
    if (error) {
      throw new Error('El código no es válido o ya caducó.');
    }
  }

  async cambiarClave(clave: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({ password: clave });
    if (error) {
      throw new Error(
        error.code === 'same_password'
          ? 'La nueva contraseña debe ser distinta de la anterior.'
          : 'No se pudo cambiar la contraseña.',
      );
    }
  }

  async cerrarSesion(): Promise<void> {
    await this.supabase.auth.signOut();
  }
}
