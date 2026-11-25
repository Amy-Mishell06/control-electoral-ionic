import { Injectable, inject } from '@angular/core';
import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';
import { AuthPort } from '../../domain/ports/auth.port';
import { Perfil } from '../../domain/models/perfil.model';
import { Rol } from '../../domain/models/rol.model';
import { SUPABASE } from './supabase.client';

interface FilaPerfil {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  rol: Rol;
  recinto_id: string | null;
  debe_cambiar_clave: boolean;
  correo_verificado: boolean;
}

/** Autenticación con Supabase: login con cédula vía Edge Function (ADR-002, ADR-009). */
@Injectable()
export class SupabaseAuthRepository implements AuthPort {
  private readonly supabase = inject(SUPABASE);

  async iniciarSesion(cedula: string, clave: string): Promise<Perfil> {
    const { data, error } = await this.supabase.functions.invoke('login-cedula', {
      body: { cedula, clave },
    });
    if (error) {
      throw new Error(await mensajeDeError(error));
    }

    const { error: errorSesion } = await this.supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
    if (errorSesion) {
      throw new Error('No se pudo iniciar sesión. Inténtalo de nuevo.');
    }

    const perfil = await this.perfilActual();
    if (!perfil) {
      await this.cerrarSesion();
      throw new Error('Tu usuario no tiene un perfil asignado. Contacta a tu coordinador.');
    }
    return perfil;
  }

  async perfilActual(): Promise<Perfil | null> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) {
      return null;
    }
    const { data, error } = await this.supabase
      .from('perfiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle<FilaPerfil>();
    if (error || !data) {
      return null;
    }
    return aPerfil(data);
  }

  async cerrarSesion(): Promise<void> {
    await this.supabase.auth.signOut();
  }
    async enviarCodigo(correo: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithOtp({
      email: correo,
      options: { shouldCreateUser: false },
    });
    if (error) {
      throw new Error(mensajeAuth(error));
    }
  }

  async verificarCodigo(correo: string, codigo: string): Promise<void> {
    const { error } = await this.supabase.auth.verifyOtp({
      email: correo,
      token: codigo,
      type: 'email',
    });
    if (error) {
      throw new Error('El código no es válido o ya caducó. Pide uno nuevo.');
    }
  }

  async cambiarClave(clave: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({ password: clave });
    if (error) {
      throw new Error(mensajeAuth(error));
    }
  }

  async activarCuenta(): Promise<void> {
    const { error } = await this.supabase.rpc('activar_cuenta');
    if (error) {
      throw new Error('No se pudo activar la cuenta. Inténtalo de nuevo.');
    }
  }
}

function aPerfil(fila: FilaPerfil): Perfil {
  return {
    id: fila.id,
    cedula: fila.cedula,
    nombres: fila.nombres,
    apellidos: fila.apellidos,
    telefono: fila.telefono,
    correo: fila.correo,
    rol: fila.rol,
    recintoId: fila.recinto_id,
    debeCambiarClave: fila.debe_cambiar_clave,
    correoVerificado: fila.correo_verificado,
  };
}

/** Convierte los errores de la Edge Function en mensajes claros (ADR-008). */
async function mensajeDeError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const cuerpo = await error.context.json();
      if (cuerpo?.error) {
        return cuerpo.error;
      }
    } catch {
    }
  }
  if (error instanceof FunctionsFetchError) {
    return 'Sin conexión. Revisa tu internet e inténtalo de nuevo.';
  }
  return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
}

/** Mensajes claros para los errores de Supabase Auth (ADR-008). */
function mensajeAuth(error: { status?: number; message?: string }): string {
  const texto = (error.message ?? '').toLowerCase();
  if (error.status === 429 || texto.includes('rate') || texto.includes('seconds')) {
    return 'Espera un momento antes de pedir otro código.';
  }
  if (texto.includes('different') || texto.includes('same')) {
    return 'La nueva contraseña debe ser distinta de la actual.';
  }
  if (texto.includes('weak') || texto.includes('password')) {
    return 'La contraseña no es segura. Prueba con otra.';
  }
  return 'No se pudo completar la operación. Inténtalo de nuevo.';
}