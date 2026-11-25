import { Injectable, inject } from '@angular/core';
import { UsuariosPort } from '../../domain/ports/usuarios.port';
import { NuevoUsuario, UsuarioCreado } from '../../domain/models/nuevo-usuario.model';
import { SUPABASE } from './supabase.client';
import { mensajeDeFuncion } from './errores-funcion';

/** Crea usuarios con la Edge Function crear-usuario (ADR-002, ADR-009). */
@Injectable()
export class SupabaseUsuariosRepository implements UsuariosPort {
  private readonly supabase = inject(SUPABASE);

  async crear(usuario: NuevoUsuario): Promise<UsuarioCreado> {
    const { data, error } = await this.supabase.functions.invoke('crear-usuario', {
      body: {
        cedula: usuario.cedula,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        telefono: usuario.telefono,
        correo: usuario.correo,
        rol: usuario.rol,
        recinto_id: usuario.recintoId,
      },
    });
    if (error) {
      throw new Error(await mensajeDeFuncion(error, 'No se pudo crear el usuario.'));
    }
    return { id: data.id, bienvenidaEnviada: data.bienvenidaEnviada };
  }
}