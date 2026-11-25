import { Injectable, inject } from '@angular/core';
import { UsuariosPort } from '../domain/ports/usuarios.port';
import { NuevoUsuario, UsuarioCreado } from '../domain/models/nuevo-usuario.model';
import { validarDatosPersona } from '../domain/rules/usuario.rule';

/** Caso de uso: crear un coordinador o un veedor (ADR-004). */
@Injectable({ providedIn: 'root' })
export class CrearUsuarioUseCase {
  private readonly usuarios = inject(UsuariosPort);

  async ejecutar(usuario: NuevoUsuario): Promise<UsuarioCreado> {
    const motivo = validarDatosPersona(usuario);
    if (motivo) {
      throw new Error(motivo); // no se llama al servidor con datos inválidos
    }
    return this.usuarios.crear({
      ...usuario,
      cedula: usuario.cedula.trim(),
      nombres: usuario.nombres.trim(),
      apellidos: usuario.apellidos.trim(),
      telefono: usuario.telefono.trim(),
      correo: usuario.correo.trim().toLowerCase(),
    });
  }
}