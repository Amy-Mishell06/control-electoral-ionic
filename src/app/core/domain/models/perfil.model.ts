import { Rol } from './rol.model';

/**(tabla perfiles, ADR-002). */
export interface Perfil {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  rol: Rol;
  recintoId: string | null;
  debeCambiarClave: boolean;
  correoVerificado: boolean;
}