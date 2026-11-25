import { NuevoUsuario, UsuarioCreado } from '../models/nuevo-usuario.model';

export abstract class UsuariosPort {
  abstract crear(usuario: NuevoUsuario): Promise<UsuarioCreado>;
}